from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class PlanItemBase(BaseModel):
    category: str
    title: str
    target_action: str
    rationale: str
    guideline_source: str
    difficulty: str = "ACHIEVABLE"


class PlanItemResponse(PlanItemBase):
    id: int
    plan_id: int
    is_adopted_into_habit: bool
    adopted_habit_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class PreventivePlanResponse(BaseModel):
    id: int
    user_id: str
    title: str
    status: str
    review_period_days: int
    created_at: datetime
    updated_at: datetime
    items: List[PlanItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PlanItemAdoptRequest(BaseModel):
    schedule_time: Optional[str] = Field(default=None, description="e.g. Morning, After Dinner")
    frequency: str = Field(default="DAILY", description="DAILY, WEEKDAYS, 3_PER_WEEK")
