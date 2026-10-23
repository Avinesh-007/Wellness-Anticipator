from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.schemas.export import AccountDeleteRequest
from app.core.security import verify_password
from app.core.errors import AppException
from app.services.health_service import export_all_user_data, delete_user_account_permanently

router = APIRouter()


@router.get("/full", status_code=status.HTTP_200_OK)
def export_user_health_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export complete machine-readable health records, profiles, and consents
    under GDPR Article 20 (Right to Data Portability).
    """
    client_ip = get_client_ip(request)
    data = export_all_user_data(db, current_user, client_ip=client_ip)
    return data


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_permanently(
    delete_req: AccountDeleteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete account and all associated health records
    under GDPR Article 17 (Right to be Forgotten).
    Requires password re-authentication and exact confirmation phrase.
    """
    if delete_req.confirm_phrase != "DELETE MY ACCOUNT":
        raise AppException(
            message="Confirmation phrase must exactly match 'DELETE MY ACCOUNT'.",
            error_code="INVALID_CONFIRMATION_PHRASE",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    if not verify_password(delete_req.password, current_user.password_hash):
        raise AppException(
            message="Authentication failed. Incorrect password.",
            error_code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    client_ip = get_client_ip(request)
    delete_user_account_permanently(db, current_user, client_ip=client_ip)
    return None
