from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.consent import ConsentRecord
from app.schemas.consent import ConsentDomain


def check_user_consent(db: Session, user_id: str, domain: str) -> bool:
    """Verifies whether the user currently has active granted consent for a domain."""
    record = db.query(ConsentRecord).filter(
        ConsentRecord.user_id == user_id,
        ConsentRecord.consent_domain == domain
    ).first()
    return bool(record and record.is_granted)


def get_user_consents(db: Session, user_id: str) -> List[ConsentRecord]:
    """Retrieves all consent records for a user."""
    return db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).all()


def update_user_consent(
    db: Session,
    user_id: str,
    domain: ConsentDomain,
    is_granted: bool,
    policy_version: str = "v1.0"
) -> ConsentRecord:
    """Updates or creates a granular consent record with timestamp tracking."""
    record = db.query(ConsentRecord).filter(
        ConsentRecord.user_id == user_id,
        ConsentRecord.consent_domain == domain.value
    ).first()

    now_utc = datetime.now(timezone.utc)
    if record:
        record.is_granted = is_granted
        record.policy_version = policy_version
        if not is_granted:
            record.revoked_at = now_utc
        else:
            record.granted_at = now_utc
            record.revoked_at = None
    else:
        record = ConsentRecord(
            user_id=user_id,
            consent_domain=domain.value,
            is_granted=is_granted,
            policy_version=policy_version,
            granted_at=now_utc,
            revoked_at=None if is_granted else now_utc
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record


def init_default_consents(db: Session, user_id: str) -> None:
    """Initializes default consent records upon registration."""
    # Clinical measurements and device telemetry opt-in can be requested during onboarding; default is False
    for domain in ConsentDomain:
        existing = db.query(ConsentRecord).filter(
            ConsentRecord.user_id == user_id,
            ConsentRecord.consent_domain == domain.value
        ).first()
        if not existing:
            rec = ConsentRecord(
                user_id=user_id,
                consent_domain=domain.value,
                is_granted=False,
                policy_version="v1.0",
                granted_at=datetime.now(timezone.utc),
                revoked_at=datetime.now(timezone.utc)
            )
            db.add(rec)
    db.commit()
