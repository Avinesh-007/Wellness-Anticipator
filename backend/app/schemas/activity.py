from datetime import date, datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field


class ActivityCreate(BaseModel):
    recorded_date: date
    step_count: int = Field(default=0, ge=0, le=150000, description="Daily steps")
    active_minutes: int = Field(default=0, ge=0, le=1440, description="Active minutes")
    active_calories_kcal: float = Field(default=0.0, ge=0.0, description="Active calories in kcal")
    distance_meters: float = Field(default=0.0, ge=0.0, description="Distance in meters")
    source: str = Field(default="ANDROID_HEALTH_CONNECT", max_length=50)


class ActivityBatchCreate(BaseModel):
    records: List[ActivityCreate]


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    recorded_date: date
    step_count: int
    active_minutes: int
    active_calories_kcal: float
    distance_meters: float
    source: str
    sync_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
