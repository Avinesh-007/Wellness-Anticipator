from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitLogCreate,
    HabitLogResponse,
    HabitResponse,
    HabitAdherenceSummary,
)
from app.services.habit_service import (
    get_user_habits,
    create_habit,
    update_habit,
    delete_habit,
    log_habit_status,
    get_adherence_summary,
)

router = APIRouter()


@router.get("/", response_model=List[HabitResponse], status_code=status.HTTP_200_OK)
def list_habits(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all habits for the authenticated user with today's status and 7-day consistency."""
    return get_user_habits(db=db, user_id=current_user.id, include_inactive=include_inactive)


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def add_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new custom daily preventive habit."""
    habit = create_habit(db=db, user_id=current_user.id, habit_in=habit_in)
    habits = get_user_habits(db=db, user_id=current_user.id, include_inactive=True)
    created_resp = next((h for h in habits if h.id == habit.id), None)
    if not created_resp:
        return HabitResponse(
            id=habit.id,
            user_id=habit.user_id,
            title=habit.title,
            category=habit.category,
            target_action=habit.target_action,
            frequency=habit.frequency,
            target_value=habit.target_value,
            target_unit=habit.target_unit,
            schedule_time=habit.schedule_time,
            difficulty=habit.difficulty,
            is_active=habit.is_active,
            created_at=habit.created_at,
            completed_today=False,
            today_status=None,
            seven_day_consistency_pct=0.0,
        )
    return created_resp


@router.patch("/{habit_id}", response_model=HabitResponse, status_code=status.HTTP_200_OK)
def modify_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update or pause/resume an existing habit."""
    updated = update_habit(db=db, user_id=current_user.id, habit_id=habit_id, habit_in=habit_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    habits = get_user_habits(db=db, user_id=current_user.id, include_inactive=True)
    return next(h for h in habits if h.id == updated.id)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a habit and its historical logs."""
    success = delete_habit(db=db, user_id=current_user.id, habit_id=habit_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return None


@router.post("/{habit_id}/log", response_model=HabitLogResponse, status_code=status.HTTP_200_OK)
def log_habit(
    habit_id: int,
    log_in: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record or update a habit's status (COMPLETED, PARTIAL, SKIPPED) for a given date."""
    try:
        log = log_habit_status(db=db, user_id=current_user.id, habit_id=habit_id, log_in=log_in)
        return log
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/summary/adherence", response_model=HabitAdherenceSummary, status_code=status.HTTP_200_OK)
def get_adherence_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate 7-day and 30-day consistency rates, supportive feedback, and recovery guidance."""
    return get_adherence_summary(db=db, user_id=current_user.id)
