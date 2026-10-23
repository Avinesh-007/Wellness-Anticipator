import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Boolean, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ClinicalProfile(Base):
    __tablename__ = "clinical_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=True)
    biological_sex: Mapped[str] = mapped_column(String(20), nullable=True)
    height_cm: Mapped[float] = mapped_column(Float, nullable=True)
    family_history_diabetes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    personal_history_hypertension: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gestational_diabetes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    smoking_status: Mapped[str] = mapped_column(String(30), default="NEVER", nullable=False)
    alcohol_intake: Mapped[str] = mapped_column(String(30), default="NONE", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="clinical_profile")
