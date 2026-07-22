from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user, User, supabase
from app.services.llm_provider import llm_provider
from app.services.youtube import fetch_video_metadata

router = APIRouter(prefix="/api/v1/guard", tags=["Guard Mode"])

class GuardCheckResponse(BaseModel):
    is_relevant: bool
    reason: str
    guard_mode_enabled: bool

@router.get("/check", response_model=GuardCheckResponse)
async def check_guard(youtube_id: str, current_user: User = Depends(get_current_user)):
    """
    Checks if a given YouTube video aligns with the user's career goals.
    Also returns whether Guard Mode is enabled for the user.
    """
    if not supabase:
        return GuardCheckResponse(is_relevant=True, reason="Mock mode", guard_mode_enabled=False)

    try:
        # 1. Fetch user's profile to see if Guard Mode is enabled and get career goal
        profile_res = supabase.table("learning_profiles").select("career_id, guard_mode_enabled").eq("user_id", current_user.id).execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        profile = profile_res.data[0]
        guard_mode_enabled = profile.get("guard_mode_enabled", True)
        career_id = profile.get("career_id")

        if not guard_mode_enabled:
            # If disabled, everything is "relevant" and won't be blocked.
            return GuardCheckResponse(is_relevant=True, reason="Guard Mode is disabled.", guard_mode_enabled=False)

        if not career_id:
            return GuardCheckResponse(is_relevant=True, reason="No career goal set.", guard_mode_enabled=True)

        # 2. Get career details
        career_res = supabase.table("careers").select("name").eq("id", career_id).execute()
        career_name = career_res.data[0]["name"] if career_res.data else "General Tech"

        # 3. Fast path: Is this video in our curated resources?
        resource_res = supabase.table("resources").select("id, title, channel_name").eq("youtube_id", youtube_id).execute()
        
        if resource_res.data:
            # It's a curated resource, we allow it.
            return GuardCheckResponse(
                is_relevant=True, 
                reason="This is a curated learning resource on your path.", 
                guard_mode_enabled=True
            )

        # 4. Slow path: Fetch metadata and use LLM to classify
        meta = fetch_video_metadata(youtube_id)
        if not meta:
            # Can't check, just allow it
            return GuardCheckResponse(is_relevant=True, reason="Could not verify video.", guard_mode_enabled=True)

        video_title = meta.get("title", "")
        channel_name = meta.get("channel_name", "")

        # Use LLM to check relevance
        relevance = await llm_provider.check_guard_relevance(
            career_goal=career_name,
            video_title=video_title,
            channel_name=channel_name
        )

        return GuardCheckResponse(
            is_relevant=relevance.get("is_relevant", True),
            reason=relevance.get("reason", "Verified via AI Guard."),
            guard_mode_enabled=True
        )

    except Exception as e:
        print(f"Error checking guard relevance: {e}")
        return GuardCheckResponse(is_relevant=True, reason="Error during check.", guard_mode_enabled=False)
