# Wellness Anticipator — REST API Specification

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Backend Systems & API Design Lead  

---

## 1. API Architecture & Standards

- **Base URL:** `/api/v1`
- **Transport Security:** Mandatory TLS 1.3 (HTTPS) in all environments outside local dev.
- **Authentication Scheme:** `Authorization: Bearer <access_token>` (RFC 6750 JWT).
- **Content Negotiation:** `application/json` (unless requesting binary report exports: `application/pdf` or `application/zip`).
- **Standard Timestamp Representation:** ISO 8601 UTC format (`YYYY-MM-DDTHH:MM:SSZ`).
- **Standard Date Representation:** ISO 8601 Date (`YYYY-MM-DD`).

### 1.1 Standard Error Envelope
All error responses return a standardized RFC 7807 problem details object:

```json
{
  "error_code": "RESOURCE_VALIDATION_FAILED",
  "message": "Input validation error occurred.",
  "details": [
    {
      "field": "value_numeric",
      "issue": "Systolic blood pressure cannot exceed 300 mmHg."
    }
  ],
  "timestamp": "2026-10-23T12:00:00Z",
  "path": "/api/v1/measurements/"
}
```

---

## 2. Authentication & Identity (`/api/v1/auth`)

### 2.1 Register New User
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "elena.developer@example.com",
  "password": "CorrectHorseBatteryStaple!2026",
  "full_name": "Elena Rostova"
}
```
- **Validation Rules:**
  - `email`: Valid RFC 5322 email string.
  - `password`: Minimum 10 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character.
- **Responses:**
  - `201 Created`: Returns user profile with initial consent requirements.
  - `409 Conflict`: Email already registered.

### 2.2 Login & Issue Token
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** None (Public)
- **Request Body:** Standard `application/x-www-form-urlencoded` or JSON:
```json
{
  "username": "elena.developer@example.com",
  "password": "CorrectHorseBatteryStaple!2026"
}
```
- **Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "e4b2d5a0-9c12-4e32-b7e1-8f3a5b6c7d8e",
    "email": "elena.developer@example.com",
    "full_name": "Elena Rostova"
  }
}
```

---

## 3. Consent Management (`/api/v1/consent`)

### 3.1 Get Current Consent Status
- **Endpoint:** `GET /api/v1/consent/`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "consents": [
    {
      "consent_domain": "CLINICAL_MEASUREMENTS",
      "is_granted": true,
      "policy_version": "v1.0-2026",
      "updated_at": "2026-10-20T08:30:00Z"
    },
    {
      "consent_domain": "DEVICE_TELEMETRY",
      "is_granted": true,
      "policy_version": "v1.0-2026",
      "updated_at": "2026-10-20T08:30:00Z"
    },
    {
      "consent_domain": "USAGE_STATS",
      "is_granted": false,
      "policy_version": "v1.0-2026",
      "updated_at": "2026-10-20T08:30:00Z"
    }
  ]
}
```

### 3.2 Update Granular Consent
- **Endpoint:** `POST /api/v1/consent/`
- **Auth:** Required
- **Request Body:**
```json
{
  "consent_domain": "USAGE_STATS",
  "is_granted": true,
  "policy_version": "v1.0-2026"
}
```
- **Response `200 OK`:** Updated consent state.

---

## 4. Clinical Profile (`/api/v1/profile/clinical`)

### 4.1 Get Clinical Profile
- **Endpoint:** `GET /api/v1/profile/clinical`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "user_id": "e4b2d5a0-9c12-4e32-b7e1-8f3a5b6c7d8e",
  "date_of_birth": "1984-06-14",
  "age": 42,
  "biological_sex": "FEMALE",
  "height_cm": 168.0,
  "family_history_diabetes": true,
  "personal_history_hypertension": false,
  "gestational_diabetes": false,
  "smoking_status": "NEVER",
  "alcohol_intake": "MODERATE",
  "updated_at": "2026-10-21T09:15:00Z"
}
```

