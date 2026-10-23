"""
Habit and HabitLog Models for Sustainable Preventive Lifestyle Routines
Wellness Anticipator — Phase 1
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    category = Column(String(50), nullable=False, default="GENERAL")  # PHYSICAL_ACTIVITY, NUTRITION, SLEEP, MINDFULNESS, HYDRATION, CLINICAL
    target_action = Column(Text, nullable=False)
    frequency = Column(String(30), nullable=False, default="DAILY")  # DAILY, WEEKDAYS, 3_PER_WEEK
    target_value = Column(Float, nullable=True)
    target_unit = Column(String(30), nullable=True)
    schedule_time = Column(String(30), nullable=True)  # e.g., "Morning", "After Lunch", "20:00"
    difficulty = Column(String(20), nullable=False, default="EASY")  # EASY, ACHIEVABLE, MODERATE
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    paused_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan", order_by="desc(HabitLog.log_date)")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    status = Column(String(20), nullable=False, default="COMPLETED")  # COMPLETED, PARTIAL, SKIPPED
    value_achieved = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    reason_missed = Column(String(100), nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    habit = relationship("Habit", back_populates="logs")

    __table_args__ = (
        Index("ix_habit_logs_user_date", "user_id", "log_date"),
        Index("ix_habit_logs_habit_date", "habit_id", "log_date"),
    )
