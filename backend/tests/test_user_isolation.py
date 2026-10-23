from datetime import datetime, timezone


def test_measurements_user_isolation(auth_user_a, auth_user_b, client):
    # 1. User A logs blood pressure
    now_iso = datetime.now(timezone.utc).isoformat()
    resp_a = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "BLOOD_PRESSURE",
            "value_numeric": 120.0,
            "secondary_numeric": 80.0,
            "unit": "mmHg",
            "measured_at": now_iso,
            "notes": "User A secret reading"
        },
        headers=auth_user_a["headers"]
    )
    assert resp_a.status_code == 201
    measurement_id = resp_a.json()["id"]

    # 2. User B lists measurements -> must be empty
    resp_b_list = client.get("/api/v1/measurements/", headers=auth_user_b["headers"])
    assert resp_b_list.status_code == 200
    assert len(resp_b_list.json()) == 0

    # 3. User B attempts to access User A's measurement directly by ID -> must return 404
    resp_b_direct = client.get(f"/api/v1/measurements/{measurement_id}", headers=auth_user_b["headers"])
    assert resp_b_direct.status_code == 404
    assert resp_b_direct.json()["error_code"] == "RESOURCE_NOT_FOUND"

    # 4. User B attempts to delete User A's measurement -> must return 404
    resp_b_delete = client.delete(f"/api/v1/measurements/{measurement_id}", headers=auth_user_b["headers"])
    assert resp_b_delete.status_code == 404

    # 5. User A can still retrieve their own measurement
    resp_a_check = client.get(f"/api/v1/measurements/{measurement_id}", headers=auth_user_a["headers"])
    assert resp_a_check.status_code == 200
    assert resp_a_check.json()["value_numeric"] == 120.0


def test_activity_user_isolation(auth_user_a, auth_user_b, client):
    # User A logs activity
    client.post(
        "/api/v1/activities/",
        json={
            "recorded_date": "2026-10-23",
            "step_count": 10500,
            "active_minutes": 60,
            "active_calories_kcal": 450.0,
            "distance_meters": 7500.0
        },
        headers=auth_user_a["headers"]
    )

    # User B queries activities -> must not see User A's steps
    resp_b = client.get("/api/v1/activities/", headers=auth_user_b["headers"])
    assert resp_b.status_code == 200
    assert len(resp_b.json()) == 0
