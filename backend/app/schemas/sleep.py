from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SleepCreate(BaseModel):
    sleep_date: date
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(..., ge=0, le=1440, description="Total minutes asleep")
    deep_minutes: Optional[int] = Field(None, ge=0, le=1440)
    rem_minutes: Optional[int] = Field(None, ge=0, le=1440)
    light_minutes: Optional[int] = Field(None, ge=0, le=1440)
    quality_rating: Optional[int] = Field(None, ge=1, le=5, description="Subjective rating from 1 to 5")
    source: str = Field(default="ANDROID_HEALTH_CONNECT", max_length=50)

    @model_validator(mode="after")
    def validate_sleep_times(self) -> "SleepCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be strictly greater than start_time.")
        return self


class SleepResponse(BaseModel):
    id: str
    user_id: str
    sleep_date: date
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    deep_minutes: Optional[int] = None
    rem_minutes: Optional[int] = None
    light_minutes: Optional[int] = None
    quality_rating: Optional[int] = None
    source: str
    sync_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
