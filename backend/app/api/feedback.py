from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.security import get_current_user, User, supabase
from app.services.llm_provider import llm_provider

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])

class FeedbackRequest(BaseModel):
    rating: int
    notes: List[Dict[str, str]]

@router.post("/session/{session_id}")
async def submit_feedback(
    session_id: str,
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit end-of-session feedback and notes, triggering an LLM profile update.
    """
    # 1. Fetch user's current profile from DB
    profile = {"known_skills": [], "focus_areas": []}
    if supabase:
        try:
            res = supabase.table("learning_profiles").select("*").eq("user_id", current_user.id).execute()
            if res.data:
                profile = res.data[0]
                if not profile.get("known_skills"):
                    profile["known_skills"] = []
        except Exception as e:
            print(f"DB Error fetching profile: {e}")

    # 2. Analyze notes and rating via LLM to get qualitative updates
    profile_updates = await llm_provider.analyze_session_feedback(
        profile=profile,
        notes=request.notes,
        rating=request.rating
    )

    # 3. Update Mastery and save feedback
    if supabase:
        try:
            # Mark recommendation as completed and get the resource's skills
            session_res = supabase.table("learning_sessions").select("recommendation_id, resource:resources(skills)").eq("id", session_id).execute()
            
            resource_skills = []
            if session_res.data:
                rec_id = session_res.data[0].get("recommendation_id")
                resource = session_res.data[0].get("resource")
                if rec_id:
                    supabase.table("recommendations").update({"status": "completed"}).eq("id", rec_id).execute()
                    
                # Mark session as completed
                supabase.table("learning_sessions").update({
                    "status": "completed",
                    "completed_at": "now()"
                }).eq("id", session_id).execute()
                
                if resource and isinstance(resource, dict):
                    resource_skills = resource.get("skills") or []
                elif resource and isinstance(resource, list) and len(resource) > 0:
                    resource_skills = resource[0].get("skills") or []

            # Resolve skill slugs to skill UUIDs
            if resource_skills:
                skills_res = supabase.table("skills").select("id, slug").in_("slug", resource_skills).execute()
                skill_ids = [s["id"] for s in (skills_res.data or [])]

                # Calculate mastery increment
                increment = 0.0
                if request.rating == 5:
                    increment = 0.3
                elif request.rating == 4:
                    increment = 0.15
                elif request.rating == 3:
                    increment = 0.05
                
                if increment > 0 and skill_ids:
                    # Fetch current mastery levels
                    current_mastery_res = supabase.table("user_skill_mastery").select("skill_id, mastery_level").eq("user_id", current_user.id).in_("skill_id", skill_ids).execute()
                    current_mastery = {m["skill_id"]: m["mastery_level"] for m in (current_mastery_res.data or [])}

                    # Upsert mastery for each skill
                    for sid in skill_ids:
                        old_level = current_mastery.get(sid, 0.0)
                        new_level = min(old_level + increment, 1.0)
                        
                        supabase.table("user_skill_mastery").upsert({
                            "user_id": current_user.id,
                            "skill_id": sid,
                            "mastery_level": new_level
                        }).execute()

            # Save the raw feedback event
            supabase.table("analytics_events").insert({
                "user_id": current_user.id,
                "event_type": "session_feedback",
                "metadata": {
                    "session_id": session_id,
                    "rating": request.rating,
                    "notes": request.notes,
                    "ai_updates": profile_updates
                }
            }).execute()
        except Exception as e:
            print(f"DB Error saving event: {e}")

    return {
        "status": "success",
        "message": "Feedback processed successfully.",
        "ai_profile_updates": profile_updates
    }
