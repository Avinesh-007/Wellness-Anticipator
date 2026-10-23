import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ActivityRecord(Base):
    __tablename__ = "activity_records"
    __table_args__ = (
        UniqueConstraint("user_id", "recorded_date", name="uq_user_activity_date"),
        Index("ix_activity_user_date", "user_id", "recorded_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    step_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_calories_kcal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    distance_meters: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="ANDROID_HEALTH_CONNECT", nullable=False)
    sync_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="activities")
