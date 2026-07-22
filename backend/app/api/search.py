from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.security import get_current_user, User, supabase

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


@router.get("/")
async def search_resources(
    q: str = Query(..., min_length=1, description="Search query"),
    difficulty: str = Query(None, description="Filter by difficulty: beginner, intermediate, advanced"),
    current_user: User = Depends(get_current_user)
):
    """
    Search resources by title, channel name, or description.
    Uses Supabase text search (ilike for MVP).
    """
    if not supabase:
        return {"results": [], "total": 0}

    try:
        query = supabase.table("resources").select("*")

        # Text search (case-insensitive partial match on title and channel)
        query = query.or_(f"title.ilike.%{q}%,channel_name.ilike.%{q}%")

        # Optional difficulty filter
        if difficulty:
            query = query.eq("difficulty", difficulty)

        # Order by view count (most popular first)
        query = query.order("view_count", desc=True).limit(20)

        res = query.execute()
        results = res.data or []

        return {
            "results": results,
            "total": len(results),
            "query": q,
        }
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
