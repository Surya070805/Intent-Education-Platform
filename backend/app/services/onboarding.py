from app.services.llm_provider import llm_provider
from app.core.security import supabase

async def process_onboarding(user_id: str, context: dict) -> dict:
    """
    1. Pass context to LLM to generate learning intent
    2. Map to a career track
    3. Save the profile to Supabase
    """
    # 1. Generate intent with LLM
    intent_profile = await llm_provider.generate_intent_profile(context)
    
    # 2. Map career (Hardcoded slug lookup for MVP)
    career_slug = "full-stack-dev"
    if "data" in context.get("career_goal", "").lower() or "ai" in context.get("career_goal", "").lower():
        career_slug = "data-science-ai"

    if supabase:
        try:
            # Ensure user exists in public.users (MVP workaround for missing trigger)
            user_exists = supabase.table("users").select("id").eq("id", user_id).execute()
            if not user_exists.data:
                supabase.table("users").insert({"id": user_id}).execute()

            # Fetch career ID
            career_res = supabase.table("careers").select("id").eq("slug", career_slug).execute()
            career_id = career_res.data[0]["id"] if career_res.data else None

            # Insert or update learning_profiles
            profile_data = {
                "user_id": user_id,
                "career_id": career_id,
                "experience": context.get("experience"),
                "learning_style": context.get("learning_style"),
                "daily_minutes": context.get("daily_minutes"),
                "known_skills": intent_profile.get("inferred_skills", [])
            }
            
            # Upsert
            supabase.table("learning_profiles").upsert(profile_data).execute()
        except Exception as e:
            print(f"Supabase error during onboarding: {e}")

    # Return the generated intent and context
    return {
        "status": "success",
        "intent_profile": intent_profile,
        "career_mapped": career_slug
    }
