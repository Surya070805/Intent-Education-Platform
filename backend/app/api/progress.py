from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, User, supabase
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/progress", tags=["Progress"])


@router.get("/")
async def get_progress(current_user: User = Depends(get_current_user)):
    """
    Returns aggregated learning progress stats for the user.
    """
    if not supabase:
        return {"stats": {}, "recent_activity": [], "skill_progress": []}

    try:
        user_id = current_user.id

        # 1. Total sessions and watch time
        sessions_res = supabase.table("learning_sessions") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        sessions = sessions_res.data or []

        total_sessions = len(sessions)
        completed_sessions = sum(1 for s in sessions if s.get("status") == "completed")
        total_watch_seconds = sum(s.get("duration_seconds", 0) or 0 for s in sessions)

        # 2. Recommendations stats
        recs_res = supabase.table("recommendations") \
            .select("status") \
            .eq("user_id", user_id) \
            .execute()
        recs = recs_res.data or []
        total_recs = len(recs)
        completed_recs = sum(1 for r in recs if r.get("status") == "completed")
        saved_recs = sum(1 for r in recs if r.get("status") == "saved")

        # 3. Learning streak (count consecutive days with sessions)
        session_dates = set()
        for s in sessions:
            started = s.get("started_at")
            if started:
                try:
                    dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
                    session_dates.add(dt.date())
                except Exception:
                    pass

        today = datetime.utcnow().date()
        current_streak = 0
        check_date = today
        while check_date in session_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # If no session today, check if yesterday continues the streak
        if current_streak == 0 and (today - timedelta(days=1)) in session_dates:
            check_date = today - timedelta(days=1)
            while check_date in session_dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        # Longest streak
        if session_dates:
            sorted_dates = sorted(session_dates)
            longest_streak = 1
            temp_streak = 1
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                    temp_streak += 1
                    longest_streak = max(longest_streak, temp_streak)
                else:
                    temp_streak = 1
        else:
            longest_streak = 0

        # 4. Skill mastery progress
        mastery_res = supabase.table("user_skill_mastery") \
            .select("*, skill:skills(name, level)") \
            .eq("user_id", user_id) \
            .execute()
        skill_progress = mastery_res.data or []

        # 5. Weekly activity (last 7 days)
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        weekly_events = supabase.table("analytics_events") \
            .select("event_type, created_at, metadata") \
            .eq("user_id", user_id) \
            .gte("created_at", week_ago) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()

        # 6. Recent activity (last 5 sessions with resource info)
        recent_sessions = supabase.table("learning_sessions") \
            .select("*, resource:resources(title, thumbnail_url, youtube_id)") \
            .eq("user_id", user_id) \
            .order("started_at", desc=True) \
            .limit(5) \
            .execute()

        # 7. Activity heatmap (sessions per day for last 30 days)
        heatmap = {}
        for s in sessions:
            started = s.get("started_at")
            if started:
                try:
                    dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
                    day_key = dt.strftime("%Y-%m-%d")
                    heatmap[day_key] = heatmap.get(day_key, 0) + 1
                except Exception:
                    pass

        return {
            "stats": {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "total_watch_minutes": round(total_watch_seconds / 60),
                "total_recommendations": total_recs,
                "completed_recommendations": completed_recs,
                "saved_recommendations": saved_recs,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
            },
            "skill_progress": skill_progress,
            "recent_activity": recent_sessions.data or [],
            "weekly_events": weekly_events.data or [],
            "activity_heatmap": heatmap,
        }
    except Exception as e:
        print(f"Error fetching progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))
