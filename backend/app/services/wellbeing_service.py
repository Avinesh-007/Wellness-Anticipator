"""
Subjective Wellbeing Check-In Service
Wellness Anticipator — Phase 1
Captures mood, perceived stress, and energy with non-diagnostic lifestyle reflection.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from app.models.wellbeing import WellbeingCheckIn
from app.schemas.wellbeing import (
    WellbeingCheckInCreate,
    WellbeingCheckInResponse,
    WellbeingTrendSummary,
)


def get_today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def record_wellbeing_checkin(
    db: Session,
    user_id: str,
    checkin_in: WellbeingCheckInCreate
) -> WellbeingCheckIn:
    target_date = checkin_in.recorded_date or get_today_str()

    existing = (
        db.query(WellbeingCheckIn)
        .filter(WellbeingCheckIn.user_id == user_id, WellbeingCheckIn.recorded_date == target_date)
        .first()
    )

    if existing:
        existing.mood_score = checkin_in.mood_score
        existing.stress_level = checkin_in.stress_level
        existing.energy_level = checkin_in.energy_level
        existing.sleep_perceived_quality = checkin_in.sleep_perceived_quality
        existing.reflection_notes = checkin_in.reflection_notes
        db.commit()
        db.refresh(existing)
        return existing

    new_checkin = WellbeingCheckIn(
        user_id=user_id,
        recorded_date=target_date,
        mood_score=checkin_in.mood_score,
        stress_level=checkin_in.stress_level,
        energy_level=checkin_in.energy_level,
        sleep_perceived_quality=checkin_in.sleep_perceived_quality,
        reflection_notes=checkin_in.reflection_notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)
    return new_checkin


def get_today_checkin(db: Session, user_id: str) -> Optional[WellbeingCheckIn]:
    today_str = get_today_str()
    return (
        db.query(WellbeingCheckIn)
        .filter(WellbeingCheckIn.user_id == user_id, WellbeingCheckIn.recorded_date == today_str)
        .first()
    )


def get_wellbeing_trends(db: Session, user_id: str, window_days: int = 14) -> WellbeingTrendSummary:
    today_str = get_today_str()
    start_date_str = (datetime.now(timezone.utc) - timedelta(days=window_days - 1)).strftime("%Y-%m-%d")

    records = (
        db.query(WellbeingCheckIn)
        .filter(
            WellbeingCheckIn.user_id == user_id,
            WellbeingCheckIn.recorded_date >= start_date_str,
            WellbeingCheckIn.recorded_date <= today_str,
        )
        .order_by(WellbeingCheckIn.recorded_date.desc())
        .all()
    )

    total_count = len(records)
    coverage_pct = round((total_count / float(window_days)) * 100.0, 1) if window_days > 0 else 0.0

    if total_count == 0:
        return WellbeingTrendSummary(
            window_days=window_days,
            total_checkins=0,
            coverage_percentage=0.0,
            average_mood=None,
            average_energy=None,
            predominant_stress_level=None,
            stress_distribution={"LOW": 0, "MODERATE": 0, "HIGH": 0},
            recent_checkins=[],
        )

    avg_mood = round(sum(r.mood_score for r in records) / float(total_count), 2)
    avg_energy = round(sum(r.energy_level for r in records) / float(total_count), 2)

    stress_dist: Dict[str, int] = {"LOW": 0, "MODERATE": 0, "HIGH": 0}
    for r in records:
        level = r.stress_level.upper() if r.stress_level else "MODERATE"
        stress_dist[level] = stress_dist.get(level, 0) + 1

    predominant_stress = max(stress_dist.items(), key=lambda kv: kv[1])[0]

    return WellbeingTrendSummary(
        window_days=window_days,
        total_checkins=total_count,
        coverage_percentage=coverage_pct,
        average_mood=avg_mood,
        average_energy=avg_energy,
        predominant_stress_level=predominant_stress,
        stress_distribution=stress_dist,
        recent_checkins=[WellbeingCheckInResponse.model_validate(r) for r in records],
    )
