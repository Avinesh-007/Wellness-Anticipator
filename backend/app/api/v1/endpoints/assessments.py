from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.services.risk_service import perform_diabetes_assessment
from app.services.audit_service import log_audit_event

router = APIRouter()


class AssessmentOverrideRequest(BaseModel):
    age: Optional[int] = Field(None, ge=18, le=120)
    biological_sex: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=20.0, le=400.0)
    family_history_diabetes: Optional[bool] = None
    personal_history_hypertension: Optional[bool] = None
    gestational_diabetes: Optional[bool] = None
    smoking_status: Optional[str] = None
    physically_active: Optional[bool] = None


@router.post("/diabetes", status_code=status.HTTP_200_OK)
def run_diabetes_assessment(
    request: Request,
    overrides: Optional[AssessmentOverrideRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes a comprehensive, explainable Type 2 Diabetes screening assessment.
    Combines validated ADA questionnaire + Calibrated Survey ML Model + Factor Attributions.
    """
    client_ip = get_client_ip(request)
    override_dict = overrides.model_dump(exclude_unset=True) if overrides else None
    
    result = perform_diabetes_assessment(
        db=db,
        user_id=current_user.id,
        manual_overrides=override_dict
    )

    log_audit_event(
        db=db,
        action="RUN_DIABETES_ASSESSMENT",
        resource_type="assessments",
        user_id=current_user.id,
        client_ip=client_ip,
        details={
            "ada_points": result["ada_clinical_score"]["points"],
            "model_prob": result["statistical_screening_model"]["calibrated_screening_probability"]
        }
    )

    return result


@router.get("/diabetes", status_code=status.HTTP_200_OK)
def get_diabetes_assessment(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the diabetes screening assessment using saved profile and latest measurements."""
    return run_diabetes_assessment(request=request, overrides=None, current_user=current_user, db=db)
