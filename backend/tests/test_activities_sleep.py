from datetime import datetime, timezone, timedelta


def test_activity_batch_and_list(auth_user_a, client):
    records = [
        {
            "recorded_date": "2026-10-21",
            "step_count": 8200,
            "active_minutes": 40,
            "active_calories_kcal": 350.0,
            "distance_meters": 6000.0,
            "source": "ANDROID_HEALTH_CONNECT"
        },
        {
            "recorded_date": "2026-10-22",
            "step_count": 9400,
            "active_minutes": 55,
            "active_calories_kcal": 410.0,
            "distance_meters": 6900.0,
            "source": "ANDROID_HEALTH_CONNECT"
        }
    ]
    resp_batch = client.post(
        "/api/v1/activities/batch",
        json={"records": records},
        headers=auth_user_a["headers"]
    )
    assert resp_batch.status_code == 200
    assert len(resp_batch.json()) == 2

    # Query activity list
    resp_list = client.get("/api/v1/activities/", headers=auth_user_a["headers"])
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 2
    assert resp_list.json()[0]["step_count"] in [8200, 9400]


def test_sleep_creation_and_validation(auth_user_a, client):
    start = datetime(2026, 10, 22, 23, 0, tzinfo=timezone.utc)
    end = datetime(2026, 10, 23, 7, 0, tzinfo=timezone.utc)

    # Valid sleep session
    resp = client.post(
        "/api/v1/sleep/",
        json={
            "sleep_date": "2026-10-23",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration_minutes": 480,
            "deep_minutes": 90,
            "rem_minutes": 110,
            "light_minutes": 280,
            "quality_rating": 4
        },
        headers=auth_user_a["headers"]
    )
    assert resp.status_code == 201
    assert resp.json()["duration_minutes"] == 480

    # Invalid sleep times: end_time <= start_time
    resp_invalid = client.post(
        "/api/v1/sleep/",
        json={
            "sleep_date": "2026-10-23",
            "start_time": end.isoformat(),
            "end_time": start.isoformat(),
            "duration_minutes": 480
        },
        headers=auth_user_a["headers"]
    )
    assert resp_invalid.status_code == 422
    assert "strictly greater" in resp_invalid.text
