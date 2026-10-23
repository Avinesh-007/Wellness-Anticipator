import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ConsentRecord(Base):
    __tablename__ = "consent_records"
    __table_args__ = (
        UniqueConstraint("user_id", "consent_domain", name="uq_user_consent_domain"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    consent_domain: Mapped[str] = mapped_column(String(50), nullable=False)
    is_granted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    policy_version: Mapped[str] = mapped_column(String(20), default="v1.0", nullable=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="consents")
