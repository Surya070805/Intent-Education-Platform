from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.security import get_current_user, User, supabase
from app.services.recommender import generate_recommendations
from app.services.youtube import fetch_video_metadata, tag_and_save_resource
from app.services.skill_gap_analyzer import compute_skill_gaps

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


@router.get("/skill-gaps")
async def get_skill_gaps(current_user: User = Depends(get_current_user)):
    """
    Returns the learner's current skill gaps — what they know vs. what their
    career target requires. Sorted by priority (largest gap, unlocked first).
    This is the core output of Bloom's Skill Gap Analyzer.
    """
    gaps = await compute_skill_gaps(current_user.id)
    return {"skill_gaps": gaps}

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

@router.get("/browse")
async def browse_resources():
    """
    Returns all resources grouped by difficulty level for the Netflix-style browse UI.
    This endpoint is PUBLIC — no authentication required (guests can browse).
    """
    if not supabase:
        return {"sections": []}

    try:
        resources_res = supabase.table("resources").select("*").execute()
        all_resources = resources_res.data or []

        # Group by difficulty
        levels = {
            "beginner": {"level": "beginner", "label": "🌱 Beginner — Start Here", "resources": []},
            "intermediate": {"level": "intermediate", "label": "🚀 Intermediate — Level Up", "resources": []},
            "advanced": {"level": "advanced", "label": "🔥 Advanced — Go Deep", "resources": []},
        }

        for res in all_resources:
            difficulty = (res.get("difficulty") or "beginner").lower()
            if difficulty in levels:
                levels[difficulty]["resources"].append(res)
            else:
                levels["beginner"]["resources"].append(res)

        # Only return sections that have resources
        sections = [v for v in levels.values() if v["resources"]]
        return {"sections": sections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed")
async def seed_resources():
    """
    Seed database with YouTube resources tagged by difficulty level.
    """
    if not supabase:
        return {"status": "skipped", "message": "Supabase not connected"}

    # (video_id, difficulty)
    seed_videos = [
        # Beginner
        ("m_u6P5k0vP0", "beginner", ["html-css"]),     # HTML & CSS Full Course
        ("ok-plXXHlWw", "beginner", ["html-css"]),     # UI/UX Design Course
        ("kqtD5dpn9C8", "beginner", ["python-fundamentals"]),     # Python for Beginners
        ("PkZNo7MFNFg", "beginner", ["javascript-fundamentals"]),     # Learn JavaScript
        ("pTFZrS8GHKA", "beginner", ["javascript-fundamentals"]),     # Java Full Course for Beginners
        ("zJSY8tbf_ys", "beginner", ["html-css"]),     # HTML & CSS Crash Course
        ("f4s1h2YETNY", "beginner", ["javascript-fundamentals"]),     # Javascript Crash Course
        # Intermediate
        ("xk4_1vDrzzo", "intermediate", ["react"]), # React Tutorial
        ("bMknfKXIFA8", "intermediate", ["react"]), # React Course
        ("nLRL_NcnK-4", "intermediate", ["machine-learning"]), # Python + ML
        ("t8pPdKYpowI", "intermediate", ["python-fundamentals"]), # Data Structures & Algorithms
        ("Z1RJmh_OqeA", "intermediate", ["javascript-fundamentals"]), # Flutter Course
        ("Oe421EPjeBE", "intermediate", ["nodejs-express"]), # Node.js & Express Course
        ("c18aMsi_0gk", "intermediate", ["typescript"]), # TypeScript Full Course
        # Advanced
        ("tPYj3fFJGjk", "advanced", ["nextjs-fullstack"]),     # Next.js 14 Full Course
        ("CvCiNeLnZ00", "advanced", ["devops-deployment"]),     # Go (Golang) Tutorial
        ("VyHDALc0kEM", "advanced", ["devops-deployment"]),     # Kubernetes Course
        ("X48VuDVv0do", "advanced", ["devops-deployment"]),     # Docker Tutorial
        ("aircAruvnKk", "advanced", ["system-design"]),     # System Design
        ("HXV3zeQKqGY", "advanced", ["python-fundamentals", "nodejs-express"]),     # Python Backend (100 Concepts)
    ]
    inserted = []

    for vid_id, difficulty, skills in seed_videos:
        meta = fetch_video_metadata(vid_id, difficulty=difficulty)
        if meta:
            # Check if exists
            exists = supabase.table("resources").select("id").eq("youtube_id", vid_id).execute()
            if not exists.data:
                meta["is_curated"] = True
                meta["skills"] = skills
                res = supabase.table("resources").insert(meta).execute()
                if res.data:
                    inserted.append(res.data[0])
            else:
                # Update existing with skills
                supabase.table("resources").update({"skills": skills}).eq("youtube_id", vid_id).execute()

    return {"status": "success", "inserted_count": len(inserted)}

