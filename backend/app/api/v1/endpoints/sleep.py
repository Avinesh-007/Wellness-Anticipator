from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.sleep import SleepCreate, SleepResponse
from app.services.health_service import create_sleep_record, list_sleep_records

router = APIRouter()


@router.post("/", response_model=SleepResponse, status_code=status.HTTP_201_CREATED)
def record_sleep_session(
    sleep_in: SleepCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a sleep session (bedtime, wake time, duration, sleep stages).
    Requires active DEVICE_TELEMETRY consent.
    """
    client_ip = get_client_ip(request)
    session = create_sleep_record(db, current_user.id, sleep_in, client_ip=client_ip)
    return session


@router.get("/", response_model=List[SleepResponse], status_code=status.HTTP_200_OK)
def get_user_sleep_records(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical sleep logs strictly scoped to user."""
    return list_sleep_records(db, current_user.id, start_date=start_date, end_date=end_date, limit=limit)
