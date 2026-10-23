# Wellness Anticipator — Requirements Traceability Matrix (RTM)

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Lead Software Architect & Quality Engineering Lead  

---

## 1. Traceability Matrix Overview

The Requirements Traceability Matrix (RTM) establishes bidirectional traceability between high-level user requirements, system architecture components, database entities, implementation phases, and automated verification test cases.

---

## 2. Functional Requirements Traceability

| Req ID | Requirement Summary | Planned Architectural Component | Database Entities | Release Phase | Verification Test Case |
|---|---|---|---|---|---|
| **FR-01** | User Registration & Auth | `app/api/v1/endpoints/auth.py`<br>`app/core/security.py` | `users` | **Phase 1 (MVP)** | `tests/api/test_auth.py::test_register_and_login`<br>`tests/security/test_password_hashing.py` |
| **FR-02** | Granular Consent Management | `app/api/v1/endpoints/consent.py`<br>`app/api/deps.py` (`ConsentInterceptor`) | `consent_records` | **Phase 1 (MVP)** | `tests/security/test_consent.py::test_revoked_consent_blocks_ingestion` |
| **FR-03** | Clinical History Profile | `app/api/v1/endpoints/users.py`<br>`web/src/pages/ProfilePage.tsx`<br>`android/.../ui/profile/` | `clinical_profiles` | **Phase 1 (MVP)** | `tests/api/test_profile.py::test_upsert_clinical_profile` |
| **FR-04** | Clinical Measurements (BP, Glucose) | `app/api/v1/endpoints/measurements.py`<br>`web/src/pages/LogVitalsPage.tsx` | `measurements` | **Phase 1 (MVP)** | `tests/api/test_measurements.py::test_ingest_bp_and_glucose`<br>`tests/api/test_measurements.py::test_bounds_rejection` |
| **FR-05** | Fitness & Physical Activity | `app/api/v1/endpoints/activities.py`<br>`android/.../data/healthconnect/` | `activity_records` | **Phase 1 (MVP)** | `tests/api/test_activities.py::test_batch_activity_sync`<br>`android/.../HealthConnectAdapterTest.kt` |
| **FR-06** | Sleep Records & Sleep Trends | `app/api/v1/endpoints/sleep.py`<br>`android/.../data/healthconnect/` | `sleep_records` | **Phase 1 (MVP)** | `tests/api/test_sleep.py::test_sleep_session_ingestion` |
| **FR-07** | Screen Time & Digital Usage | `app/api/v1/endpoints/screen_time.py`<br>`android/.../data/usagestats/` | `screen_time_records` | **Phase 2** | `tests/api/test_screen_time.py::test_screen_time_ingest`<br>`android/.../UsageStatsManagerTest.kt` |
| **FR-08** | Nutrition & Mood Check-Ins | `app/api/v1/endpoints/checkins.py`<br>`web/src/components/CheckInModal.tsx` | `nutrition_checkins`<br>`mood_stress_checkins` | **Phase 2** | `tests/api/test_checkins.py::test_daily_checkin_logging` |
| **FR-09** | Health Connect Adapter & Fallback | `android/.../data/healthconnect/`<br>`android/.../ui/manual/` | Local Room Cache | **Phase 1 (MVP)** | `android/.../HealthConnectFallbackTest.kt` |
| **FR-10** | Personal Baseline Engine (EWMA) | `app/services/trend_engine.py`<br>`app/api/v1/endpoints/trends.py` | `baseline_metrics` | **Phase 1 (MVP)** | `tests/services/test_trend_engine.py::test_ewma_calculation`<br>`tests/services/test_trend_engine.py::test_zscore_trends` |
| **FR-11** | Data Quality & Boundary Checks | `app/schemas/measurement.py`<br>`app/services/anomaly_service.py` | `measurements` | **Phase 1 (MVP)** | `tests/schemas/test_validation.py::test_physiological_limits` |
| **FR-12** | Validated Diabetes Risk Assessment | `app/services/risk_service.py`<br>`ml/pipelines/train_diabetes_gbt.py` | `risk_assessments`<br>`model_metadata` | **Phase 1 (MVP)** | `tests/ml/test_clinical_ada_screener.py`<br>`tests/ml/test_ml_pipeline_calibration.py` |
| **FR-13** | Explainable Risk Factor Attributions | `app/services/risk_service.py`<br>`web/src/components/RiskCard.tsx` | `risk_assessments` | **Phase 1 (MVP)** | `tests/services/test_explainability.py::test_factor_attribution_ranking` |
| **FR-14** | Preventive Recommendations & Goals | `app/services/recommendation_service.py`<br>`app/api/v1/endpoints/recommendations.py` | `preventive_goals` | **Phase 1 (MVP)** | `tests/services/test_recommendations.py::test_goal_generation` |
| **FR-15** | Reminders & Anomaly Alerting | `app/services/anomaly_service.py`<br>`android/.../notifications/` | `baseline_metrics` | **Phase 2** | `tests/services/test_anomaly_service.py::test_deviation_detection` |
| **FR-16** | Timelines, Charts & Export/Deletion | `app/api/v1/endpoints/reports.py`<br>`app/api/v1/endpoints/export.py`<br>`web/src/pages/ExportPage.tsx` | All Entities + `audit_logs` | **Phase 1 (MVP)** | `tests/api/test_export.py::test_full_json_csv_zip_export`<br>`tests/security/test_deletion.py::test_cascade_account_purge` |
| **FR-17** | Cardiovascular (ASCVD) Extensibility | `app/services/cardio_risk_service.py` | `risk_assessments` | **Phase 3** | `tests/services/test_ascvd.py::test_aha_pooled_cohort_vectors` |

---

## 3. Non-Functional & Security Traceability

| Requirement Code | Description | Architectural Enforcement | Verification Test Case |
|---|---|---|---|
| **SEC-01** | Argon2id Hashing & JWT Auth | `app/core/security.py` | `tests/security/test_password_hashing.py`<br>`tests/security/test_jwt_tokens.py` |
| **SEC-02** | Multi-Tenant Data Isolation | Scoped Repository pattern (`WHERE user_id = :uid`) | `tests/security/test_tenant_isolation.py::test_cross_user_isolation` |
| **SEC-03** | Immutable PHI Audit Logging | `app/models/audit_log.py`<br>`app/services/audit_service.py` | `tests/security/test_audit.py::test_audit_trail_created_on_export` |
| **SEC-04** | GDPR Article 17 Account Purge | Atomic cascading delete on `users` table | `tests/security/test_deletion.py::test_right_to_be_forgotten` |
| **PERF-01** | Sub-150ms API Latency | Async FastAPI ASGI + Indexed DB Queries | `tests/performance/test_api_benchmark.py` |
| **PERF-02** | Sub-50ms ML Inference | In-memory cached `joblib` model pipeline | `tests/ml/test_inference_latency.py::test_sub_50ms_prediction` |
| **REL-01** | Android Offline Caching | Android Room SQLite offline sync queue | `android/.../RoomOfflineSyncTest.kt` |
| **UX-01** | Non-Alarmist Safe Communication | Design System: neutral risk tiers + escalation copy | UI component tests for disclaimer rendering |
