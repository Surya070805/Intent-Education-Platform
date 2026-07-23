"""
Mastery Engine — updates learner skill mastery when a learning session ends.

Logic:
  mastery_delta = base_gain × quality_multiplier × completion_multiplier

  base_gain      = 0.15  (a full video contributes 15% progress toward a skill)
  quality        = rating / 5.0  (if no rating provided, defaults to 0.8)
  completion     = 1.0 if watched >= 80% of resource duration, else 0.5
  
  Final mastery is capped at 1.0 (100%).
  A skill is considered "mastered" at >= 0.8 (80%).
"""

from app.core.security import supabase

BASE_GAIN = 0.15
MASTERY_THRESHOLD = 0.8  # Considered mastered


async def update_mastery(
    user_id: str,
    resource_id: str,
    duration_watched_seconds: int,
    rating: int | None = None
) -> list[dict]:
    """
    Called when a learning session ends.
    Fetches the resource's associated skills and upserts mastery for each.
    
    Returns the list of updated mastery records.
    """
    if not supabase:
        return []

    try:
        # 1. Fetch the resource to get its skills and total duration
        resource_res = supabase.table("resources") \
            .select("skills, duration_seconds") \
            .eq("id", resource_id) \
            .execute()

        if not resource_res.data:
            return []

        resource = resource_res.data[0]
        skill_slugs: list = resource.get("skills") or []
        resource_duration = resource.get("duration_seconds") or 0

        if not skill_slugs:
            return []

        # 2. Compute multipliers
        quality_multiplier = (rating / 5.0) if rating else 0.8
        if resource_duration > 0:
            completion_ratio = duration_watched_seconds / resource_duration
            completion_multiplier = 1.0 if completion_ratio >= 0.8 else 0.5
        else:
            completion_multiplier = 1.0

        mastery_delta = BASE_GAIN * quality_multiplier * completion_multiplier

        # 3. Resolve skill slugs → skill IDs
        skills_res = supabase.table("skills") \
            .select("id, slug") \
            .in_("slug", skill_slugs) \
            .execute()

        skill_id_map = {s["slug"]: s["id"] for s in (skills_res.data or [])}

        # 4. Fetch current mastery for these skills
        skill_ids = list(skill_id_map.values())
        if not skill_ids:
            return []

        current_mastery_res = supabase.table("user_skill_mastery") \
            .select("skill_id, mastery_level") \
            .eq("user_id", user_id) \
            .in_("skill_id", skill_ids) \
            .execute()

        current_mastery_map = {
            m["skill_id"]: m["mastery_level"]
            for m in (current_mastery_res.data or [])
        }

        # 5. Upsert updated mastery for each skill
        updated = []
        for slug, skill_id in skill_id_map.items():
            current = current_mastery_map.get(skill_id, 0.0)
            new_mastery = min(current + mastery_delta, 1.0)  # Cap at 1.0

            upsert_res = supabase.table("user_skill_mastery").upsert({
                "user_id": user_id,
                "skill_id": skill_id,
                "mastery_level": new_mastery,
            }).execute()

            updated.append({
                "skill_slug": slug,
                "skill_id": skill_id,
                "old_mastery": current,
                "new_mastery": new_mastery,
                "delta": mastery_delta,
                "mastered": new_mastery >= MASTERY_THRESHOLD,
            })

        return updated

    except Exception as e:
        print(f"[MasteryEngine] Error updating mastery: {e}")
        return []


def get_mastery_label(mastery_level: float) -> str:
    """Returns a human-readable label for a mastery level."""
    if mastery_level >= MASTERY_THRESHOLD:
        return "mastered"
    elif mastery_level >= 0.4:
        return "in_progress"
    elif mastery_level > 0:
        return "started"
    else:
        return "not_started"
