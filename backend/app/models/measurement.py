import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Measurement(Base):
    __tablename__ = "measurements"
    __table_args__ = (
        Index("ix_measurements_user_metric_time", "user_id", "metric_type", "measured_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    value_numeric: Mapped[float] = mapped_column(Float, nullable=False)
    secondary_numeric: Mapped[float] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="MANUAL_ENTRY")
    quality_status: Mapped[str] = mapped_column(String(30), default="VALID", nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User", back_populates="measurements")
