from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.measurement import MeasurementCreate, MeasurementResponse, MetricType
from app.services.health_service import (
    create_measurement,
    list_measurements,
    get_measurement_by_id,
    delete_measurement
)

router = APIRouter()


@router.post("/", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def record_measurement(
    m_in: MeasurementCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a clinical measurement (e.g. Blood Pressure, Fasting Glucose, Weight, HbA1c).
    Requires active CLINICAL_MEASUREMENTS consent.
    """
    client_ip = get_client_ip(request)
    new_m = create_measurement(db, current_user.id, m_in, client_ip=client_ip)
    return new_m


@router.get("/", response_model=List[MeasurementResponse], status_code=status.HTTP_200_OK)
def get_user_measurements(
    metric_type: Optional[MetricType] = Query(None, description="Filter by metric type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List historical measurements strictly scoped to authenticated user."""
    return list_measurements(db, current_user.id, metric_type=metric_type, limit=limit, offset=offset)


@router.get("/{measurement_id}", response_model=MeasurementResponse, status_code=status.HTTP_200_OK)
def get_single_measurement(
    measurement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a single measurement by ID with strict ownership validation."""
    return get_measurement_by_id(db, current_user.id, measurement_id)


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_measurement(
    measurement_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a measurement record owned by the authenticated user."""
    client_ip = get_client_ip(request)
    delete_measurement(db, current_user.id, measurement_id, client_ip=client_ip)
    return None
