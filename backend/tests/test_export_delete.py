from datetime import datetime, timezone


def test_full_export_and_right_to_be_forgotten(auth_user_a, client):
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # 1. User A logs a measurement and an activity
    client.post(
        "/api/v1/measurements/",
        json={
            "metric_type": "WEIGHT",
            "value_numeric": 74.5,
            "unit": "kg",
            "measured_at": now_iso
        },
        headers=auth_user_a["headers"]
    )
    client.post(
        "/api/v1/activities/",
        json={"recorded_date": "2026-10-23", "step_count": 9200},
        headers=auth_user_a["headers"]
    )

    # 2. Test GDPR Article 20 full data export
    export_resp = client.get("/api/v1/export/full", headers=auth_user_a["headers"])
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    assert export_data["user_profile"]["email"] == auth_user_a["email"]
    assert len(export_data["measurements"]) >= 1
    assert len(export_data["activities"]) >= 1
    assert "consents" in export_data

    # 3. Test GDPR Article 17 Account Deletion - Invalid Confirmation Phrase
    bad_phrase_resp = client.request(
        "DELETE",
        "/api/v1/export/account",
        json={"password": auth_user_a["password"], "confirm_phrase": "please delete me"},
        headers=auth_user_a["headers"]
    )
    assert bad_phrase_resp.status_code == 400
    assert bad_phrase_resp.json()["error_code"] == "INVALID_CONFIRMATION_PHRASE"

    # 4. Test Account Deletion - Wrong Password
    bad_pw_resp = client.request(
        "DELETE",
        "/api/v1/export/account",
        json={"password": "WrongPassword999!", "confirm_phrase": "DELETE MY ACCOUNT"},
        headers=auth_user_a["headers"]
    )
    assert bad_pw_resp.status_code == 401
    assert bad_pw_resp.json()["error_code"] == "INVALID_CREDENTIALS"

    # 5. Successful Account Deletion
    del_resp = client.request(
        "DELETE",
        "/api/v1/export/account",
        json={"password": auth_user_a["password"], "confirm_phrase": "DELETE MY ACCOUNT"},
        headers=auth_user_a["headers"]
    )
    assert del_resp.status_code == 204

    # 6. Verify user can no longer authenticate
    relogin = client.post(
        "/api/v1/auth/login",
        json={"email": auth_user_a["email"], "password": auth_user_a["password"]}
    )
    assert relogin.status_code == 401
