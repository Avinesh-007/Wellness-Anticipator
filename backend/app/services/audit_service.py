import hashlib
import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.core.logging import redact_sensitive_dict


def hash_ip(ip: Optional[str]) -> str:
    """Hashes IP with SHA-256 to ensure data minimization in audit logs."""
    if not ip:
        return "UNKNOWN_IP"
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    user_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Creates an immutable audit log entry scrubbed of sensitive PHI and credentials."""
    sanitized_details = None
    if details:
        clean_dict = redact_sensitive_dict(details)
        sanitized_details = json.dumps(clean_dict)

    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_hash=hash_ip(client_ip),
        user_agent=user_agent[:255] if user_agent else None,
        details=sanitized_details
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
