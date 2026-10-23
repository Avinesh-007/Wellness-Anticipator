from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.trend_engine import calculate_user_trends

router = APIRouter()


@router.get("/summary", status_code=status.HTTP_200_OK)
def get_trends_summary(
    window: int = Query(14, ge=7, le=90, description="Rolling time window in days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes rolling personal baseline trends (EWMA, mean, dispersion, data coverage)
    and evaluates physiological anomalies/escalations.
    """
    return calculate_user_trends(db=db, user_id=current_user.id, window_days=window)
