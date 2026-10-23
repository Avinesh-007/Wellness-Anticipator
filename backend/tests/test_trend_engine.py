from datetime import datetime, timezone, timedelta
from app.services.trend_engine import compute_series_baseline, calculate_user_trends


def test_baseline_insufficient_data_does_not_impute_zero():
    # Only 1 observation in a 14-day window
    values = [8500.0]
    baseline = compute_series_baseline(
        values=values,
        window_days=14,
        metric_name="STEPS"
    )
    assert baseline.data_quality_status == "INSUFFICIENT_DATA"
    assert baseline.sample_count == 1
    assert baseline.missing_days == 13
    assert baseline.mean is None
    assert baseline.ewma is None
    assert baseline.z_score is None


def test_baseline_sufficient_data_calculation():
    # 7 observations over 7 days
    values = [8000.0, 8500.0, 8200.0, 9000.0, 8600.0, 8800.0, 9200.0]
    baseline = compute_series_baseline(
        values=values,
        window_days=7,
        metric_name="STEPS"
    )
    assert baseline.data_quality_status == "SUFFICIENT"
    assert baseline.sample_count == 7
    assert baseline.missing_days == 0
    assert baseline.mean is not None
    assert baseline.mean > 8000.0
    assert baseline.ewma is not None
    assert baseline.trend_direction in ["IMPROVING", "STABLE"]


def test_hypertensive_crisis_anomaly_escalation(auth_user_a, client, db_session):
    now = datetime.now(timezone.utc)
    
    # Ingest severe hypertensive blood pressure reading (185/125 mmHg)
    client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "BLOOD_PRESSURE",
            "value_numeric": 185.0,
            "secondary_numeric": 125.0,
            "unit": "mmHg",
            "measured_at": now.isoformat()
        },
        headers=auth_user_a["headers"]
    )

    trends = calculate_user_trends(db_session, auth_user_a["user"]["id"], window_days=14)
    anomalies = trends["anomalies"]
    assert len(anomalies) >= 1
    crisis_alert = next((a for a in anomalies if a["alert_type"] == "HYPERTENSIVE_CRISIS_THRESHOLD"), None)
    assert crisis_alert is not None
    assert crisis_alert["severity"] == "URGENT_CLINICAL"
    assert "immediate clinical consultation" in crisis_alert["action_guidance"].lower()


def test_api_trends_summary_endpoint(auth_user_a, client):
    # Log 3 days of steps
    client.post("/api/v1/activities/", json={"recorded_date": "2026-10-21", "step_count": 8000}, headers=auth_user_a["headers"])
    client.post("/api/v1/activities/", json={"recorded_date": "2026-10-22", "step_count": 8500}, headers=auth_user_a["headers"])
    client.post("/api/v1/activities/", json={"recorded_date": "2026-10-23", "step_count": 9000}, headers=auth_user_a["headers"])

    resp = client.get("/api/v1/trends/summary?window=14", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert data["metrics"]["steps"]["sample_count"] >= 3
    assert "telemetry_governance_disclaimer" in data
