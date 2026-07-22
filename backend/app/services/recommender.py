import random
from app.core.security import supabase
from app.services.llm_provider import llm_provider

async def generate_recommendations(user_id: str) -> list:
    if not supabase:
        return []

    try:
        # 1. Fetch user's profile
        profile_res = supabase.table("learning_profiles").select("*").eq("user_id", user_id).execute()
        if not profile_res.data:
            return []
        profile = profile_res.data[0]
        career_id = profile.get("career_id")
        
        if not career_id:
            return []

        # 2. Find target skills from the roadmap (unlocked but not mastered)
        skills_res = supabase.table("skills").select("*").eq("career_id", career_id).execute()
        skills = skills_res.data or []
        
        prereqs_res = supabase.table("skill_prerequisites").select("*").execute()
        prereq_map = {}
        for p in (prereqs_res.data or []):
            sid = p["skill_id"]
            if sid not in prereq_map:
                prereq_map[sid] = []
            prereq_map[sid].append(p["prerequisite_id"])

        mastery_res = supabase.table("user_skill_mastery").select("skill_id, mastery_level").eq("user_id", user_id).execute()
        mastery_map = {m["skill_id"]: m["mastery_level"] for m in (mastery_res.data or [])}

        target_skill_slugs = []
        for skill in skills:
            sid = skill["id"]
            if mastery_map.get(sid, 0) >= 0.8:
                continue  # Already mastered
                
            skill_prereqs = prereq_map.get(sid, [])
            is_unlocked = all(mastery_map.get(p, 0) >= 0.5 for p in skill_prereqs) if skill_prereqs else True
            
            if is_unlocked:
                target_skill_slugs.append(skill["slug"])

        if not target_skill_slugs:
            # If no target skills (e.g. everything mastered), fallback to general skills
            target_skill_slugs = [s["slug"] for s in skills]

        # 3. Fetch candidate resources
        existing_recs_res = supabase.table("recommendations").select("resource_id").eq("user_id", user_id).execute()
        existing_resource_ids = {r["resource_id"] for r in (existing_recs_res.data or [])}

        resources_res = supabase.table("resources").select("*").execute()
        candidates = []
        for res in (resources_res.data or []):
            if res["id"] in existing_resource_ids:
                continue
            
            # Check if resource overlaps with our target skills
            res_skills = res.get("skills", [])
            overlap = set(res_skills).intersection(set(target_skill_slugs))
            if overlap:
                candidates.append(res)

        # Fallback if candidates is empty (just grab random ones to prevent empty states)
        if not candidates:
            candidates = [r for r in (resources_res.data or []) if r["id"] not in existing_resource_ids]

        # 4. Score candidates
        scored_candidates = []
        for res in candidates:
            # Check overlap again to boost score
            res_skills = res.get("skills", [])
            overlap = set(res_skills).intersection(set(target_skill_slugs))
            skill_match_boost = 1.0 if overlap else 0.2

            difficulty = 1.0 if res.get("difficulty") == profile.get("experience") else 0.5
            quality = min(res.get("like_count", 0) / max(res.get("view_count", 1), 1) * 100, 1.0)
            duration_fit = 1.0 if res.get("duration_seconds", 0) / 60 <= profile.get("daily_minutes", 60) else 0.5
            freshness = 0.8
            
            score = (skill_match_boost * 0.4) + (difficulty * 0.25) + (quality * 0.2) + (duration_fit * 0.1) + (freshness * 0.05)
            scored_candidates.append({
                "resource": res,
                "score": score
            })

        # Sort and take top 3
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_candidates = scored_candidates[:3]

        recommendations = []
        # Generate explanations and insert
        for item in top_candidates:
            res = item["resource"]
            explanation = await llm_provider.generate_explanation(
                user_context=profile,
                resource_title=res.get("title")
            )
            
            # Insert into DB
            rec_data = {
                "user_id": user_id,
                "resource_id": res.get("id"),
                "score": item["score"],
                "explanation": explanation,
                "status": "pending"
            }
            insert_res = supabase.table("recommendations").insert(rec_data).execute()
            
            inserted = insert_res.data[0]
            inserted["resource"] = res
            recommendations.append(inserted)

        return recommendations
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return []
