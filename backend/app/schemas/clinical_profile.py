from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicalProfileUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    biological_sex: Optional[str] = Field(None, description="'MALE', 'FEMALE', or 'OTHER'")
    height_cm: Optional[float] = Field(None, ge=50.0, le=250.0, description="Height in centimeters")
    family_history_diabetes: bool = False
    personal_history_hypertension: bool = False
    gestational_diabetes: bool = False
    smoking_status: str = Field(default="NEVER", description="'NEVER', 'FORMER', or 'CURRENT'")
    alcohol_intake: str = Field(default="NONE", description="'NONE', 'MODERATE', or 'HEAVY'")


class ClinicalProfileResponse(BaseModel):
    id: str
    user_id: str
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    biological_sex: Optional[str] = None
    height_cm: Optional[float] = None
    family_history_diabetes: bool
    personal_history_hypertension: bool
    gestational_diabetes: bool
    smoking_status: str
    alcohol_intake: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
