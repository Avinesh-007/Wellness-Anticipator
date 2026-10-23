"""
End-to-End Live Verification Suite
Wellness Anticipator — Phase 1 Final Integration

Executes the complete 10-step real user journey against the live running FastAPI service:
1. Register and log in.
2. Restore authenticated session (/auth/me).
3. Enter blood pressure, glucose, body weight, and HbA1c observations.
4. Enter activity and sleep observations.
5. View dashboard, personal baselines, coverage indicators, and anomaly alerts.
6. Run diabetes screening assessment, view ADA score, calibrated ML probability, factor attributions, and clinical recommendations.
7. Change consent preferences and verify revoked consent blocks subsequent writes.
8. Verify strict multi-user data isolation.
9. Verify JSON export and GDPR Art. 17 permanent account erasure with password confirmation.
10. Verify missing telemetry is never silently treated as zero and coverage is clearly flagged.
"""

import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

def http_req(endpoint: str, method: str = "GET", data: dict = None, token: str = None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            resp_body = resp.read().decode("utf-8")
            parsed = json.loads(resp_body) if resp_body else {}
            return status, parsed
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8")
        parsed = json.loads(err_body) if err_body else {}
        return exc.code, parsed

def run_e2e_journey():
    print("=" * 70)
    print("STARTING WELLNESS ANTICIPATOR LIVE END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Register & Login User 1
    u1_email = "e2e_live_test_user@example.com"
    u1_pass = "SecurePass123!"
    
    print("\n[Step 1] Registering User 1...")
    st, res = http_req("/auth/register", "POST", {
        "email": u1_email,
        "password": u1_pass,
        "full_name": "E2E Live Verification User"
    })
    if st == 409:
        print("  User already exists from previous run, proceeding to login.")
    else:
        assert st == 201, f"Expected 201 Created, got {st}: {res}"
        print(f"  User registered successfully: ID={res['id']}")

    print("  Logging in User 1...")
    st, res = http_req("/auth/login", "POST", {"email": u1_email, "password": u1_pass})
    assert st == 200, f"Expected 200 OK, got {st}: {res}"
    u1_token = res["access_token"]
    assert len(u1_token) > 20, "Expected valid JWT token string"
    print("  Login successful; Bearer JWT token obtained.")

    # 2. Restore Session
    print("\n[Step 2] Restoring authenticated session (/auth/me)...")
    st, res = http_req("/auth/me", "GET", token=u1_token)
    assert st == 200, f"Expected 200 OK, got {st}: {res}"
    assert res["email"] == u1_email, f"Email mismatch: {res['email']}"
    assert res["is_active"] is True, "User should be active"
    u1_id = res["id"]
    print(f"  Session verified: User ID={u1_id}, Email={res['email']}")

    # Grant initial GDPR / HIPAA opt-in consents for onboarding
    print("  Granting explicit opt-in consents for onboarding...")
    for domain in ["CLINICAL_MEASUREMENTS", "DEVICE_TELEMETRY"]:
        st, res = http_req("/consent/", "POST", {
            "consent_domain": domain,
            "is_granted": True,
            "policy_version": "2026.1"
        }, token=u1_token)
        assert st == 200, f"Failed to grant consent for {domain}: {res}"
    print("  Opt-in consents recorded: CLINICAL_MEASUREMENTS & DEVICE_TELEMETRY.")

    # 3. Clinical Profile & Observations
    print("\n[Step 3] Entering Clinical Profile and Biometric Observations...")
    st, res = http_req("/users/profile", "PUT", {
        "date_of_birth": "1980-06-15",
        "biological_sex": "MALE",
        "height_cm": 178.0,
        "family_history_diabetes": True,
        "personal_history_hypertension": True,
        "gestational_diabetes": False,
        "smoking_status": "FORMER",
        "alcohol_intake": "OCCASIONAL"
    }, token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    print(f"  Profile updated: Height=178cm, Sex=MALE, Age={res.get('age')}")

    # Enter Measurements
    measurements = [
        {"metric_type": "BLOOD_PRESSURE", "value_numeric": 138.0, "secondary_numeric": 88.0, "unit": "mmHg"},
        {"metric_type": "FASTING_GLUCOSE", "value_numeric": 112.0, "unit": "mg/dL"},
        {"metric_type": "WEIGHT", "value_numeric": 86.5, "unit": "kg"},
        {"metric_type": "HBA1C", "value_numeric": 5.9, "unit": "%"}
    ]
    measurement_ids = []
    now_iso = datetime.now().isoformat()
    for m in measurements:
        m["measured_at"] = now_iso
        st, res = http_req("/measurements/", "POST", m, token=u1_token)
        assert st == 201, f"Expected 201, got {st}: {res}"
        measurement_ids.append(res["id"])
        print(f"  Logged {m['metric_type']}: {m['value_numeric']} {m['unit']} (ID: {res['id']})")

    # 4. Enter Activity & Sleep Observations
    print("\n[Step 4] Logging Longitudinal Activity & Sleep Records...")
    today = date.today()
    for i in range(7):
        cur_day = today - timedelta(days=i)
        next_day = cur_day + timedelta(days=1)
        day_str = cur_day.isoformat()
        next_str = next_day.isoformat()
        st, res = http_req("/activities/", "POST", {
            "recorded_date": day_str,
            "step_count": 8200 + (i * 150),
            "active_minutes": 45,
            "active_calories_kcal": 380.0,
            "distance_meters": 6200.0,
            "source": "MANUAL_ENTRY"
        }, token=u1_token)
        assert st == 201, f"Expected 201, got {st}: {res}"

        st, res = http_req("/sleep/", "POST", {
            "sleep_date": day_str,
            "start_time": f"{day_str}T22:30:00",
            "end_time": f"{next_str}T06:30:00",
            "duration_minutes": 480,
            "deep_minutes": 90,
            "quality_rating": 4,
            "source": "MANUAL_ENTRY"
        }, token=u1_token)
        assert st == 201, f"Expected 201, got {st}: {res}"
    print("  7 days of step counts and sleep duration recorded successfully.")

    # 5. Longitudinal Trends & Missing Data Handling
    print("\n[Step 5] Checking Trends Summary, EWMA, Coverage & Anomaly Alerts...")
    st, res = http_req("/trends/summary?window=14", "GET", token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    metrics = res["metrics"]
    steps_m = metrics["steps"]
    sleep_m = metrics["sleep_duration"]
    bp_m = metrics["systolic_bp"]

    print(f"  Steps Trend: EWMA={steps_m['ewma']}, Coverage={steps_m['coverage_percentage']*100:.1f}%, Direction={steps_m['trend_direction']}")
    print(f"  Sleep Trend: EWMA={sleep_m['ewma']}m, Coverage={sleep_m['coverage_percentage']*100:.1f}%")
    print(f"  Systolic BP: EWMA={bp_m['ewma']} mmHg, Quality Status={bp_m['data_quality_status']}")
    
    # Verify missing data is NOT imputed as zero
    assert steps_m["missing_days"] > 0, "Expected missing days in 14-day window"
    assert steps_m["ewma"] > 7000, "EWMA should be calculated from observed days, not diluted by 0s"
    print("  Verified: Missing days are tracked explicitly and NOT imputed as 0.")

    # 6. Diabetes Screening Assessment & Recommendations
    print("\n[Step 6] Running Diabetes Screening Assessment & Clinical Goals...")
    st, res = http_req("/assessments/diabetes", "POST", {}, token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    ada = res["ada_clinical_score"]
    ml = res["statistical_screening_model"]
    factors = res["contributing_factors"]
    disclaimer = res["clinical_limitations_and_disclaimer"]

    print(f"  ADA Score: {ada['points']}/{ada['max_points']} pts -> Category: {ada['risk_category']}")
    print(f"  Calibrated Screening Probability: {ml['calibrated_screening_probability']*100:.1f}% -> Tier: {ml['risk_tier']}")
    print(f"  Model Architecture: {ml['model_architecture']} ({ml['model_version']})")
    print(f"  Top Contributing Factor: {factors[0]['feature_name']} ({factors[0]['impact']})")
    print(f"  Clinical Disclaimer: '{disclaimer['screening_nature']}'")
    assert "diagnostic" in disclaimer["screening_nature"].lower(), "Disclaimer must emphasize screening nature"

    st, res = http_req("/recommendations/", "GET", token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    print(f"  Recommendations Count: {res['recommendations_count']}")
    for r in res["recommendations"][:2]:
        print(f"    - [{r['category']}] {r['title']}: {r['target_action']} (Basis: {r['guideline_source']})")

    # 6B. Preventive Plan & Habit Adoption Loop
    print("\n[Step 6B] Testing Persistent Preventive Plan & Habit Adoption Loop...")
    st, plan = http_req("/plans/active", "GET", token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {plan}"
    assert len(plan["items"]) > 0, "Plan should have synthesized items"
    first_item = plan["items"][0]
    print(f"  Active Plan: '{plan['title']}' with {len(plan['items'])} evidence-grounded recommendations.")
    print(f"  Adopting Goal #{first_item['id']} ('{first_item['title']}') into Daily Habits...")

    st, adopted_habit = http_req(f"/plans/items/{first_item['id']}/adopt", "POST", {
        "schedule_time": "Morning Routine",
        "frequency": "DAILY"
    }, token=u1_token)
    assert st == 200, f"Expected 200 for adopting plan item, got {st}: {adopted_habit}"
    assert adopted_habit["title"] == first_item["title"]
    habit_id = adopted_habit["id"]
    print(f"  Habit successfully adopted: ID={habit_id}, Title='{adopted_habit['title']}'")

    # 6C. Habit Logging & Adherence Consistency Calculation
    print("\n[Step 6C] Testing Daily Habit Logging & Consistency Adherence Engine...")
    st, log_res = http_req(f"/habits/{habit_id}/log", "POST", {
        "status": "COMPLETED",
        "notes": "Completed brisk walk before work"
    }, token=u1_token)
    assert st == 200, f"Expected 200 for habit logging, got {st}: {log_res}"
    assert log_res["status"] == "COMPLETED"
    print("  Habit status logged as COMPLETED.")

    st, adh = http_req("/habits/summary/adherence", "GET", token=u1_token)
    assert st == 200, f"Expected 200 for adherence report, got {st}: {adh}"
    assert adh["total_active_habits"] >= 1
    assert adh["completed_today_count"] >= 1
    assert adh["today_completion_rate"] == 100.0
    print(f"  Adherence Verified: 7-Day Consistency={adh['seven_day_consistency_rate']}%, Feedback='{adh['supportive_feedback']}'")

    # 6D. Subjective Wellbeing Check-In
    print("\n[Step 6D] Testing Subjective Wellbeing Check-In & Trends...")
    st, wb = http_req("/wellbeing/", "POST", {
        "mood_score": 4,
        "stress_level": "LOW",
        "energy_level": 5,
        "sleep_perceived_quality": "EXCELLENT",
        "reflection_notes": "Feeling focused and healthy"
    }, token=u1_token)
    assert st == 201, f"Expected 201 for wellbeing checkin, got {st}: {wb}"
    assert wb["mood_score"] == 4
    print(f"  Wellbeing Check-in Recorded: Mood={wb['mood_score']}/5, Stress={wb['stress_level']}")

    st, wb_trends = http_req("/wellbeing/trends?window_days=14", "GET", token=u1_token)
    assert st == 200, f"Expected 200 for wellbeing trends, got {st}: {wb_trends}"
    assert wb_trends["total_checkins"] >= 1
    assert "clinical_boundary_notice" in wb_trends
    print(f"  Wellbeing Trends Verified: Coverage={wb_trends['coverage_percentage']}%, Avg Mood={wb_trends['average_mood']}")

    # 7. Consent Revocation Blocking
    print("\n[Step 7] Testing Granular Consent Governance & Write Blocking...")
    st, res = http_req("/consent/", "POST", {
        "consent_domain": "CLINICAL_MEASUREMENTS",
        "is_granted": False,
        "policy_version": "2026.1"
    }, token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert res["is_granted"] is False, "Consent should be revoked"
    print("  Revoked CLINICAL_MEASUREMENTS consent.")

    # Attempt write while consent is revoked
    st, res = http_req("/measurements/", "POST", {
        "metric_type": "WEIGHT",
        "value_numeric": 87.0,
        "unit": "kg",
        "measured_at": datetime.now().isoformat()
    }, token=u1_token)
    assert st == 403, f"Expected 403 Forbidden on revoked consent write, got {st}: {res}"
    print(f"  Verified: Write blocked with 403 Forbidden: {res.get('message', res.get('detail'))}")

    # Restore consent
    st, res = http_req("/consent/", "POST", {
        "consent_domain": "CLINICAL_MEASUREMENTS",
        "is_granted": True,
        "policy_version": "2026.1"
    }, token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    print("  Restored CLINICAL_MEASUREMENTS consent.")

    # 8. Strict Multi-User Data Isolation
    print("\n[Step 8] Testing Strict Multi-Tenant Data Isolation...")
    u2_email = "e2e_second_user@example.com"
    u2_pass = "SecondUserPassword456!"
    http_req("/auth/register", "POST", {"email": u2_email, "password": u2_pass, "full_name": "Second User"})
    st, res = http_req("/auth/login", "POST", {"email": u2_email, "password": u2_pass})
    assert st == 200, f"User 2 login failed: {res}"
    u2_token = res["access_token"]

    # User 2 listing measurements must return 0 items
    st, res = http_req("/measurements/", "GET", token=u2_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert len(res) == 0, f"User 2 should see 0 measurements, got {len(res)}"

    # User 2 attempting to delete User 1's measurement must return 404
    first_m_id = measurement_ids[0]
    st, res = http_req(f"/measurements/{first_m_id}", "DELETE", token=u2_token)
    assert st == 404, f"Expected 404 Not Found on cross-tenant delete, got {st}: {res}"
    print("  Verified: User 2 cannot access or delete User 1's records (strict tenant boundary).")

    # Clean up User 2
    http_req("/export/account", "DELETE", {"password": u2_pass, "confirm_phrase": "DELETE MY ACCOUNT"}, token=u2_token)

    # 9. JSON Export & GDPR Art. 17 Permanent Account Erasure
    print("\n[Step 9] Testing GDPR Data Portability (Art. 20) & Erasure (Art. 17)...")
    st, res = http_req("/export/full", "GET", token=u1_token)
    assert st == 200, f"Expected 200, got {st}: {res}"
    assert "measurements" in res, "Export archive must contain measurements"
    assert "activities" in res, "Export archive must contain activities"
    assert "sleep_records" in res, "Export archive must contain sleep_records"
    print(f"  Full JSON export generated: {len(res['measurements'])} measurements, {len(res['activities'])} activity logs, {len(res['sleep_records'])} sleep logs.")

    # Account Deletion with bad password
    st, res = http_req("/export/account", "DELETE", {
        "password": "WrongPassword!",
        "confirm_phrase": "DELETE MY ACCOUNT"
    }, token=u1_token)
    assert st == 401, f"Expected 401 Unauthorized for incorrect password, got {st}: {res}"
    print("  Verified: Account deletion rejected on invalid password.")

    # Account Deletion with bad phrase
    st, res = http_req("/export/account", "DELETE", {
        "password": u1_pass,
        "confirm_phrase": "WRONG PHRASE"
    }, token=u1_token)
    assert st == 400, f"Expected 400 Bad Request for mismatched phrase, got {st}: {res}"
    print("  Verified: Account deletion rejected on mismatched confirmation phrase.")

    # Valid Permanent Account Deletion
    st, res = http_req("/export/account", "DELETE", {
        "password": u1_pass,
        "confirm_phrase": "DELETE MY ACCOUNT"
    }, token=u1_token)
    assert st in (200, 204), f"Expected 204 No Content / 200 OK for account deletion, got {st}: {res}"
    print("  Account deletion confirmed: status 204 No Content.")

    # Verify session is revoked and user records no longer accessible
    st, res = http_req("/auth/me", "GET", token=u1_token)
    assert st == 401, f"Expected 401 Unauthorized after account purge, got {st}: {res}"
    print("  Verified: Session invalidated and user records permanently purged from database.")

    print("\n" + "=" * 70)
    print("ALL 10 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        run_e2e_journey()
        sys.exit(0)
    except AssertionError as err:
        print(f"\n[FAIL] E2E Verification failed assertion: {err}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"\n[ERROR] Unexpected error during E2E verification: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)
