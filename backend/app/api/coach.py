from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.core.security import get_current_user, User, supabase
from app.services.llm_provider import llm_provider

router = APIRouter(prefix="/api/v1/coach", tags=["Coach"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    youtube_id: str
    messages: List[ChatMessage]

@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sends a message to the AI coach, along with conversation history and video context.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection required")

    try:
        # 1. Fetch user's learning profile to provide context
        profile_res = supabase.table("learning_profiles") \
            .select("*, career:careers(name)") \
            .eq("user_id", current_user.id) \
            .execute()
        
        profile = profile_res.data[0] if profile_res.data else {}

        # 2. Fetch the resource context
        resource_res = supabase.table("resources") \
            .select("title, channel_name, skills") \
            .eq("youtube_id", request.youtube_id) \
            .execute()
        
        context = resource_res.data[0] if resource_res.data else {}

        # 3. Call LLM
        messages_list = [{"role": m.role, "content": m.content} for m in request.messages]
        
        response = await llm_provider.chat_with_coach(messages_list, profile, context)

        return {"status": "success", "response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
