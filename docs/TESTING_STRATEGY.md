# Wellness Anticipator — Quality Assurance & Testing Strategy

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Quality Engineering Lead & Medical Software Verification Specialist  

---

## 1. Testing Philosophy & Clinical Verification Pyramid

In software handling personal health data and clinical risk calculations, bugs are not merely cosmetic: they can cause medical misinformation, user anxiety, or privacy breaches. Wellness Anticipator utilizes a **tiered verification pyramid** with strict, automated quality gates:

```
                    ▲
                   / \
                  /   \     End-to-End Patient Journey Smoke Tests
                 / E2E \    (Auth -> Ingest -> ML Risk -> Export)
                /───────\
               /  Integ  \  Cross-Tenant Isolation, API Routers,
              /   Tests   \ DB Migrations & Health Connect Mocking
             /─────────────\
            /  ML & Clin.   \ Deterministic ADA Clinical Vectors,
           /   Validation    \ Leakage Checks, Calibration & Invariance
          /───────────────────\
         /     Unit Tests      \ Pure Domain Logic, Math Formulas (EWMA),
        / (Pytest/Vitest/JUnit) \ Pydantic Schemas, Boundary Checks
       └─────────────────────────┘
```

---

## 2. Machine Learning & Clinical Score Verification

Machine learning pipelines require unique testing strategies beyond standard code coverage. We establish explicit automated tests for data integrity, clinical validity, and leakage prevention:

### 2.1 Deterministic Clinical Anchor Verification
The American Diabetes Association (ADA) 60-Second Risk Test is evaluated against published clinical test vignettes to guarantee zero algorithmic divergence:

```python
# Conceptual Verification Test: tests/ml/test_clinical_ada_screener.py
def test_ada_screener_clinical_vignettes():
    # Vignette 1: 52yo male, family history, hypertensive, active, BMI 31 -> High Risk (Score >= 5)
    patient_vignette_1 = {
        "age": 52,
        "biological_sex": "MALE",
        "family_history": True,
        "hypertension_history": True,
        "physically_active": True,
        "bmi": 31.0
    }
    score, tier = evaluate_ada_risk(patient_vignette_1)
    assert score == 6  # Age: 2, Sex: 1, Fam: 1, HTN: 1, Active: 0, BMI: 2
    assert tier == "HIGH_RISK"
```

### 2.2 Leakage Prevention & Pipeline Integrity Tests
1. **Preprocessor Isolation Test:** Verifies that scikit-learn transformers (`StandardScaler`, `SimpleImputer`) are never fitted on evaluation or test folds.
2. **Post-Diagnosis Feature Exclusion:** Asserts that the feature matrix input to the model does not contain downstream clinical treatments (e.g., insulin therapy, metformin, or diabetic retinopathy codes).
3. **Probability Invariance & Bounds:** Verifies that calibrated model outputs:
   - Always evaluate strictly between $0.0$ and $1.0$.
   - Maintain monotonic risk escalation as known risk factors (age, BMI) increase while all other variables remain constant.

---

## 3. Security, Privacy & Multi-Tenant Isolation Tests

### 3.1 Tenant Data Isolation Test
Automated tests in `tests/security/test_tenant_isolation.py` simulate two concurrent users:
1. `User_A` logs blood pressure and fasting glucose records.
2. `User_B` attempts to read, update, or delete `User_A`'s records via direct API endpoints (`GET /api/v1/measurements/{user_a_record_id}`).
3. **Success Assertion:** The server must return `404 Not Found` or `403 Forbidden`, and `User_B`'s dashboard query returns zero records belonging to `User_A`.

### 3.2 Granular Consent Enforcement Tests
1. **Revoked Consent Block:** A user revokes `CLINICAL_MEASUREMENTS` consent; subsequent `POST /api/v1/measurements/` requests must be blocked with HTTP `403`.
2. **Right to be Forgotten Verification:** A user invokes `DELETE /api/v1/export/account`. The test queries the database directly and asserts that `User`, `Measurements`, `ActivityRecords`, `SleepRecords`, and `RiskAssessments` rows for that user ID are exactly `0`.

