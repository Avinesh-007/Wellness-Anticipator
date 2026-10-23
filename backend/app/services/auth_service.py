from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.clinical_profile import ClinicalProfile
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
from app.core.errors import AppException
from app.services.consent_service import init_default_consents
from app.services.audit_service import log_audit_event


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate, client_ip: Optional[str] = None) -> User:
    """Registers a new user with Argon2id password hash, profile, and default consents."""
    clean_email = user_in.email.lower().strip()
    existing = get_user_by_email(db, clean_email)
    if existing:
        raise AppException(
            message=f"An account with email '{clean_email}' already exists.",
            error_code="EMAIL_ALREADY_REGISTERED",
            status_code=409
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=clean_email,
        password_hash=hashed_pw,
        full_name=user_in.full_name.strip() if user_in.full_name else None,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize blank clinical profile
    profile = ClinicalProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()

    # Initialize consent state
    init_default_consents(db, new_user.id)

    # Audit registration
    log_audit_event(
        db=db,
        action="REGISTER",
        resource_type="users",
        user_id=new_user.id,
        resource_id=new_user.id,
        client_ip=client_ip,
        details={"email": clean_email}
    )

    return new_user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
    client_ip: Optional[str] = None
) -> User:
    """Authenticates a user via Argon2id hash verification."""
    clean_email = email.lower().strip()
    user = get_user_by_email(db, clean_email)
    if not user:
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="users",
            client_ip=client_ip,
            details={"reason": "User not found"}
        )
        raise AppException(
            message="Invalid email or password.",
            error_code="INVALID_CREDENTIALS",
            status_code=401
        )

    if not verify_password(password, user.password_hash):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="users",
            user_id=user.id,
            client_ip=client_ip,
            details={"reason": "Password mismatch"}
        )
        raise AppException(
            message="Invalid email or password.",
            error_code="INVALID_CREDENTIALS",
            status_code=401
        )

    if not user.is_active:
        raise AppException(
            message="User account is deactivated.",
            error_code="ACCOUNT_DEACTIVATED",
            status_code=403
        )

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource_type="users",
        user_id=user.id,
        resource_id=user.id,
        client_ip=client_ip
    )
    return user
