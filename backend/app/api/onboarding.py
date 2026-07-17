from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import get_current_user, User
from app.services.onboarding import process_onboarding

router = APIRouter(prefix="/api/v1/onboarding", tags=["Onboarding"])

class OnboardingRequest(BaseModel):
    career_goal: str
    experience: str
    learning_style: str
    daily_minutes: int

@router.post("/start")
async def start_onboarding(
    request: OnboardingRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Accepts the user's questionnaire answers and triggers the LLM
    to generate a Learning Intent Profile.
    """
    context = request.model_dump()
    result = await process_onboarding(current_user.id, context)
    return result