### 4.2 Upsert Clinical Profile
- **Endpoint:** `PUT /api/v1/profile/clinical`
- **Auth:** Required
- **Validation Rules:**
  - `height_cm`: Between 50.0 and 250.0.
  - `date_of_birth`: Must be between 18 and 120 years in the past.
- **Response `200 OK`:** Profile updated.

---

## 5. Clinical Measurements (`/api/v1/measurements`)

### 5.1 Ingest Measurement
- **Endpoint:** `POST /api/v1/measurements/`
- **Auth:** Required (Requires `CLINICAL_MEASUREMENTS` consent)
- **Request Body (Blood Pressure Example):**
```json
{
  "metric_type": "BLOOD_PRESSURE",
  "value_numeric": 122.0,
  "secondary_numeric": 78.0,
  "unit": "mmHg",
  "measured_at": "2026-10-23T07:45:00Z",
  "source": "MANUAL_ENTRY",
  "notes": "Morning resting reading"
}
```
- **Request Body (Fasting Glucose Example):**
```json
{
  "metric_type": "FASTING_GLUCOSE",
  "value_numeric": 96.0,
  "unit": "mg/dL",
  "measured_at": "2026-10-23T07:30:00Z",
  "source": "LAB_REPORT"
}
```
- **Physiological Bound Checks:**
  - `BLOOD_PRESSURE`: $40 \le SBP \le 300$, $30 \le DBP \le 200$.
  - `FASTING_GLUCOSE`: $30 \le Glucose \le 600$ mg/dL.
  - `WEIGHT`: $20 \le Weight \le 400$ kg.
- **Response `201 Created`:** Persisted measurement with anomaly review flag.

---

## 6. Physical Activity & Sleep (`/api/v1/activities` & `/api/v1/sleep`)

### 6.1 Batch Synchronize Activity Records
Used by Android Health Connect background sync.
- **Endpoint:** `POST /api/v1/activities/batch`
- **Auth:** Required
- **Request Body:**
```json
{
  "records": [
    {
      "recorded_date": "2026-10-21",
      "step_count": 8420,
      "active_minutes": 45,
      "active_calories_kcal": 380.0,
      "distance_meters": 6120.0,
      "source": "ANDROID_HEALTH_CONNECT"
    },
    {
      "recorded_date": "2026-10-22",
      "step_count": 9150,
      "active_minutes": 50,
      "active_calories_kcal": 410.0,
      "distance_meters": 6700.0,
      "source": "ANDROID_HEALTH_CONNECT"
    }
  ]
}
```
- **Response `200 OK`:** Summary of inserted and updated dates.

### 6.2 Log Sleep Session
- **Endpoint:** `POST /api/v1/sleep/`
- **Auth:** Required
- **Request Body:**
```json
{
  "sleep_date": "2026-10-23",
  "start_time": "2026-10-22T23:15:00Z",
  "end_time": "2026-10-23T06:45:00Z",
  "duration_minutes": 450,
  "deep_minutes": 85,
  "rem_minutes": 105,
  "light_minutes": 260,
  "quality_rating": 4,
  "source": "ANDROID_HEALTH_CONNECT"
}
```
- **Response `201 Created`:** Sleep session registered.

---

## 7. Disease-Specific Risk Assessment (`/api/v1/assessments`)