---

## 4. Backend & API Integration Testing (pytest)

- **Test Framework:** `pytest`, `pytest-asyncio`, and FastAPI `TestClient` / `httpx`.
- **Test Database:** In-memory or temporary file-based SQLite database with Alembic migrations applied before test execution.
- **Coverage Target:** Minimum **85% statement coverage** across all backend routers and services; **100% statement and branch coverage** on security, consent, and clinical calculation logic.

### 4.1 Boundary Value & Input Validation Matrix

| Endpoint | Parameter | Tested Valid Inputs | Tested Invalid Inputs (Must Return 422) |
|---|---|---|---|
| `POST /measurements` | `value_numeric` (SBP) | `118.0`, `140.0`, `180.0` | `-10.0`, `0.0`, `350.0`, `"abc"` |
| `POST /measurements` | `value_numeric` (Glucose) | `75.0`, `110.0`, `220.0` | `10.0`, `1200.0`, `null` |
| `POST /profile/clinical` | `height_cm` | `150.0`, `175.5`, `210.0` | `20.0`, `320.0`, `-5.0` |
| `POST /activities/batch` | `step_count` | `0`, `5000`, `25000` | `-50`, `250000` (implausible single-day) |
| `POST /sleep` | `duration_minutes` | `360`, `480`, `600` | `-10`, `1600` (exceeds 24 hours) |

---

## 5. Web Frontend Testing (Vitest & Testing Library)

- **Unit & Component Testing:** Vitest and React Testing Library test individual UI components:
  - Form validation states (e.g., error highlights when typing an invalid blood pressure).
  - Risk card visual rendering based on API response tiers (`LOW_RISK` vs. `HIGH_RISK`).
  - Empty-state rendering when no telemetry is present.
- **API Mocking:** Mock Service Worker (MSW) intercepts network requests to test offline or degraded server responses.

---

## 6. Android Mobile Testing (JUnit & Robolectric)

- **Unit Testing:** JUnit 5 and MockK test Android ViewModels and repository classes.
- **Coroutines & Flow Testing:** Turbine library verifies `StateFlow` emissions during Health Connect synchronization.
- **Health Connect Mock Harness:** Dedicated test doubles mock the Android `HealthConnectClient`:
  - Test 1: SDK available, permissions granted -> pulls 7 days of steps -> emits sync success.
  - Test 2: SDK unavailable -> activates manual entry fallback without error crashes.
  - Test 3: Permissions denied -> emits graceful degraded state with manual prompt banner.

---

## 7. Automated End-to-End Smoke Test Journey

A complete headless script (`tests/e2e/test_patient_journey.py`) runs in CI:
1. **Register & Authenticate:** Create fresh test user, obtain JWT token.
2. **Grant Consents:** Opt in to `CLINICAL_MEASUREMENTS` and `DEVICE_TELEMETRY`.
3. **Populate Profile:** Set age 45, height 172cm, family history of diabetes.
4. **Ingest Vitals & Telemetry:** Post 7 days of step data (8,000 steps/day) and a blood pressure reading (125/82 mmHg).
5. **Run Diabetes Assessment:** Call `POST /api/v1/assessments/diabetes` and verify response contains score, tier, and explainable contributing factors.
6. **Verify Baseline Trends:** Query `GET /api/v1/trends/summary` and assert that 7-day EWMA step average reflects ingested data.
7. **Export Health Record:** Request `POST /api/v1/export/full` and verify returned ZIP contains valid CSV and JSON documents.
8. **Delete Account:** Execute `DELETE /api/v1/export/account` and confirm subsequent login fails with 401.

---

## 8. Continuous Integration (CI) Quality Gates

All pull requests must pass the following automated gates before merge:
- `black --check`, `isort --check`, `flake8` (Python styling & linting).
- `mypy backend/` (Python static type checking).
- `pytest tests/ --cov=app --cov-fail-under=85` (Backend test suite).
- `pytest tests/ml/` (Clinical risk & ML validation suite).
- `npm run lint && npm run test` (Web frontend checks).
- `./gradlew testDebugUnitTest` (Android unit tests).
