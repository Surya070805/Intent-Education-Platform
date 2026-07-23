"""
Bloom Recommendation Engine

Scores candidate resources using the Bloom Learning Score — a weighted formula
that optimizes for learning outcomes, not engagement metrics.

Bloom Learning Score =
  0.35 × skill_gap_score       (biggest gap = highest priority)
+ 0.20 × prerequisite_match    (can the learner actually understand this?)
+ 0.15 × difficulty_match      (right level of challenge)
+ 0.15 × content_quality       (educational quality, not just popularity)
+ 0.10 × learning_style_match  (matches how they prefer to learn)
+ 0.05 × freshness             (prefer recent content)
"""

from datetime import datetime, timezone
from app.core.security import supabase
from app.services.llm_provider import llm_provider
from app.services.skill_gap_analyzer import compute_skill_gaps


async def generate_recommendations(user_id: str) -> list:
    if not supabase:
        return []

    try:
        # 1. Fetch user's learning profile
        profile_res = supabase.table("learning_profiles").select("*").eq("user_id", user_id).execute()
        if not profile_res.data:
            return []
        profile = profile_res.data[0]
        career_id = profile.get("career_id")
        if not career_id:
            return []

        # 2. Compute skill gaps (the core of Bloom's intelligence)
        skill_gaps = await compute_skill_gaps(user_id)

        # Build lookup maps from skill gap data
        gap_by_slug: dict[str, float] = {s["skill_slug"]: s["gap"] for s in skill_gaps}
        unlocked_slugs: set[str] = {s["skill_slug"] for s in skill_gaps if s["is_unlocked"] and not s["is_mastered"]}
        mastered_slugs: set[str] = {s["skill_slug"] for s in skill_gaps if s["is_mastered"]}

        # 3. Fetch candidate resources (not yet recommended)
        existing_recs_res = supabase.table("recommendations").select("resource_id").eq("user_id", user_id).execute()
        existing_resource_ids = {r["resource_id"] for r in (existing_recs_res.data or [])}

        resources_res = supabase.table("resources").select("*").execute()
        all_resources = resources_res.data or []

        # 4. Filter and score each resource using the Bloom Learning Score
        scored_candidates = []
        now = datetime.now(timezone.utc)

        for res in all_resources:
            if res["id"] in existing_resource_ids:
                continue

            res_skills: list[str] = res.get("skills") or []

            # --- A. Skill Gap Score (0.0–1.0) ---
            # Average gap across all skills this resource teaches
            # Prioritize resources that teach skills with large gaps
            if res_skills:
                gap_scores = [gap_by_slug.get(slug, 0.0) for slug in res_skills]
                skill_gap_score = sum(gap_scores) / len(gap_scores)
            else:
                skill_gap_score = 0.1  # Unknown skills get low priority

            # --- B. Prerequisite Match (0.0 or 1.0) ---
            # Is the learner actually ready for this content?
            if res_skills:
                skills_that_are_unlocked = [s for s in res_skills if s in unlocked_slugs]
                skills_that_are_mastered = [s for s in res_skills if s in mastered_slugs]
                if skills_that_are_unlocked:
                    prerequisite_match = 1.0  # At least one skill is unlocked and needed
                elif skills_that_are_mastered:
                    prerequisite_match = 0.1  # All skills already mastered — low value
                else:
                    prerequisite_match = 0.3  # Unknown / locked skills
            else:
                prerequisite_match = 0.3

            # --- C. Difficulty Match (0.0–1.0) ---
            experience = profile.get("experience", "beginner")
            res_difficulty = res.get("difficulty", "beginner")
            difficulty_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
            exp_level = difficulty_map.get(experience, 0)
            diff_level = difficulty_map.get(res_difficulty, 0)
            diff_distance = abs(exp_level - diff_level)
            difficulty_match = 1.0 if diff_distance == 0 else (0.5 if diff_distance == 1 else 0.1)

            # --- D. Content Quality (0.0–1.0) ---
            # Use like/view ratio as a quality signal (educational proxy)
            view_count = max(res.get("view_count", 0) or 0, 1)
            like_count = res.get("like_count", 0) or 0
            # Normalize: a 5% like ratio is excellent for educational content
            raw_quality = like_count / view_count
            content_quality = min(raw_quality / 0.05, 1.0)

            # --- E. Learning Style Match (0.0–1.0) ---
            # Basic heuristic: if user prefers video, all YouTube is fine.
            # In future: tag resources by format (tutorial/lecture/project)
            learning_style = profile.get("learning_style", "video")
            style_match = 1.0 if learning_style == "video" else 0.7

            # --- F. Freshness (0.0–1.0) ---
            published_at = res.get("published_at")
            if published_at:
                try:
                    pub_date = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                    age_days = (now - pub_date).days
                    # Videos under 1 year = 1.0; 5 years = 0.0
                    freshness = max(1.0 - (age_days / (365 * 5)), 0.0)
                except Exception:
                    freshness = 0.5
            else:
                freshness = 0.5

            # --- Final Bloom Learning Score ---
            bloom_score = (
                (0.35 * skill_gap_score) +
                (0.20 * prerequisite_match) +
                (0.15 * difficulty_match) +
                (0.15 * content_quality) +
                (0.10 * style_match) +
                (0.05 * freshness)
            )

            # Determine the primary skill this resource targets
            primary_skill_slug = None
            best_gap = -1.0
            for slug in res_skills:
                if slug in unlocked_slugs and gap_by_slug.get(slug, 0) > best_gap:
                    best_gap = gap_by_slug[slug]
                    primary_skill_slug = slug

            scored_candidates.append({
                "resource": res,
                "score": bloom_score,
                "primary_skill_slug": primary_skill_slug,
                "score_breakdown": {
                    "skill_gap": skill_gap_score,
                    "prerequisite_match": prerequisite_match,
                    "difficulty_match": difficulty_match,
                    "content_quality": content_quality,
                    "learning_style": style_match,
                    "freshness": freshness,
                }
            })

        # 5. Sort by Bloom score and take top 5
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_candidates = scored_candidates[:5]

        # 6. Resolve primary_skill_slug → skill_id for storage
        all_slugs = [c["primary_skill_slug"] for c in top_candidates if c["primary_skill_slug"]]
        skill_id_map: dict[str, str] = {}
        if all_slugs:
            skill_ids_res = supabase.table("skills").select("id, slug").in_("slug", all_slugs).execute()
            skill_id_map = {s["slug"]: s["id"] for s in (skill_ids_res.data or [])}

        # 7. Generate LLM explanations and insert recommendations
        recommendations = []
        for item in top_candidates:
            res = item["resource"]
            primary_slug = item["primary_skill_slug"]
            skill_id = skill_id_map.get(primary_slug) if primary_slug else None

            explanation = await llm_provider.generate_explanation(
                user_context=profile,
                resource_title=res.get("title")
            )

            rec_data = {
                "user_id": user_id,
                "resource_id": res.get("id"),
                "skill_id": skill_id,
                "score": item["score"],
                "explanation": explanation,
                "status": "pending",
            }
            insert_res = supabase.table("recommendations").insert(rec_data).execute()

            if insert_res.data:
                inserted = insert_res.data[0]
                inserted["resource"] = res
                inserted["score_breakdown"] = item["score_breakdown"]
                recommendations.append(inserted)

        return recommendations

    except Exception as e:
        print(f"[Recommender] Error generating recommendations: {e}")
        return []
