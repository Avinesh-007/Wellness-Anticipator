from datetime import datetime, timezone, timedelta


def test_measurement_crud_flow(auth_user_a, client):
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # 1. Create Blood Pressure
    bp_resp = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "BLOOD_PRESSURE",
            "value_numeric": 118.0,
            "secondary_numeric": 76.0,
            "unit": "mmHg",
            "measured_at": now_iso,
            "notes": "Resting morning measurement"
        },
        headers=auth_user_a["headers"]
    )
    assert bp_resp.status_code == 201
    bp_data = bp_resp.json()
    assert bp_data["value_numeric"] == 118.0
    assert bp_data["secondary_numeric"] == 76.0
    bp_id = bp_data["id"]

    # 2. Create Fasting Glucose
    glu_resp = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "FASTING_GLUCOSE",
            "value_numeric": 92.0,
            "unit": "mg/dL",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert glu_resp.status_code == 201

    # 3. List measurements with filter
    list_bp = client.get("/api/v1/measurements/?metric_type=BLOOD_PRESSURE", headers=auth_user_a["headers"])
    assert list_bp.status_code == 200
    assert len(list_bp.json()) == 1
    assert list_bp.json()[0]["id"] == bp_id

    # 4. Delete measurement
    del_resp = client.delete(f"/api/v1/measurements/{bp_id}", headers=auth_user_a["headers"])
    assert del_resp.status_code == 204

    # 5. Confirm deleted
    get_del = client.get(f"/api/v1/measurements/{bp_id}", headers=auth_user_a["headers"])
    assert get_del.status_code == 404


def test_measurement_unit_validation(auth_user_a, client):
    now_iso = datetime.now(timezone.utc).isoformat()
    # Sending 'bpm' as unit for FASTING_GLUCOSE
    resp = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "FASTING_GLUCOSE",
            "value_numeric": 90.0,
            "unit": "bpm",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert resp.status_code == 422
    assert "Invalid unit" in resp.text


def test_bp_bounds_validation(auth_user_a, client):
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # SBP <= DBP
    resp_inverted = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "BLOOD_PRESSURE",
            "value_numeric": 80.0,
            "secondary_numeric": 120.0,
            "unit": "mmHg",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert resp_inverted.status_code == 422
    assert "strictly greater" in resp_inverted.text

    # SBP > 300 mmHg
    resp_extreme = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "BLOOD_PRESSURE",
            "value_numeric": 350.0,
            "secondary_numeric": 80.0,
            "unit": "mmHg",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert resp_extreme.status_code == 422
    assert "physiological bounds" in resp_extreme.text


def test_future_timestamp_validation(auth_user_a, client):
    # Timestamp 10 days in the future
    future_time = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    resp = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "WEIGHT",
            "value_numeric": 72.0,
            "unit": "kg",
            "measured_at": future_time
        },
        headers=auth_user_a["headers"]
    )
    assert resp.status_code == 422
    assert "cannot be in the future" in resp.text
