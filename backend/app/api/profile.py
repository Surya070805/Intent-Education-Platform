from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user, User, supabase

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    career_goal: Optional[str] = None
    experience: Optional[str] = None
    learning_style: Optional[str] = None
    daily_minutes: Optional[int] = None
    guard_mode_enabled: Optional[bool] = None


@router.get("/")
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the user's full profile including learning preferences and AI summary.
    """
    if not supabase:
        return {"user": None, "learning_profile": None}

    try:
        # Get user info
        user_res = supabase.table("users") \
            .select("*") \
            .eq("id", current_user.id) \
            .execute()
        user_data = user_res.data[0] if user_res.data else {"id": current_user.id, "email": current_user.email}

        # Get learning profile with career info
        profile_res = supabase.table("learning_profiles") \
            .select("*, career:careers(name, slug, description)") \
            .eq("user_id", current_user.id) \
            .execute()
        profile_data = profile_res.data[0] if profile_res.data else None

        return {
            "user": user_data,
            "learning_profile": profile_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update user profile and learning preferences.
    """
    if not supabase:
        return {"status": "success", "message": "Mock update"}

    try:
        # Update display_name in users table
        if request.display_name is not None:
            supabase.table("users") \
                .update({"display_name": request.display_name}) \
                .eq("id", current_user.id) \
                .execute()

        # Update learning profile fields
        profile_updates = {}
        if request.experience is not None:
            profile_updates["experience"] = request.experience
        if request.learning_style is not None:
            profile_updates["learning_style"] = request.learning_style
        if request.daily_minutes is not None:
            profile_updates["daily_minutes"] = request.daily_minutes
        if request.guard_mode_enabled is not None:
            profile_updates["guard_mode_enabled"] = request.guard_mode_enabled

        # Handle career goal change
        if request.career_goal is not None:
            career_res = supabase.table("careers") \
                .select("id") \
                .eq("slug", request.career_goal) \
                .execute()
            if career_res.data:
                new_career_id = career_res.data[0]["id"]
                
                # Check if it actually changed
                profile_res = supabase.table("learning_profiles").select("career_id").eq("user_id", current_user.id).execute()
                old_career_id = profile_res.data[0]["career_id"] if profile_res.data else None
                
                if new_career_id != old_career_id:
                    profile_updates["career_id"] = new_career_id
                    # Clear pending recommendations because the learning path changed
                    supabase.table("recommendations").delete().eq("user_id", current_user.id).eq("status", "pending").execute()

        if profile_updates:
            supabase.table("learning_profiles") \
                .update(profile_updates) \
                .eq("user_id", current_user.id) \
                .execute()

        return {"status": "success", "message": "Profile updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def delete_account(current_user: User = Depends(get_current_user)):
    """
    Delete the user's account and all associated data.
    """
    if not supabase:
        return {"status": "success", "message": "Mock delete"}

    try:
        # Delete from public.users (cascades to all related tables)
        supabase.table("users") \
            .delete() \
            .eq("id", current_user.id) \
            .execute()

        return {"status": "success", "message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
