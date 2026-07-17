from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.security import get_current_user, User, supabase
from app.services.recommender import generate_recommendations
from app.services.youtube import fetch_video_metadata

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])

class StatusUpdateRequest(BaseModel):
    status: str  # 'saved', 'dismissed', 'completed'

@router.get("/")
async def get_recommendations(current_user: User = Depends(get_current_user)):
    """
    Fetch active (pending/saved) recommendations for the user.
    """
    if not supabase:
        return []
    
    try:
        # Fetch recommendations + nested resource
        res = supabase.table("recommendations") \
            .select("*, resource:resources(*)") \
            .eq("user_id", current_user.id) \
            .in_("status", ["pending", "saved"]) \
            .order("score", desc=True) \
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def trigger_generation(current_user: User = Depends(get_current_user)):
    """
    Trigger the recommendation engine to generate new recommendations.
    """
    recs = await generate_recommendations(current_user.id)
    return recs

@router.patch("/{rec_id}")
async def update_status(
    rec_id: str, 
    request: StatusUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update the status of a recommendation (e.g. save, dismiss, complete).
    """
    if not supabase:
        return {"status": "success", "id": rec_id, "new_status": request.status}
        
    try:
        # RLS ensures they can only update their own
        res = supabase.table("recommendations") \
            .update({"status": request.status}) \
            .eq("id", rec_id) \
            .eq("user_id", current_user.id) \
            .execute()
        return res.data[0] if res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed")
async def seed_resources():
    """
    Temporary endpoint to seed database with mock/real YouTube resources.
    """
    if not supabase:
        return {"status": "skipped", "message": "Supabase not connected"}
        
    seed_videos = ["p63R4P7KjQk", "xk4_1vDrzzo", "nLRL_NcnK-4"] # Random Python/React tutorials
    inserted = []
    
    for vid in seed_videos:
        meta = fetch_video_metadata(vid)
        if meta:
            # Check if exists
            exists = supabase.table("resources").select("id").eq("youtube_id", vid).execute()
            if not exists.data:
                meta["is_curated"] = True
                res = supabase.table("resources").insert(meta).execute()
                inserted.append(res.data[0])
                
    return {"status": "success", "inserted": inserted}
