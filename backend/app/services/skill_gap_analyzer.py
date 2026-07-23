"""
Skill Gap Analyzer — computes the gap between what a learner knows
and what their career target requires.

Used by the Recommendation Engine to prioritize resources that 
address the largest knowledge gaps.
"""

from app.core.security import supabase


async def compute_skill_gaps(user_id: str) -> list[dict]:
    """
    Returns a list of skills the user needs to learn, sorted by:
    1. Gap size (largest gap first)
    2. Whether the skill is unlocked (prerequisites met)

    Each item:
    {
        "skill_id": str,
        "skill_slug": str,
        "skill_name": str,
        "level": str,
        "mastery": float,
        "gap": float,          # 1.0 - mastery
        "is_unlocked": bool,
        "is_mastered": bool,
    }
    """
    if not supabase:
        return []

    try:
        # 1. Get user's career
        profile_res = supabase.table("learning_profiles") \
            .select("career_id, experience") \
            .eq("user_id", user_id) \
            .execute()

        if not profile_res.data:
            return []

        career_id = profile_res.data[0].get("career_id")
        if not career_id:
            return []

        # 2. Fetch all skills for this career
        skills_res = supabase.table("skills") \
            .select("id, name, slug, level, estimated_hours") \
            .eq("career_id", career_id) \
            .execute()
        skills = skills_res.data or []

        # 3. Fetch prerequisite graph
        prereqs_res = supabase.table("skill_prerequisites").select("*").execute()
        prereq_map: dict[str, list[str]] = {}
        for p in (prereqs_res.data or []):
            sid = p["skill_id"]
            if sid not in prereq_map:
                prereq_map[sid] = []
            prereq_map[sid].append(p["prerequisite_id"])

        # 4. Fetch current mastery
        mastery_res = supabase.table("user_skill_mastery") \
            .select("skill_id, mastery_level") \
            .eq("user_id", user_id) \
            .execute()
        mastery_map: dict[str, float] = {
            m["skill_id"]: m["mastery_level"]
            for m in (mastery_res.data or [])
        }

        # 5. Compute gaps and unlock status
        gaps = []
        for skill in skills:
            sid = skill["id"]
            mastery = mastery_map.get(sid, 0.0)
            gap = 1.0 - mastery

            skill_prereqs = prereq_map.get(sid, [])
            is_unlocked = all(
                mastery_map.get(p, 0) >= 0.5 for p in skill_prereqs
            ) if skill_prereqs else True

            is_mastered = mastery >= 0.8

            gaps.append({
                "skill_id": sid,
                "skill_slug": skill["slug"],
                "skill_name": skill["name"],
                "level": skill.get("level", "foundation"),
                "estimated_hours": skill.get("estimated_hours", 0),
                "mastery": mastery,
                "gap": gap,
                "is_unlocked": is_unlocked,
                "is_mastered": is_mastered,
            })

        # Sort: unlocked + unmastered first, then by gap size descending
        gaps.sort(key=lambda x: (
            0 if (x["is_unlocked"] and not x["is_mastered"]) else 1,
            -x["gap"]
        ))

        return gaps

    except Exception as e:
        print(f"[SkillGapAnalyzer] Error computing gaps: {e}")
        return []


async def get_next_skill(user_id: str) -> dict | None:
    """
    Returns the single most important skill the learner should focus on next.
    This is the unlocked skill with the largest gap.
    """
    gaps = await compute_skill_gaps(user_id)
    for skill in gaps:
        if skill["is_unlocked"] and not skill["is_mastered"]:
            return skill
    return None
