"""
Tests for Habit Engine, Preventive Plans, and Subjective Wellbeing Check-Ins
Wellness Anticipator — Phase 1
"""

import pytest
from fastapi.testclient import TestClient


def test_habit_lifecycle_and_adherence(client: TestClient, auth_user_a: dict):
    headers = auth_user_a["headers"]

    # 1. Initially no habits
    res = client.get("/api/v1/habits/", headers=headers)
    assert res.status_code == 200
    assert res.json() == []

    # 2. Check initial adherence summary
    res = client.get("/api/v1/habits/summary/adherence", headers=headers)
    assert res.status_code == 200
    adh = res.json()
    assert adh["total_active_habits"] == 0
    assert adh["today_completion_rate"] == 0.0

    # 3. Create a habit
    habit_payload = {
        "title": "Evening 15-Minute Brisk Walk",
        "category": "PHYSICAL_ACTIVITY",
        "target_action": "Brisk walk around the block post-dinner",
        "frequency": "DAILY",
        "target_value": 2000.0,
        "target_unit": "steps",
        "schedule_time": "20:00",
        "difficulty": "ACHIEVABLE"
    }
    res = client.post("/api/v1/habits/", json=habit_payload, headers=headers)
    assert res.status_code == 201
    created = res.json()
    assert created["title"] == "Evening 15-Minute Brisk Walk"
    assert created["completed_today"] is False
    habit_id = created["id"]

    # 4. Log habit as completed today
    log_payload = {
        "status": "COMPLETED",
        "value_achieved": 2200.0,
        "notes": "Felt refreshing and energizing"
    }
    res = client.post(f"/api/v1/habits/{habit_id}/log", json=log_payload, headers=headers)
    assert res.status_code == 200
    log_data = res.json()
    assert log_data["status"] == "COMPLETED"
    assert log_data["value_achieved"] == 2200.0

    # 5. Verify habit now reflects completion today
    res = client.get("/api/v1/habits/", headers=headers)
    assert res.status_code == 200
    habits = res.json()
    assert len(habits) == 1
    assert habits[0]["completed_today"] is True
    assert habits[0]["today_status"] == "COMPLETED"
    assert habits[0]["seven_day_consistency_pct"] > 0

    # 6. Verify adherence summary updated
    res = client.get("/api/v1/habits/summary/adherence", headers=headers)
    assert res.status_code == 200
    adh = res.json()
    assert adh["total_active_habits"] == 1
    assert adh["completed_today_count"] == 1
    assert adh["today_completion_rate"] == 100.0
    assert "supportive_feedback" in adh


def test_preventive_plan_generation_and_habit_adoption(client: TestClient, auth_user_a: dict):
    headers = auth_user_a["headers"]

    # 1. Fetch or generate active preventive plan
    res = client.get("/api/v1/plans/active", headers=headers)
    assert res.status_code == 200
    plan = res.json()
    assert plan["status"] == "ACTIVE"
    assert len(plan["items"]) > 0

    # Verify clinical evidence guidelines are present
    item = plan["items"][0]
    assert "guideline_source" in item
    assert "target_action" in item
    assert item["is_adopted_into_habit"] is False

    # 2. Adopt plan item directly into daily habits
    item_id = item["id"]
    res = client.post(
        f"/api/v1/plans/items/{item_id}/adopt",
        json={"schedule_time": "Morning", "frequency": "DAILY"},
        headers=headers,
    )
    assert res.status_code == 200
    adopted_habit = res.json()
    assert adopted_habit["title"] == item["title"]
    assert adopted_habit["category"] == item["category"]

    # 3. Verify plan item is now marked as adopted
    res = client.get("/api/v1/plans/active", headers=headers)
    assert res.status_code == 200
    updated_plan = res.json()
    adopted_item = next(i for i in updated_plan["items"] if i["id"] == item_id)
    assert adopted_item["is_adopted_into_habit"] is True
    assert adopted_item["adopted_habit_id"] == adopted_habit["id"]


def test_wellbeing_checkin_and_trends(client: TestClient, auth_user_a: dict):
    headers = auth_user_a["headers"]

    # 1. Submit today's checkin
    checkin_payload = {
        "mood_score": 4,
        "stress_level": "LOW",
        "energy_level": 4,
        "sleep_perceived_quality": "GOOD",
        "reflection_notes": "Productive day, exercised and slept 7.5 hours"
    }
    res = client.post("/api/v1/wellbeing/", json=checkin_payload, headers=headers)
    assert res.status_code == 201
    checkin = res.json()
    assert checkin["mood_score"] == 4
    assert checkin["stress_level"] == "LOW"

    # 2. Query today's check-in
    res = client.get("/api/v1/wellbeing/today", headers=headers)
    assert res.status_code == 200
    today_checkin = res.json()
    assert today_checkin is not None
    assert today_checkin["mood_score"] == 4

    # 3. Query trends
    res = client.get("/api/v1/wellbeing/trends?window_days=14", headers=headers)
    assert res.status_code == 200
    trends = res.json()
    assert trends["total_checkins"] >= 1
    assert trends["average_mood"] == 4.0
    assert trends["predominant_stress_level"] == "LOW"
    assert "clinical_boundary_notice" in trends
