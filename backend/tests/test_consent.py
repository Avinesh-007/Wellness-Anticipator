from datetime import datetime, timezone


def test_consent_retrieval(auth_user_a, client):
    response = client.get("/api/v1/consent/", headers=auth_user_a["headers"])
    assert response.status_code == 200
    data = response.json()
    assert "consents" in data
    assert len(data["consents"]) >= 4


def test_consent_revocation_blocks_measurement(auth_user_a, client):
    # Revoke CLINICAL_MEASUREMENTS consent
    client.post(
        "/api/v1/consent/",
        json={"consent_domain": "CLINICAL_MEASUREMENTS", "is_granted": False},
        headers=auth_user_a["headers"]
    )

    # Attempt to post a measurement
    now_iso = datetime.now(timezone.utc).isoformat()
    response = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "FASTING_GLUCOSE",
            "value_numeric": 95.0,
            "unit": "mg/dL",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert response.status_code == 403
    data = response.json()
    assert data["error_code"] == "CONSENT_REQUIRED_OR_REVOKED"

    # Re-grant consent and verify ingestion succeeds
    client.post(
        "/api/v1/consent/",
        json={"consent_domain": "CLINICAL_MEASUREMENTS", "is_granted": True},
        headers=auth_user_a["headers"]
    )
    resp_success = client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "FASTING_GLUCOSE",
            "value_numeric": 95.0,
            "unit": "mg/dL",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    assert resp_success.status_code == 201


def test_consent_revocation_blocks_telemetry(auth_user_a, client):
    # Revoke DEVICE_TELEMETRY consent
    client.post(
        "/api/v1/consent/",
        json={"consent_domain": "DEVICE_TELEMETRY", "is_granted": False},
        headers=auth_user_a["headers"]
    )

    # Attempt to post activity
    resp = client.post(
        "/api/v1/activities/",
        json={"recorded_date": "2026-10-23", "step_count": 8000},
        headers=auth_user_a["headers"]
    )
    assert resp.status_code == 403
    assert resp.json()["error_code"] == "CONSENT_REQUIRED_OR_REVOKED"
