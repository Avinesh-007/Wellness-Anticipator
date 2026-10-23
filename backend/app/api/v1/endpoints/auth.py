from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token
from app.services.auth_service import register_user, authenticate_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user account."""
    client_ip = get_client_ip(request)
    new_user = register_user(db, user_in, client_ip=client_ip)
    return new_user


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login(
    user_in: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate with email and password and receive a JWT token."""
    client_ip = get_client_ip(request)
    user = authenticate_user(db, user_in.email, user_in.password, client_ip=client_ip)
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the current authenticated user's profile."""
    return current_user
