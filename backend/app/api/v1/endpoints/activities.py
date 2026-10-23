from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityBatchCreate, ActivityResponse
from app.services.health_service import upsert_activity_record, list_activity_records

router = APIRouter()


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def record_daily_activity(
    act_in: ActivityCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log or update a daily physical activity record (steps, active minutes).
    Requires active DEVICE_TELEMETRY consent.
    """
    client_ip = get_client_ip(request)
    record = upsert_activity_record(db, current_user.id, act_in, client_ip=client_ip)
    return record


@router.post("/batch", response_model=List[ActivityResponse], status_code=status.HTTP_200_OK)
def batch_sync_activities(
    batch_in: ActivityBatchCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch synchronize activity records from Android Health Connect."""
    client_ip = get_client_ip(request)
    results = []
    for item in batch_in.records:
        rec = upsert_activity_record(db, current_user.id, item, client_ip=client_ip)
        results.append(rec)
    return results


@router.get("/", response_model=List[ActivityResponse], status_code=status.HTTP_200_OK)
def get_user_activities(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical daily activity logs strictly scoped to user."""
    return list_activity_records(db, current_user.id, start_date=start_date, end_date=end_date, limit=limit)
