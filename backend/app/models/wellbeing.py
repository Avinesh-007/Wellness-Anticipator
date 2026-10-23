"""
Wellbeing Check-In Model
Wellness Anticipator — Phase 1
Captures subjective mood, stress, and energy with strict non-diagnostic clinical boundaries.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class WellbeingCheckIn(Base):
    __tablename__ = "wellbeing_checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    mood_score = Column(Integer, nullable=False)  # 1 to 5 (1=Very Low, 2=Low, 3=Neutral, 4=Good, 5=Great)
    stress_level = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH
    energy_level = Column(Integer, nullable=False)  # 1 to 5 (1=Exhausted, 5=High Energy)
    sleep_perceived_quality = Column(String(20), nullable=True)  # POOR, FAIR, GOOD, EXCELLENT
    reflection_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="wellbeing_checkins")

    __table_args__ = (
        Index("ix_wellbeing_user_date", "user_id", "recorded_date", unique=True),
    )
