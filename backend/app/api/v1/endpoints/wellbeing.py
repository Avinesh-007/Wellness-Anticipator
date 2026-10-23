from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.wellbeing import (
    WellbeingCheckInCreate,
    WellbeingCheckInResponse,
    WellbeingTrendSummary,
)
from app.services.wellbeing_service import (
    record_wellbeing_checkin,
    get_today_checkin,
    get_wellbeing_trends,
)

router = APIRouter()


@router.post("/", response_model=WellbeingCheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_checkin(
    checkin_in: WellbeingCheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record or update today's subjective mood, stress, and energy check-in."""
    return record_wellbeing_checkin(db=db, user_id=current_user.id, checkin_in=checkin_in)


@router.get("/today", response_model=Optional[WellbeingCheckInResponse], status_code=status.HTTP_200_OK)
def get_today_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve today's check-in if already submitted."""
    checkin = get_today_checkin(db=db, user_id=current_user.id)
    return checkin


@router.get("/trends", response_model=WellbeingTrendSummary, status_code=status.HTTP_200_OK)
def get_trends(
    window_days: int = Query(default=14, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve rolling subjective wellbeing trends, distribution, and reflection history."""
    return get_wellbeing_trends(db=db, user_id=current_user.id, window_days=window_days)
