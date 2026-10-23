"""
Personal Baseline & Longitudinal Trend Engine
Wellness Anticipator — Phase 1

Principles:
  1. Exponentially Weighted Moving Averages (EWMA) with rolling statistical dispersion.
  2. Explicit missing-data handling: missing days are NEVER treated as zero.
  3. Strict clinical boundary: Telemetry trends describe lifestyle consistency and
     physiological variation; they NEVER diagnose or infer chronic disease.
"""

from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
import numpy as np
from sqlalchemy.orm import Session
from app.models.activity import ActivityRecord
from app.models.sleep import SleepRecord
from app.models.measurement import Measurement


@dataclass
class MetricBaseline:
    metric_name: str
    window_days: int
    data_quality_status: str  # "SUFFICIENT" or "INSUFFICIENT_DATA"
    sample_count: int
    missing_days: int
    coverage_percentage: float
    mean: Optional[float]
    std_dev: Optional[float]
    ewma: Optional[float]
    latest_value: Optional[float]
    z_score: Optional[float]
    trend_direction: str  # "IMPROVING", "STABLE", "DECLINING", "INSUFFICIENT_DATA"
    notes: str


@dataclass
class AnomalyAlert:
    metric_name: str
    severity: str  # "INFO", "WARNING", "URGENT_CLINICAL"
    alert_type: str
    message: str
    observed_value: float
    baseline_value: Optional[float]
    action_guidance: str


def compute_series_baseline(
    values: List[float],
    window_days: int,
    metric_name: str,
    higher_is_better: bool = True,
    alpha: float = 0.2
) -> MetricBaseline:
    """
    Computes baseline statistics over observed values in a time window.
    Explicitly refuses to substitute zeros for missing days.
    """
    sample_count = len(values)
    missing_days = max(0, window_days - sample_count)
    coverage_pct = round((sample_count / window_days) * 100.0, 1) if window_days > 0 else 0.0

    # Require at least 3 valid observations and >= 30% coverage to compute a reliable baseline
    if sample_count < 3 or coverage_pct < 30.0:
        latest = round(values[-1], 2) if sample_count > 0 else None
        return MetricBaseline(
            metric_name=metric_name,
            window_days=window_days,
            data_quality_status="INSUFFICIENT_DATA",
            sample_count=sample_count,
            missing_days=missing_days,
            coverage_percentage=coverage_pct,
            mean=None,
            std_dev=None,
            ewma=None,
            latest_value=latest,
            z_score=None,
            trend_direction="INSUFFICIENT_DATA",
            notes=f"Insufficient data ({sample_count}/{window_days} days logged). Log at least 3 days to establish baseline."
        )

    arr = np.array(values, dtype=float)
    mean_val = float(np.mean(arr))
    std_val = float(np.std(arr, ddof=1)) if sample_count > 1 else 0.0

    # Exponentially Weighted Moving Average (EWMA)
    ewma_val = float(arr[0])
    for v in arr[1:]:
        ewma_val = alpha * float(v) + (1.0 - alpha) * ewma_val

    latest_val = float(arr[-1])
    z_score = None
    if std_val > 1e-4:
        z_score = round(float((latest_val - mean_val) / std_val), 2)

    # Trend direction based on EWMA vs Mean
    diff_pct = ((ewma_val - mean_val) / mean_val) * 100.0 if abs(mean_val) > 1e-4 else 0.0
    if abs(diff_pct) < 5.0:
        trend = "STABLE"
    elif diff_pct > 5.0:
        trend = "IMPROVING" if higher_is_better else "DECLINING"
    else:
        trend = "DECLINING" if higher_is_better else "IMPROVING"

    return MetricBaseline(
        metric_name=metric_name,
        window_days=window_days,
        data_quality_status="SUFFICIENT",
        sample_count=sample_count,
        missing_days=missing_days,
        coverage_percentage=coverage_pct,
        mean=round(mean_val, 2),
        std_dev=round(std_val, 2),
        ewma=round(ewma_val, 2),
        latest_value=round(latest_val, 2),
        z_score=z_score,
        trend_direction=trend,
        notes=f"Baseline established from {sample_count} valid daily records over a {window_days}-day window."
    )


