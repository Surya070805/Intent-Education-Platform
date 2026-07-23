import os
from googleapiclient.discovery import build
import isodate
from app.services.llm_provider import llm_provider
from app.core.security import supabase

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_youtube_service():
    if not YOUTUBE_API_KEY:
        return None
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

def fetch_video_metadata(video_id: str, difficulty: str = "beginner") -> dict:
    """
    Fetches video metadata from YouTube API.
    Returns a dictionary of parsed stats.
    Falls back to mock data if API key is not present.
    """
    youtube = get_youtube_service()
    
    if not youtube:
        # Return mock data
        return {
            "youtube_id": video_id,
            "title": f"Mock Video {video_id}",
            "channel_name": "Mock Channel",
            "channel_id": "",
            "description": "",
            "duration_seconds": 600,
            "difficulty": difficulty,
            "view_count": 10000,
            "like_count": 500,
            "published_at": "2023-01-01T00:00:00Z",
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        }
        
    try:
        request = youtube.videos().list(
            part="snippet,contentDetails,statistics",
            id=video_id
        )
        response = request.execute()
        
        if not response.get("items"):
            raise ValueError(f"Video {video_id} not found")
            
        item = response["items"][0]
        snippet = item["snippet"]
        content_details = item["contentDetails"]
        statistics = item["statistics"]
        
        # Parse ISO 8601 duration
        duration_delta = isodate.parse_duration(content_details["duration"])
        
        return {
            "youtube_id": video_id,
            "title": snippet.get("title"),
            "channel_name": snippet.get("channelTitle"),
            "channel_id": snippet.get("channelId", ""),
            "description": snippet.get("description", ""),
            "duration_seconds": int(duration_delta.total_seconds()),
            "difficulty": difficulty,
            "view_count": int(statistics.get("viewCount", 0)),
            "like_count": int(statistics.get("likeCount", 0)),
            "published_at": snippet.get("publishedAt"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url")
        }
    except Exception as e:
        print(f"Error fetching YouTube data for {video_id}: {e}")
        return None


async def tag_and_save_resource(resource_data: dict, career_slug: str | None = None) -> dict:
    """
    Given a resource dict (from fetch_video_metadata), uses the LLM to tag
    it with skill slugs, then upserts it into the resources table.
    
    Returns the saved resource row.
    """
    if not supabase:
        return resource_data

    # 1. Fetch available skills (optionally filtered by career)
    try:
        if career_slug:
            career_res = supabase.table("careers").select("id").eq("slug", career_slug).execute()
            if career_res.data:
                career_id = career_res.data[0]["id"]
                skills_res = supabase.table("skills").select("id, name, slug").eq("career_id", career_id).execute()
            else:
                skills_res = supabase.table("skills").select("id, name, slug").execute()
        else:
            skills_res = supabase.table("skills").select("id, name, slug").execute()

        available_skills = skills_res.data or []

        # 2. Use LLM to tag skills from video metadata
        tagged_slugs = await llm_provider.tag_resource_skills(
            title=resource_data.get("title", ""),
            description=resource_data.get("description", ""),
            channel=resource_data.get("channel_name", ""),
            available_skills=available_skills,
        )

        # 3. Build resource row for DB
        resource_row = {
            "youtube_id": resource_data["youtube_id"],
            "title": resource_data.get("title"),
            "channel_name": resource_data.get("channel_name"),
            "channel_id": resource_data.get("channel_id", ""),
            "description": resource_data.get("description", ""),
            "duration_seconds": resource_data.get("duration_seconds", 0),
            "difficulty": resource_data.get("difficulty", "beginner"),
            "thumbnail_url": resource_data.get("thumbnail_url"),
            "view_count": resource_data.get("view_count", 0),
            "like_count": resource_data.get("like_count", 0),
            "published_at": resource_data.get("published_at"),
            "skills": tagged_slugs,  # ← LLM-tagged skills
        }

        # 4. Upsert into resources table
        result = supabase.table("resources").upsert(
            resource_row,
            on_conflict="youtube_id"
        ).execute()

        return result.data[0] if result.data else resource_row

    except Exception as e:
        print(f"[YouTube] Error tagging/saving resource: {e}")
        return resource_data
