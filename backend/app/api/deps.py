from typing import Generator, Optional
from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.core.errors import AppException, ConsentRequiredException
from app.models.user import User
from app.services.consent_service import check_user_consent

security_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_client_ip(request: Request) -> Optional[str]:
    """Extracts client IP address respecting reverse-proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validates JWT bearer token and resolves the authenticated user."""
    if not auth_credentials:
        raise AppException(
            message="Missing authorization token.",
            error_code="AUTHENTICATION_REQUIRED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    token = auth_credentials.credentials
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise AppException(
            message="Invalid or expired authentication token.",
            error_code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(
            message="User account no longer exists.",
            error_code="USER_NOT_FOUND",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        raise AppException(
            message="User account is deactivated.",
            error_code="ACCOUNT_DEACTIVATED",
            status_code=status.HTTP_403_FORBIDDEN
        )

    return user


class ConsentChecker:
    """Dependency for enforcing granular per-domain user consent."""
    def __init__(self, domain: str):
        self.domain = domain

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not check_user_consent(db, current_user.id, self.domain):
            raise ConsentRequiredException(self.domain)
        return current_user
