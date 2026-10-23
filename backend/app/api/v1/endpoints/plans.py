from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.preventive_plan import (
    PreventivePlanResponse,
    PlanItemAdoptRequest,
)
from app.schemas.habit import HabitResponse
from app.services.plan_service import (
    get_or_create_active_plan,
    generate_and_save_plan,
    adopt_plan_item_into_habit,
)
from app.services.habit_service import get_user_habits

router = APIRouter()


@router.get("/active", response_model=PreventivePlanResponse, status_code=status.HTTP_200_OK)
def get_active_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the user's active personalized preventive plan, generating one if not yet initialized."""
    plan = get_or_create_active_plan(db=db, user_id=current_user.id)
    return plan


@router.post("/generate", response_model=PreventivePlanResponse, status_code=status.HTTP_201_CREATED)
def regenerate_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate personalized preventive plan using the latest clinical assessment and baseline trends."""
    plan = generate_and_save_plan(db=db, user_id=current_user.id)
    return plan


@router.post("/items/{item_id}/adopt", response_model=HabitResponse, status_code=status.HTTP_200_OK)
def adopt_item(
    item_id: int,
    adopt_req: PlanItemAdoptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Convert an evidence-informed recommendation directly into an active daily habit."""
    try:
        habit = adopt_plan_item_into_habit(
            db=db,
            user_id=current_user.id,
            item_id=item_id,
            schedule_time=adopt_req.schedule_time,
            frequency=adopt_req.frequency,
        )
        habits = get_user_habits(db=db, user_id=current_user.id, include_inactive=True)
        return next(h for h in habits if h.id == habit.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
