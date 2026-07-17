import os
from googleapiclient.discovery import build
import isodate

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_youtube_service():
    if not YOUTUBE_API_KEY:
        return None
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

def fetch_video_metadata(video_id: str) -> dict:
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
            "duration_seconds": 600,
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
            "duration_seconds": int(duration_delta.total_seconds()),
            "view_count": int(statistics.get("viewCount", 0)),
            "like_count": int(statistics.get("likeCount", 0)),
            "published_at": snippet.get("publishedAt"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url")
        }
    except Exception as e:
        print(f"Error fetching YouTube data for {video_id}: {e}")
        return None
