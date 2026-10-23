from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AccountDeleteRequest(BaseModel):
    password: str = Field(..., description="User's current password to authenticate deletion.")
    confirm_phrase: str = Field(..., description="Must exactly match 'DELETE MY ACCOUNT'")


class ExportSummaryResponse(BaseModel):
    export_timestamp: datetime
    user_id: str
    email: str
    full_name: Optional[str]
    consents_count: int
    clinical_profile_present: bool
    measurements_count: int
    activities_count: int
    sleep_records_count: int
    data: Dict[str, Any]
