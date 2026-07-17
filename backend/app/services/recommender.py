import random
from app.core.security import supabase
from app.services.llm_provider import llm_provider

async def generate_recommendations(user_id: str) -> list:
    """
    1. Fetch user's profile and skills.
    2. Fetch candidate resources.
    3. Score them using the formula.
    4. Pick top 3.
    5. Generate LLM explanations.
    6. Save and return.
    """
    if not supabase:
        # Return mock recommendations
        return [
            {
                "id": "mock-1",
                "resource": {
                    "title": "Mock React Tutorial",
                    "channel_name": "Mock Code",
                    "duration_seconds": 1200,
                    "thumbnail_url": "https://img.youtube.com/vi/mock/hqdefault.jpg",
                    "skills": ["react", "frontend"]
                },
                "score": 0.85,
                "explanation": "This mock tutorial is perfect for you."
            }
        ]

    try:
        # Fetch profile
        profile_res = supabase.table("learning_profiles").select("*").eq("user_id", user_id).execute()
        if not profile_res.data:
            return []
        profile = profile_res.data[0]

        # Fetch candidate resources (in a real app, you'd filter by career or skills)
        resources_res = supabase.table("resources").select("*").execute()
        candidates = resources_res.data

        scored_candidates = []
        for res in candidates:
            # MVP Scoring Formula (Mocked values for the components)
            # score = (skill_gap * 0.4) + (difficulty * 0.25) + (quality * 0.2) + (duration * 0.1) + (freshness * 0.05)
            
            # Simulated metrics for MVP
            skill_gap = random.uniform(0.5, 1.0) 
            difficulty = 1.0 if res.get("difficulty") == profile.get("experience") else 0.5
            quality = min(res.get("like_count", 0) / max(res.get("view_count", 1), 1) * 100, 1.0)
            duration_fit = 1.0 if res.get("duration_seconds", 0) / 60 <= profile.get("daily_minutes", 60) else 0.5
            freshness = 0.8
            
            score = (skill_gap * 0.4) + (difficulty * 0.25) + (quality * 0.2) + (duration_fit * 0.1) + (freshness * 0.05)
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
