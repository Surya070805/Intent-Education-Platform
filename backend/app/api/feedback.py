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
    profile = {"inferred_skills": [], "focus_areas": []}
    if supabase:
        try:
            res = supabase.table("user_profiles").select("*").eq("user_id", current_user.id).execute()
            if res.data:
                profile = res.data[0]
        except Exception as e:
            print(f"DB Error: {e}")

    # 2. Analyze notes and rating via LLM to determine profile updates
    profile_updates = await llm_provider.analyze_session_feedback(
        profile=profile,
        notes=request.notes,
        rating=request.rating
    )

    # 3. Save feedback to analytics_events or feedback table (mocked if no db)
    if supabase:
        try:
            supabase.table("analytics_events").insert({
                "user_id": current_user.id,
                "event_type": "session_feedback",
                "event_data": {
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
