from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.consent import ConsentUpdate, ConsentResponse, ConsentListResponse
from app.services.consent_service import get_user_consents, update_user_consent
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("/", response_model=ConsentListResponse, status_code=status.HTTP_200_OK)
def get_consents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all current consent domain states for the authenticated user."""
    records = get_user_consents(db, current_user.id)
    return {"consents": records}


@router.post("/", response_model=ConsentResponse, status_code=status.HTTP_200_OK)
def update_consent(
    consent_in: ConsentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant or revoke consent for a specific health data domain."""
    client_ip = get_client_ip(request)
    updated = update_user_consent(
        db=db,
        user_id=current_user.id,
        domain=consent_in.consent_domain,
        is_granted=consent_in.is_granted,
        policy_version=consent_in.policy_version
    )
    log_audit_event(
        db=db,
        action="UPDATE_CONSENT",
        resource_type="consent_records",
        user_id=current_user.id,
        resource_id=updated.id,
        client_ip=client_ip,
        details={
            "domain": consent_in.consent_domain.value,
            "is_granted": consent_in.is_granted
        }
    )
    return updated
