from fastapi import APIRouter, Depends
from app.core.security import get_current_user, User

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user based on the JWT token.
    This serves as an end-to-end verification of the auth flow.
    """
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "message": "Authentication successful"
    }
