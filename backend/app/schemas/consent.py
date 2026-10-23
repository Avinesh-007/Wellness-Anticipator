from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ConsentDomain(str, Enum):
    CLINICAL_MEASUREMENTS = "CLINICAL_MEASUREMENTS"
    DEVICE_TELEMETRY = "DEVICE_TELEMETRY"
    USAGE_STATS = "USAGE_STATS"
    RESEARCH_ANALYTICS = "RESEARCH_ANALYTICS"


class ConsentUpdate(BaseModel):
    consent_domain: ConsentDomain
    is_granted: bool
    policy_version: str = Field(default="v1.0", max_length=20)


class ConsentResponse(BaseModel):
    id: str
    consent_domain: ConsentDomain
    is_granted: bool
    policy_version: str
    granted_at: datetime
    revoked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ConsentListResponse(BaseModel):
    consents: List[ConsentResponse]
