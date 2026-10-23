from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class HabitBase(BaseModel):
    title: str = Field(..., max_length=160, description="Name of the habit")
    category: str = Field(default="GENERAL", max_length=50, description="Habit category")
    target_action: str = Field(..., description="Actionable micro-step")
    frequency: str = Field(default="DAILY", max_length=30)
    target_value: Optional[float] = Field(default=None)
    target_unit: Optional[str] = Field(default=None, max_length=30)
    schedule_time: Optional[str] = Field(default=None, max_length=30)
    difficulty: str = Field(default="EASY", max_length=20)


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=160)
    category: Optional[str] = Field(default=None, max_length=50)
    target_action: Optional[str] = None
    frequency: Optional[str] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    schedule_time: Optional[str] = None
    difficulty: Optional[str] = None
    is_active: Optional[bool] = None


class HabitLogCreate(BaseModel):
    log_date: Optional[str] = Field(default=None, description="YYYY-MM-DD format (defaults to UTC today)")
    status: str = Field(default="COMPLETED", description="COMPLETED, PARTIAL, or SKIPPED")
    value_achieved: Optional[float] = None
    notes: Optional[str] = None
    reason_missed: Optional[str] = None


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    user_id: str
    log_date: str
    status: str
    value_achieved: Optional[float] = None
    notes: Optional[str] = None
    reason_missed: Optional[str] = None
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitResponse(HabitBase):
    id: int
    user_id: str
    is_active: bool
    created_at: datetime
    paused_at: Optional[datetime] = None
    completed_today: bool = False
    today_status: Optional[str] = None
    seven_day_consistency_pct: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class HabitAdherenceSummary(BaseModel):
    total_active_habits: int
    completed_today_count: int
    today_completion_rate: float
    seven_day_consistency_rate: float
    thirty_day_consistency_rate: float
    supportive_feedback: str
    recovery_recommendation: Optional[str] = None
    category_breakdown: dict = Field(default_factory=dict)
