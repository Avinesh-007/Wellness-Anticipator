from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class WellbeingCheckInCreate(BaseModel):
    recorded_date: Optional[str] = Field(default=None, description="YYYY-MM-DD format (defaults to UTC today)")
    mood_score: int = Field(..., ge=1, le=5, description="1=Very Low, 2=Low, 3=Neutral, 4=Good, 5=Great")
    stress_level: str = Field(..., description="LOW, MODERATE, HIGH")
    energy_level: int = Field(..., ge=1, le=5, description="1=Exhausted, 5=High Energy")
    sleep_perceived_quality: Optional[str] = Field(default=None, description="POOR, FAIR, GOOD, EXCELLENT")
    reflection_notes: Optional[str] = None


class WellbeingCheckInResponse(BaseModel):
    id: int
    user_id: str
    recorded_date: str
    mood_score: int
    stress_level: str
    energy_level: int
    sleep_perceived_quality: Optional[str] = None
    reflection_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WellbeingTrendSummary(BaseModel):
    window_days: int
    total_checkins: int
    coverage_percentage: float
    average_mood: Optional[float] = None
    average_energy: Optional[float] = None
    predominant_stress_level: Optional[str] = None
    stress_distribution: dict = Field(default_factory=dict)
    recent_checkins: List[WellbeingCheckInResponse] = Field(default_factory=list)
    clinical_boundary_notice: str = (
        "Subjective mood and energy check-ins reflect lifestyle perception and self-reported wellness. "
        "They do not constitute a psychiatric screening or diagnostic assessment."
    )
