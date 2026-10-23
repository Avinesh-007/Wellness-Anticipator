from datetime import date
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.clinical_profile import ClinicalProfileUpdate, ClinicalProfileResponse
from app.services.health_service import get_or_create_clinical_profile, update_clinical_profile

router = APIRouter()


def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


@router.get("/profile", response_model=ClinicalProfileResponse, status_code=status.HTTP_200_OK)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the authenticated user's clinical profile."""
    profile = get_or_create_clinical_profile(db, current_user.id)
    age = _calculate_age(profile.date_of_birth) if profile.date_of_birth else None
    
    return ClinicalProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        date_of_birth=profile.date_of_birth,
        age=age,
        biological_sex=profile.biological_sex,
        height_cm=profile.height_cm,
        family_history_diabetes=profile.family_history_diabetes,
        personal_history_hypertension=profile.personal_history_hypertension,
        gestational_diabetes=profile.gestational_diabetes,
        smoking_status=profile.smoking_status,
        alcohol_intake=profile.alcohol_intake,
        updated_at=profile.updated_at
    )


@router.put("/profile", response_model=ClinicalProfileResponse, status_code=status.HTTP_200_OK)
def update_profile(
    profile_in: ClinicalProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update clinical profile attributes (biometrics, medical/family history)."""
    client_ip = get_client_ip(request)
    profile = update_clinical_profile(db, current_user.id, profile_in, client_ip=client_ip)
    age = _calculate_age(profile.date_of_birth) if profile.date_of_birth else None

    return ClinicalProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        date_of_birth=profile.date_of_birth,
        age=age,
        biological_sex=profile.biological_sex,
        height_cm=profile.height_cm,
        family_history_diabetes=profile.family_history_diabetes,
        personal_history_hypertension=profile.personal_history_hypertension,
        gestational_diabetes=profile.gestational_diabetes,
        smoking_status=profile.smoking_status,
        alcohol_intake=profile.alcohol_intake,
        updated_at=profile.updated_at
    )
