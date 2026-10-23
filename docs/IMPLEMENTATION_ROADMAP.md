# Wellness Anticipator — Implementation Roadmap & Delivery Plan

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Technical Program Manager & Multi-Platform Engineering Leads  

---

## 1. Roadmap Overview & Phasing Principles

To deliver a working, safe, and clinically defensible platform within a hackathon timeframe while ensuring long-term architectural stability, the project is structured into **four sequential phases**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 0: Complete Planning, Architecture, Data & AI Strategy (Current Phase)     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Gate 0 Passed: Specs Approved
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: MVP Core Platform & Diabetes Prevention Module                          │
│ • Modular FastAPI Monolith + SQLite/Postgres DB + Alembic Migrations             │
│ • Validated ADA Risk Score + Calibrated BRFSS ML Pipeline                        │
│ • Web Dashboard (React/TS/Vite) with Visualizations & Reports                    │
│ • Android Native App (Kotlin) with Health Connect + Manual Entry Fallback        │
│ • Core Baseline Trend Engine (7d/14d EWMA) + Export & Right-to-be-Forgotten      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Gate 1 Passed: Core E2E Tests Green
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Expanded Telemetry, Passive Screen Time & Engagement                    │
│ • Android UsageStatsManager Screen Time Ingestion                                │
│ • Nutrition & Mood/Stress Subjective Check-Ins                                   │
│ • Automated Anomaly Alerting & Proactive Goal Tracking                           │
│ • Waterfall Feature Attribution Charts & Mobile Notification Reminders           │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Gate 2 Passed: Telemetry & Mobile Verified
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Cardiovascular Risk & Advanced Clinical Informatics                     │
│ • 10-Year ASCVD Cardiovascular Risk Screener (AHA/ACC Pooled Cohort Equations)   │
│ • Blood Pressure Phenotyping & Circadian Dipping Pattern Analysis                │
│ • Clinician-Facing One-Page Executive Health Summary PDF                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase-by-Phase Detailed Specifications

### Phase 0: Complete Planning & System Design (CURRENT)
- **Objective:** Establish airtight requirements, schemas, clinical boundaries, ML strategies, and architecture before writing code.
- **Key Deliverables:**
  - 10 complete architecture and governance documents in `docs/`.
  - Root `README.md` and repository layout specification.
  - Canonical OpenAPI schemas in `contracts/`.
- **Testing Gates:**
  - Full consistency review across docs (schemas, models, APIs, and ML metrics align).
  - Explicit sign-off on clinical boundary rules and ethical disclosures.
- **Definition of Done (DoD):** All Phase 0 documentation verified, zero code written prematurely, user review requested.

---

### Phase 1: MVP Core Platform & Diabetes Prevention Module
- **Objective:** Deliver a fully functional, end-to-end usable cross-platform system demonstrating personalized diabetes risk screening and daily activity/sleep tracking.
- **Deliverables:**
  1. **Backend Infrastructure:**
     - Modular FastAPI application with routers: `/auth`, `/consent`, `/profile`, `/measurements`, `/activities`, `/sleep`, `/assessments`, `/trends`, `/export`.
     - SQLAlchemy 2.0 models and Alembic migrations.
     - JWT authentication with granular consent interceptor.
     - Complete GDPR export (JSON/CSV) and account deletion endpoint.
  2. **AI/ML & Trend Engines:**
     - Preprocessing and training scripts for CDC BRFSS dataset.
     - Baseline Logistic Regression and calibrated Gradient Boosting models.
     - Validated ADA 60-Second Risk Test rule engine.
     - Local explainability service generating top contributing factors.
     - Personal Baseline Engine computing 7-day and 14-day EWMA for activity and vitals.
  3. **React Web Dashboard:**
     - Modern responsive UI with TailwindCSS.
     - Auth pages (Login, Register, Consent Opt-In).
     - Clinical Profile form and Manual Vitals Ingestion (Blood Pressure, Glucose, Weight).
     - Visual risk summary cards with factor attribution waterfall.
     - Longitudinal metric charts (Recharts) for activity and sleep.
     - Health report viewer and instant JSON export download.
  4. **Native Android Application:**
     - Jetpack Compose interface adhering to Material 3.
     - Health Connect Client integration for steps and sleep sessions.
     - Permission handling with graceful manual entry fallback.
     - REST API integration via Retrofit with local Room buffering.
     - Personal risk summary and biometric input screens.
- **Dependencies:** Approved Phase 0 specifications.
- **Testing Gates:**
  - 100% passing backend unit and integration tests (pytest $\ge 85\%$ coverage).
  - Model evaluation report generated: Test AUROC $\ge 0.78$, Brier score $\le 0.15$.
  - End-to-end ingestion and risk assessment verified via automated test script.
- **Definition of Done (DoD):** A user can register, enter biometrics manually or sync steps/sleep from Android, receive an explainable diabetes risk score, review trends on web or mobile, and export their full data archive.