def calculate_user_trends(db: Session, user_id: str, window_days: int = 14) -> Dict[str, Any]:
    """
    Assembles multi-domain longitudinal trends strictly scoped to user_id.
    """
    start_date = date.today() - timedelta(days=window_days)

    # 1. Physical Activity (Daily Steps)
    activities = db.query(ActivityRecord).filter(
        ActivityRecord.user_id == user_id,
        ActivityRecord.recorded_date >= start_date
    ).order_by(ActivityRecord.recorded_date.asc()).all()
    step_values = [float(a.step_count) for a in activities]
    steps_baseline = compute_series_baseline(
        values=step_values,
        window_days=window_days,
        metric_name="STEPS",
        higher_is_better=True
    )

    # 2. Sleep Duration (Minutes Asleep)
    sleep_records = db.query(SleepRecord).filter(
        SleepRecord.user_id == user_id,
        SleepRecord.sleep_date >= start_date
    ).order_by(SleepRecord.sleep_date.asc()).all()
    sleep_values = [float(s.duration_minutes) for s in sleep_records]
    sleep_baseline = compute_series_baseline(
        values=sleep_values,
        window_days=window_days,
        metric_name="SLEEP_DURATION",
        higher_is_better=True
    )

    # 3. Blood Pressure Measurements
    bp_records = db.query(Measurement).filter(
        Measurement.user_id == user_id,
        Measurement.metric_type == "BLOOD_PRESSURE",
        Measurement.measured_at >= datetime.now(timezone.utc) - timedelta(days=window_days)
    ).order_by(Measurement.measured_at.asc()).all()
    sbp_values = [float(m.value_numeric) for m in bp_records if m.value_numeric is not None]
    dbp_values = [float(m.secondary_numeric) for m in bp_records if m.secondary_numeric is not None]
    sbp_baseline = compute_series_baseline(
        values=sbp_values,
        window_days=window_days,
        metric_name="SYSTOLIC_BP",
        higher_is_better=False
    )
    dbp_baseline = compute_series_baseline(
        values=dbp_values,
        window_days=window_days,
        metric_name="DIASTOLIC_BP",
        higher_is_better=False
    )

    # 4. Anomaly and Safety Escalation Evaluation
    anomalies: List[AnomalyAlert] = []

    # Blood Pressure Safety Escalation Rule (AHA Hypertensive Crisis threshold)
    if sbp_values and dbp_values:
        latest_sbp = sbp_values[-1]
        latest_dbp = dbp_values[-1]
        if latest_sbp >= 180.0 or latest_dbp >= 120.0:
            anomalies.append(AnomalyAlert(
                metric_name="BLOOD_PRESSURE",
                severity="URGENT_CLINICAL",
                alert_type="HYPERTENSIVE_CRISIS_THRESHOLD",
                message=f"Latest blood pressure reading ({latest_sbp:.0f}/{latest_dbp:.0f} mmHg) is severely elevated.",
                observed_value=latest_sbp,
                baseline_value=sbp_baseline.mean,
                action_guidance="Seek immediate clinical consultation or emergency medical evaluation. Avoid strenuous physical activity."
            ))
        elif latest_sbp >= 140.0 or latest_dbp >= 90.0:
            anomalies.append(AnomalyAlert(
                metric_name="BLOOD_PRESSURE",
                severity="WARNING",
                alert_type="STAGE_2_HYPERTENSION_THRESHOLD",
                message=f"Blood pressure reading ({latest_sbp:.0f}/{latest_dbp:.0f} mmHg) meets Stage 2 hypertension criteria.",
                observed_value=latest_sbp,
                baseline_value=sbp_baseline.mean,
                action_guidance="Repeat reading after 5 minutes of quiet rest. Discuss sustained readings with your primary healthcare provider."
            ))

    # Activity Drop Deviation Rule
    if steps_baseline.z_score is not None and steps_baseline.z_score <= -2.0:
        anomalies.append(AnomalyAlert(
            metric_name="STEPS",
            severity="INFO",
            alert_type="SIGNIFICANT_ACTIVITY_DROP",
            message=f"Your latest step count is significantly below your {window_days}-day personal baseline (Z-score: {steps_baseline.z_score}).",
            observed_value=float(steps_baseline.latest_value or 0),
            baseline_value=steps_baseline.mean,
            action_guidance="Gentle walking or micro-breaks can help restore daily baseline activity without excessive strain."
        ))

    # Sleep Disruption Deviation Rule
    if sleep_baseline.z_score is not None and sleep_baseline.z_score <= -2.0:
        anomalies.append(AnomalyAlert(
            metric_name="SLEEP_DURATION",
            severity="INFO",
            alert_type="SIGNIFICANT_SLEEP_DEBT",
            message=f"Your latest sleep duration was notably shorter than your {window_days}-day personal baseline (Z-score: {sleep_baseline.z_score}).",
            observed_value=float(sleep_baseline.latest_value or 0),
            baseline_value=sleep_baseline.mean,
            action_guidance="Consider an earlier bedtime wind-down and minimize screen use before sleep."
        ))

    return {
        "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
        "window_days": window_days,
        "metrics": {
            "steps": asdict(steps_baseline),
            "sleep_duration": asdict(sleep_baseline),
            "systolic_bp": asdict(sbp_baseline),
            "diastolic_bp": asdict(dbp_baseline)
        },
        "anomalies": [asdict(a) for a in anomalies],
        "telemetry_governance_disclaimer": (
            "Wellness telemetry (steps, sleep) reflects lifestyle patterns and personal consistency. "
            "Telemetry is never used in isolation to diagnose chronic disease."
        )
    }
