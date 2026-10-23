"""
Habit Tracking and Consistency Adherence Engine
Wellness Anticipator — Phase 1
Encourages sustainable lifestyle behaviors without guilt or streak-shaming mechanics.
"""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.habit import Habit, HabitLog
from app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitLogCreate,
    HabitResponse,
    HabitAdherenceSummary,
)


def get_today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_user_habits(db: Session, user_id: str, include_inactive: bool = False) -> List[HabitResponse]:
    today_str = get_today_str()
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=6)).strftime("%Y-%m-%d")

    query = db.query(Habit).filter(Habit.user_id == user_id)
    if not include_inactive:
        query = query.filter(Habit.is_active == True)

    habits = query.order_by(Habit.created_at.asc()).all()
    if not habits:
        return []

    habit_ids = [h.id for h in habits]

    # Batch query logs for these habits in the last 7 days
    recent_logs = (
        db.query(HabitLog)
        .filter(
            HabitLog.habit_id.in_(habit_ids),
            HabitLog.log_date >= seven_days_ago,
            HabitLog.log_date <= today_str,
        )
        .all()
    )

    # Group logs by habit_id -> date -> status
    logs_by_habit: Dict[int, Dict[str, str]] = {h.id: {} for h in habits}
    for log in recent_logs:
        logs_by_habit[log.habit_id][log.log_date] = log.status

    responses = []
    for h in habits:
        habit_logs = logs_by_habit.get(h.id, {})
        today_status = habit_logs.get(today_str)
        is_completed_today = today_status == "COMPLETED"

        # Calculate 7-day consistency (days completed out of 7)
        completed_days_count = sum(1 for status in habit_logs.values() if status == "COMPLETED")
        consistency_pct = round((completed_days_count / 7.0) * 100.0, 1)

        responses.append(
            HabitResponse(
                id=h.id,
                user_id=h.user_id,
                title=h.title,
                category=h.category,
                target_action=h.target_action,
                frequency=h.frequency,
                target_value=h.target_value,
                target_unit=h.target_unit,
                schedule_time=h.schedule_time,
                difficulty=h.difficulty,
                is_active=h.is_active,
                created_at=h.created_at,
                paused_at=h.paused_at,
                completed_today=is_completed_today,
                today_status=today_status,
                seven_day_consistency_pct=consistency_pct,
            )
        )

    return responses


def create_habit(db: Session, user_id: str, habit_in: HabitCreate) -> Habit:
    habit = Habit(
        user_id=user_id,
        title=habit_in.title,
        category=habit_in.category,
        target_action=habit_in.target_action,
        frequency=habit_in.frequency,
        target_value=habit_in.target_value,
        target_unit=habit_in.target_unit,
        schedule_time=habit_in.schedule_time,
        difficulty=habit_in.difficulty,
        is_active=True,
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def update_habit(db: Session, user_id: str, habit_id: int, habit_in: HabitUpdate) -> Optional[Habit]:
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        return None

    update_data = habit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "is_active" and value is False and habit.is_active is True:
            habit.paused_at = datetime.now(timezone.utc)
        elif field == "is_active" and value is True:
            habit.paused_at = None
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return habit


def delete_habit(db: Session, user_id: str, habit_id: int) -> bool:
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        return False
    db.delete(habit)
    db.commit()
    return True


def log_habit_status(db: Session, user_id: str, habit_id: int, log_in: HabitLogCreate) -> HabitLog:
    # Ensure habit belongs to user
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise ValueError("Habit not found or unauthorized.")

    target_date = log_in.log_date or get_today_str()

    existing_log = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.user_id == user_id, HabitLog.log_date == target_date)
        .first()
    )

    if existing_log:
        existing_log.status = log_in.status
        existing_log.value_achieved = log_in.value_achieved
        existing_log.notes = log_in.notes
        existing_log.reason_missed = log_in.reason_missed
        existing_log.logged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_log)
        return existing_log

    new_log = HabitLog(
        habit_id=habit_id,
        user_id=user_id,
        log_date=target_date,
        status=log_in.status,
        value_achieved=log_in.value_achieved,
        notes=log_in.notes,
        reason_missed=log_in.reason_missed,
        logged_at=datetime.now(timezone.utc),
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


def get_adherence_summary(db: Session, user_id: str) -> HabitAdherenceSummary:
    active_habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.is_active == True).all()
    total_active = len(active_habits)

    if total_active == 0:
        return HabitAdherenceSummary(
            total_active_habits=0,
            completed_today_count=0,
            today_completion_rate=0.0,
            seven_day_consistency_rate=0.0,
            thirty_day_consistency_rate=0.0,
            supportive_feedback="No active habits yet. Adopt recommendations from your Preventive Plan to start building daily consistency.",
            recovery_recommendation="Begin with a single achievable micro-habit like a 10-minute post-meal walk.",
            category_breakdown={},
        )

    today_str = get_today_str()
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=6)).strftime("%Y-%m-%d")
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=29)).strftime("%Y-%m-%d")
    active_ids = [h.id for h in active_habits]

    # Query completed logs in the last 30 days
    logs_30d = (
        db.query(HabitLog)
        .filter(
            HabitLog.habit_id.in_(active_ids),
            HabitLog.log_date >= thirty_days_ago,
            HabitLog.log_date <= today_str,
            HabitLog.status == "COMPLETED",
        )
        .all()
    )

    completed_today_count = sum(1 for log in logs_30d if log.log_date == today_str)
    today_rate = round((completed_today_count / total_active) * 100.0, 1)

    # 7-day consistency: completed slots / (total_active * 7)
    completed_7d_count = sum(1 for log in logs_30d if log.log_date >= seven_days_ago)
    possible_7d_slots = total_active * 7
    seven_day_rate = round((completed_7d_count / possible_7d_slots) * 100.0, 1) if possible_7d_slots > 0 else 0.0

    # 30-day consistency: completed slots / (total_active * 30)
    completed_30d_count = len(logs_30d)
    possible_30d_slots = total_active * 30
    thirty_day_rate = round((completed_30d_count / possible_30d_slots) * 100.0, 1) if possible_30d_slots > 0 else 0.0

    # Category breakdown
    cat_counts: Dict[str, int] = {}
    for h in active_habits:
        cat_counts[h.category] = cat_counts.get(h.category, 0) + 1

    # Supportive feedback based on sustainable consistency
    if seven_day_rate >= 80.0:
        feedback = "Exceptional consistency! You are firmly establishing protective preventive habits."
        recovery = "Keep prioritizing rest and recovery alongside your daily routines."
    elif seven_day_rate >= 50.0:
        feedback = "Solid progress. You are maintaining steady momentum across key wellness behaviors."
        recovery = "Focus on preserving your primary daily habit when your schedule feels busy."
    elif completed_today_count > 0:
        feedback = "You took positive action today! Daily consistency builds gradually from individual choices."
        recovery = "If you missed a morning routine, an afternoon or evening micro-action still counts."
    else:
        feedback = "Today is an open opportunity. Focus on completing just one small habit to build momentum."
        recovery = "Start with a 5-minute activity or a glass of water—micro-steps eliminate overwhelm."

    return HabitAdherenceSummary(
        total_active_habits=total_active,
        completed_today_count=completed_today_count,
        today_completion_rate=today_rate,
        seven_day_consistency_rate=seven_day_rate,
        thirty_day_consistency_rate=thirty_day_rate,
        supportive_feedback=feedback,
        recovery_recommendation=recovery,
        category_breakdown=cat_counts,
    )