---

### Phase 2: Expanded Telemetry, Passive Screen Time & Engagement
- **Objective:** Broaden the lifestyle data domain by adding digital usage analytics, subjective wellness check-ins, and proactive goal loops.
- **Deliverables:**
  1. **Android Screen Time Pipeline:**
     - `UsageStatsManager` service aggregating daily screen-on minutes and top app categories.
     - Explicit user permission flow for Android Usage Access.
     - API ingestion endpoint `/api/v1/screen-time`.
  2. **Subjective Lifestyle Logging:**
     - Nutrition check-in form (fruit/vegetable servings, sugary drinks, hydration).
     - Mood and perceived stress rating (1-5 scales) with daily prompt.
  3. **Intelligent Anomaly Detection & Alerting:**
     - Z-score deviation detector comparing 3-day short-term trends to 30-day baseline.
     - Contextual notification (e.g., "Screen time up 60% while sleep decreased by 1.5 hours").
  4. **Goal Setting & Progress Tracking:**
     - Dynamic micro-goals linked to assessment results (e.g., "Hit 7,500 daily steps for 5 days").
     - Progress check-in endpoint and visual milestone badges.
- **Dependencies:** Phase 1 stable deployment.
- **Testing Gates:**
  - Android battery and background sync tests pass without memory leaks.
  - Anomaly detection unit tests pass on edge cases (zero data, sudden step spikes, noisy outliers).
- **Definition of Done (DoD):** Screen time is passively ingested on Android, daily subjective logs are captured, and anomalies trigger non-alarmist contextual feedback.

---

### Phase 3: Cardiovascular Risk & Advanced Clinical Informatics
- **Objective:** Extend disease assessment capabilities into cardiovascular and metabolic health without compromising clinical safety.
- **Deliverables:**
  1. **Cardiovascular Risk Module (ASCVD):**
     - Implementation of AHA/ACC 10-Year Pooled Cohort Equations (age, sex, systolic BP, total/HDL cholesterol, smoking, diabetes history).
     - Clinical validation against published trial tables.
     - Escalation logic for stage 2 hypertension ($SBP \ge 140$ or $DBP \ge 90$).
  2. **Advanced Blood Pressure Informatics:**
     - Morning vs. evening BP variability analysis.
     - Mean arterial pressure (MAP) calculation: $MAP = DBP + \frac{1}{3}(SBP - DBP)$.
  3. **Clinician Executive Summary PDF:**
     - One-page printable PDF report designed specifically for primary care consultations.
     - Includes 30-day vitals distribution, confirmed data provenance, and lifestyle trends.
- **Dependencies:** Phase 1 & 2 stable baseline.
- **Testing Gates:**
  - ASCVD calculator verified against standard clinical reference test vectors.
  - PDF generation renders identically across web and mobile downloads.
- **Definition of Done (DoD):** User can run both Diabetes and ASCVD assessments, view BP trends, and hand a standardized one-page summary to their physician.

---

## 3. Work Breakdown Structure (WBS) & Sprint Schedule

| Sprint / Week | Phase | Epic / Area | Primary Tasks | Deliverables |
|---|---|---|---|---|
| **Week 1 (Day 1-2)** | **Phase 1** | Backend Core & Data | Setup FastAPI modular repo, SQLAlchemy entities, Alembic migrations, JWT Auth, Consent interceptor. | Working backend auth and database migrations. |
| **Week 1 (Day 3-4)** | **Phase 1** | AI/ML Pipeline | Acquire CDC BRFSS, run data validation, train baseline Logistic Regression & HistGradientBoost, verify calibration, save joblib artifacts. | Verified ML artifacts, evaluation report, and model registry. |
| **Week 1 (Day 5-6)** | **Phase 1** | Ingestion & Risk APIs | Implement `/measurements`, `/activities`, `/sleep`, `/assessments/diabetes`, and Baseline Trend Engine. | Fully functioning REST API with test suite. |
| **Week 2 (Day 7-9)** | **Phase 1** | Web Dashboard | Build React/TS/Vite dashboard, forms, charts (Recharts), risk breakdown, export view. | Functional Web App connected to backend. |
| **Week 2 (Day 10-12)** | **Phase 1** | Android Native App | Build Jetpack Compose UI, Health Connect sync adapter, Room cache, Retrofit client. | Working Android APK syncing steps/sleep and displaying scores. |
| **Week 2 (Day 13-14)** | **Phase 1** | Integration & E2E | End-to-end integration testing, polish, Docker compose, test coverage verification. | **Phase 1 MVP Release Complete.** |
| **Week 3** | **Phase 2** | Screen Time & Goals | Android UsageStatsManager, nutrition/mood check-ins, anomaly service, notification reminders. | Phase 2 Release. |
| **Week 4** | **Phase 3** | CVD Risk & Clinical PDF | AHA/ACC ASCVD equations, BP trend analytics, Clinician PDF generator. | Phase 3 Release. |
