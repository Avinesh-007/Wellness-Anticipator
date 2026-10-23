"""
Preventive Plan & Plan Item Models
Wellness Anticipator — Phase 1
Connects clinical guidelines & assessment risk factors with daily actionable habits.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class PreventivePlan(Base):
    __tablename__ = "preventive_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    status = Column(String(30), nullable=False, default="ACTIVE")  # ACTIVE, ARCHIVED, NEEDS_REVIEW
    review_period_days = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="preventive_plans")
    items = relationship("PlanItem", back_populates="plan", cascade="all, delete-orphan")


class PlanItem(Base):
    __tablename__ = "plan_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("preventive_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # PHYSICAL_ACTIVITY, NUTRITION, SLEEP, CLINICAL_SCREENING, STRESS_MANAGEMENT
    title = Column(String(160), nullable=False)
    target_action = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    guideline_source = Column(String(255), nullable=False)  # ADA, WHO, AHA, AASM
    difficulty = Column(String(30), nullable=False, default="ACHIEVABLE")  # EASY, ACHIEVABLE, MODERATE
    is_adopted_into_habit = Column(Boolean, nullable=False, default=False)
    adopted_habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    plan = relationship("PreventivePlan", back_populates="items")
    adopted_habit = relationship("Habit")