### 7.1 Evaluate Type 2 Diabetes Risk
Calculates validated ADA score and runs inference via calibrated CDC BRFSS ML pipeline.
- **Endpoint:** `POST /api/v1/assessments/diabetes`
- **Auth:** Required
- **Request Body (Optional overrides; falls back to saved profile and telemetry):**
```json
{
  "use_latest_biometrics": true,
  "manual_overrides": {
    "weight_kg": 76.5,
    "physical_activity_active": true
  }
}
```
- **Response `200 OK`:**
```json
{
  "assessment_id": "a9103e42-7c81-4210-91ff-2c0918e3845b",
  "assessment_type": "DIABETES_T2D",
  "created_at": "2026-10-23T12:05:00Z",
  "model_version": "t2d-brfss-gbt-v1.0.0",
  "risk_score": 0.284,
  "risk_tier": "MODERATE_RISK",
  "clinical_score": {
    "tool_name": "American Diabetes Association (ADA) 60-Second Risk Test",
    "points": 4,
    "max_points": 10,
    "threshold_increased_risk": 5
  },
  "contributing_factors": [
    {
      "feature": "Age (42 years)",
      "impact": "POSITIVE_RISK",
      "relative_contribution": 0.22,
      "explanation": "Risk naturally increases with age bracket (40-49)."
    },
    {
      "feature": "Family History of Diabetes",
      "impact": "POSITIVE_RISK",
      "relative_contribution": 0.35,
      "explanation": "Immediate family history significantly elevates hereditary predisposition."
    },
    {
      "feature": "Regular Physical Activity",
      "impact": "PROTECTIVE",
      "relative_contribution": -0.18,
      "explanation": "Averaging > 7,500 daily steps and regular exercise reduces metabolic risk."
    }
  ],
  "limitations": {
    "intended_population": "Adults aged 18-80 without existing clinical diagnosis of Type 1 or Type 2 Diabetes.",
    "uncertainty_disclosure": "Model trained on cross-sectional self-reported survey data (CDC BRFSS). Calibrated Brier score: 0.118.",
    "clinical_escalation": "This is a preventive wellness screening model, not a medical diagnosis. If you experience excessive thirst, unexplained weight loss, or persistent fatigue, consult a licensed physician for fasting plasma glucose or HbA1c lab testing."
  }
}
```

---

## 8. Baseline Trends & Anomalies (`/api/v1/trends`)

### 8.1 Get Longitudinal Trends Summary
- **Endpoint:** `GET /api/v1/trends/summary?window=30`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "window_days": 30,
  "metrics": {
    "steps": {
      "current_ewma": 8412.5,
      "mean": 8105.0,
      "std_dev": 1240.2,
      "trend_direction": "STABLE",
      "change_percentage_vs_previous_period": 3.8
    },
    "sleep_duration": {
      "current_ewma": 435.0,
      "mean": 428.0,
      "std_dev": 48.5,
      "trend_direction": "IMPROVING",
      "regularity_score": 82.0
    },
    "systolic_blood_pressure": {
      "current_ewma": 121.2,
      "mean": 122.5,
      "std_dev": 4.1,
      "trend_direction": "STABLE"
    }
  },
  "active_anomalies": [
    {
      "metric": "SCREEN_TIME",
      "date": "2026-10-22",
      "deviation_z_score": 2.8,
      "observed_value": 540,
      "baseline_value": 310,
      "message": "Screen time was significantly higher than your 30-day baseline."
    }
  ]
}
```

---

## 9. Data Portability & Right to be Forgotten (`/api/v1/export`)

### 9.1 Export Complete User Health Record
- **Endpoint:** `POST /api/v1/export/full`
- **Auth:** Required
- **Response `200 OK`:** Initiates packaging or downloads ZIP archive containing:
  - `profile.json`
  - `clinical_measurements.csv`
  - `activity_history.csv`
  - `sleep_sessions.csv`
  - `risk_assessments.json`
  - `audit_trail.csv`

### 9.2 Delete Account & Health Data ("Right to be Forgotten")
- **Endpoint:** `DELETE /api/v1/export/account`
- **Auth:** Required (requires confirmation payload: `{"confirm_email": "...", "password": "..."}`)
- **Action:** Cascades complete deletion across `users`, `clinical_profiles`, `measurements`, `activity_records`, `sleep_records`, and assessment logs.
- **Response `204 No Content`**
