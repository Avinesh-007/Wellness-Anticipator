import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SleepRecord(Base):
    __tablename__ = "sleep_records"
    __table_args__ = (
        Index("ix_sleep_user_date", "user_id", "sleep_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sleep_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    deep_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    rem_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    light_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    quality_rating: Mapped[int] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="ANDROID_HEALTH_CONNECT", nullable=False)
    sync_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="sleep_records")
