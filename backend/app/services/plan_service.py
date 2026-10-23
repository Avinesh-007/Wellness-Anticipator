"""
Preventive Plan Synthesis and Habit Adoption Engine
Wellness Anticipator — Phase 1
Bridges clinical risk stratification with persistent, actionable daily habits.
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.preventive_plan import PreventivePlan, PlanItem
from app.models.habit import Habit
from app.models.user import User
from app.schemas.habit import HabitCreate
from app.services.risk_service import perform_diabetes_assessment
from app.services.trend_engine import calculate_user_trends
from app.services.recommendation_service import generate_recommendations
from app.services.habit_service import create_habit


def get_or_create_active_plan(db: Session, user_id: str) -> PreventivePlan:
    active_plan = (
        db.query(PreventivePlan)
        .filter(PreventivePlan.user_id == user_id, PreventivePlan.status == "ACTIVE")
        .first()
    )
    if active_plan:
        return active_plan

    return generate_and_save_plan(db=db, user_id=user_id)


def generate_and_save_plan(db: Session, user_id: str) -> PreventivePlan:
    # 1. Archive any currently active plans for this user
    existing_plans = (
        db.query(PreventivePlan)
        .filter(PreventivePlan.user_id == user_id, PreventivePlan.status == "ACTIVE")
        .all()
    )
    for p in existing_plans:
        p.status = "ARCHIVED"

    # 2. Run fresh assessment and trend calculations
    assessment = perform_diabetes_assessment(db=db, user_id=user_id)
    trends = calculate_user_trends(db=db, user_id=user_id, window_days=14)
    raw_recs = generate_recommendations(assessment_summary=assessment, trends_summary=trends)

    # 3. Add holistic domains: Stress / Recovery and Hydration if not already present
    plan_title = "Cardiometabolic & Preventive Wellness Action Plan"
    new_plan = PreventivePlan(
        user_id=user_id,
        title=plan_title,
        status="ACTIVE",
        review_period_days=30,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_plan)
    db.flush()

    for rec in raw_recs:
        item = PlanItem(
            plan_id=new_plan.id,
            category=rec.category,
            title=rec.title,
            target_action=rec.target_action,
            rationale=rec.rationale,
            guideline_source=rec.guideline_source,
            difficulty=rec.difficulty,
            is_adopted_into_habit=False,
        )
        db.add(item)

    # Always ensure a restorative stress/mindfulness guideline is provided
    stress_item = PlanItem(
        plan_id=new_plan.id,
        category="STRESS_MANAGEMENT",
        title="Mindful Transition & Cortisol Downregulation",
        target_action="Engage in a 5-minute diaphragmatic breathing or quiet unwinding routine before beginning your evening meal.",
        rationale="Chronic sympathetic nervous system activation elevates fasting cortisol and promotes hepatic gluconeogenesis. Brief breathing routines lower resting sympathetic tone.",
        guideline_source="American Heart Association (AHA) Life's Essential 8 — Psychological Health & Well-being (2022)",
        difficulty="EASY",
        is_adopted_into_habit=False,
    )
    db.add(stress_item)

    db.commit()
    db.refresh(new_plan)
    return new_plan


def adopt_plan_item_into_habit(
    db: Session,
    user_id: str,
    item_id: int,
    schedule_time: Optional[str] = None,
    frequency: str = "DAILY",
) -> Habit:
    item = db.query(PlanItem).filter(PlanItem.id == item_id).first()
    if not item:
        raise ValueError("Plan item not found.")

    # Verify ownership through the plan
    plan = db.query(PreventivePlan).filter(PreventivePlan.id == item.plan_id, PreventivePlan.user_id == user_id).first()
    if not plan:
        raise ValueError("Unauthorized access to this plan item.")

    if item.is_adopted_into_habit and item.adopted_habit_id:
        existing_habit = db.query(Habit).filter(Habit.id == item.adopted_habit_id).first()
        if existing_habit:
            return existing_habit

    # Map category to Habit category
    habit_in = HabitCreate(
        title=item.title,
        category=item.category,
        target_action=item.target_action,
        frequency=frequency,
        target_value=None,
        target_unit=None,
        schedule_time=schedule_time or "Daily Routine",
        difficulty=item.difficulty,
    )

    habit = create_habit(db=db, user_id=user_id, habit_in=habit_in)
    item.is_adopted_into_habit = True
    item.adopted_habit_id = habit.id
    db.commit()
    db.refresh(item)
    return habit
