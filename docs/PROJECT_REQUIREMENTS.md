# Wellness Anticipator — Project Requirements Document (PRD)

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Multi-disciplinary Architecture, Clinical Informatics, & Engineering Team  

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem Statement
> **“From Reactive Disease Treatment to Personalized Preventive Wellness.”**

Modern healthcare systems remain overwhelmingly **reactive**. Individuals typically interact with medical professionals only after symptoms become unmanageable or acute chronic disease complications develop (e.g., symptomatic Type 2 Diabetes, hypertensive crises, or cardiovascular events). 

Simultaneously, the commercial digital health landscape is fractured:
- Most consumer health applications operate merely as isolated **fitness trackers** (step counters, active calories) or simplistic dashboards without clinical context.
- Commercial devices often present opaque, gamified "readiness" or "wellness" scores (red/yellow/green) that induce health anxiety without actionable explanation or medical validation.
- Validated clinical risk tools (e.g., ADA Diabetes Risk Score, Framingham, FINDRISC) remain buried in academic calculators or clinical EHR portals, disconnected from continuous daily longitudinal habits (sleep patterns, sedentary screen time, physical activity, weight fluctuations).

### 1.2 The Product Vision
**Wellness Anticipator** bridges this critical divide by creating an extensible, multi-domain preventive health platform that synthesizes:
1. **Clinical & Longitudinal History:** Validated personal, family, and demographic risk factors.
2. **Objective Device Telemetry:** Passive activity, sleep consistency, and digital screen-time metrics via native mobile sensor hubs.
3. **Point-in-Time Clinical Measurements:** Blood pressure, fasting glucose, HbA1c, lipid panel, and BMI.
4. **Subjective Check-Ins:** Mood, perceived stress, and nutritional quality.

The platform provides **explainable, evidence-informed preventive risk assessments**, dynamic **longitudinal trend analysis**, and **achievable lifestyle interventions** while strictly upholding ethical clinical safety boundaries.

---

## 2. Clinical Scope & Medical Boundary Principles

Wellness Anticipator is architected around foundational safety and clinical governance principles:

```
+---------------------------------------------------------------------------------------------------------+
|                                     CLINICAL BOUNDARY HIERARCHY                                         |
+---------------------------------------------------------------------------------------------------------+
|  [LEVEL 1: General Preventive Guidance]                                                                 |
|  Evidence-based population recommendations (WHO, AHA, ADA) on physical activity, sleep hygiene, fiber.  |
+---------------------------------------------------------------------------------------------------------+
|  [LEVEL 2: Personal Baseline & Trend Analysis]                                                          |
|  Statistical deviation (Z-score / Rolling EWMA) comparing current metrics against individual baseline.  |
+---------------------------------------------------------------------------------------------------------+
|  [LEVEL 3: Anomaly Detection]                                                                           |
|  Alerting on abrupt multi-day shifts (e.g., sudden RHR spike, sleep fragmentation + sedentary surge).   |
+---------------------------------------------------------------------------------------------------------+
|  [LEVEL 4: Disease-Specific Risk Assessment]                                                            |
|  Screening models trained on validated epidemiological surveys (e.g., CDC BRFSS / NHANES / ADA Tool)     |
|  requiring mandatory clinical inputs (age, BMI, family history, hypertension, prior prediabetes).       |
+---------------------------------------------------------------------------------------------------------+
|  [STRICTLY EXCLUDED: Clinical Diagnosis & Medication Modification]                                      |
|  NEVER diagnose clinical disease, NEVER modify drug regimens, NEVER infer disease from telemetry alone. |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1 Explicit Distinctions
1. **Disease-Risk Assessment vs. Diagnostic Advice:** Risk assessment calculates the statistical likelihood of developing or harboring an undiagnosed condition over a multi-year horizon (or eligibility for screening) based on validated demographic and clinical indicators. It is not an in-vitro diagnostic test.
2. **Telemetric Independence:** Passive telemetry (steps, screen time, sleep hours) **MUST NEVER** be used in isolation to infer diabetes, hypertension, or cardiovascular disease. Telemetry informs lifestyle habits and personal baselines, not clinical etiology.
3. **Escalation Pathways:** Whenever severe physiological anomalies are recorded (e.g., Blood Pressure $\ge 180/120$ mmHg or random blood glucose $> 250$ mg/dL), the platform immediately suspends automated lifestyle goals and displays clear, standardized medical escalation guidance urging urgent consultation with a licensed healthcare provider.

---

## 3. Target User Personas

| Persona ID | Name & Profile | Core Motivations | Pain Points | Primary Platform Need |
|---|---|---|---|---|
| **P-01** | **Elena (42, Desk-Bound Professional)** | High stress, sedentary screen work, family history of Type 2 Diabetes. | Wants to avoid diabetes like her parents, but overwhelmed by conflicting diet/exercise fads. | Transparent diabetes risk breakdown, passive Android screen/step tracking, realistic micro-goals. |
| **P-02** | **Marcus (58, Pre-Hypertensive Retiree)** | Transitioning to retirement, monitors blood pressure weekly at home. | Blood pressure readings sit in a paper notebook; doctor only sees a single reading every 6 months. | Longitudinal trend charting, CSV/PDF summary export for primary care physician, lifestyle tips. |
| **P-03** | **Aisha (29, Digital Native & Tech Worker)** | High screen time (10+ hours/day), irregular sleep, mild fatigue. | Doesn't feel "sick", but notices deteriorating stamina and poor sleep consistency. | Correlation between digital screen usage, sleep architecture, and daily energy; unobtrusive check-ins. |
| **P-04** | **Dr. Julian (Primary Care Physician)** | Reviews patient data during 15-minute consultations. | Frustrated by uncurated smart-watch dumps containing millions of unvalidated data points. | Standardized clinical risk score, 30-day blood pressure distribution, audit-verified data provenance. |

---

## 4. User Stories

### Epic 1: Identity, Consent & Profile Management
- **US-01:** As a new user, I want to create an account with email and password so that my private health data is safely partitioned.
- **US-02:** As a privacy-conscious user, I want to explicitly select granular consent options (e.g., consent to clinical measurements, device syncing, screen-time access) so that I maintain total sovereignty over my personal health information.
- **US-03:** As a user, I want to enter my age, biological sex, height, weight, and relevant personal/family history (e.g., parental diabetes, gestational diabetes, personal hypertension) so that risk models have necessary clinical baselines.

### Epic 2: Multi-Domain Health Data Ingestion
- **US-04:** As an Android user, I want the app to securely sync step count, active minutes, and sleep sessions from Android Health Connect with my explicit permission.
- **US-05:** As a user without smart wearables, I want to manually enter my daily steps, sleep duration, and clinical measurements (blood pressure, fasting glucose, weight) with clear validation feedback.
- **US-06:** As an Android user, I want the app to summarize daily screen time and digital device usage via `UsageStatsManager` so I can understand my sedentary screen patterns.
- **US-07:** As a user, I want to log optional subjective check-ins (1-5 mood rating, perceived stress score, daily nutritional quality indicators such as fruit/vegetable intake) so that lifestyle context is captured.

### Epic 3: Trend Analysis, Anomaly Detection & Data Quality
- **US-08:** As a user, I want the system to compute my rolling 14-day and 30-day baselines (sleep regularity, resting heart rate, activity levels) so I can see if I am improving or declining relative to myself.
- **US-09:** As a user, I want the platform to flag unusual deviations (e.g., 3 consecutive days of 40% reduced sleep combined with doubled screen time) without causing alarm.
- **US-10:** As a user, I want the platform to clearly display missing data indicators and tell me which missing measurements would improve the precision of my risk assessment.

### Epic 4: Disease-Specific Risk Assessment & Explainability
- **US-11:** As a user, I want to receive a validated Type 2 Diabetes risk assessment that calculates my risk category (Low, Increased, Moderate, High) based on clinical and demographic indicators.
- **US-12:** As a user, I want an explainable breakdown showing which factors contributed positively or negatively to my risk (e.g., "Age (+2 pts), BMI $\ge 27$ (+1 pt), High Physical Activity (-1 pt)").
- **US-13:** As a user, I want clear disclosure of model uncertainty, training population characteristics (e.g., CDC BRFSS public health survey cohort), and explicit clinical limitations.

### Epic 5: Actionable Recommendations & Goal Tracking
- **US-14:** As a user, I want to receive 2-3 personalized, realistic preventive goals (e.g., "Add a 15-minute brisk walk post-lunch", "Set a screen-time wind-down 45 minutes before sleep") tailored to my specific lifestyle gaps.
- **US-15:** As a user, I want periodic check-ins and push/in-app reminders to monitor progress towards my active wellness goals.

### Epic 6: Visualizations, Reports & Data Governance
- **US-16:** As a user, I want to view interactive longitudinal charts of my metrics across 7-day, 30-day, and 90-day timeframes on both Android and Web.
- **US-17:** As a user, I want to generate and download a comprehensive PDF/JSON health summary report that I can take to my primary care doctor.
- **US-18:** As a user, I want to be able to export all my raw data in standard JSON/CSV format and invoke "Right to be Forgotten" account deletion, which securely purges all my personal health records and audit traces.

---

## 5. Functional Requirements (FR)

| Req ID | Module / Domain | Description & Specification | Priority | Release Scope |
|---|---|---|---|---|
| **FR-01** | Identity & Auth | Secure user registration, authentication (JWT with bcrypt/Argon2), password reset, and session management. | P0 | MVP (Phase 1) |
| **FR-02** | Consent Engine | Granular, versioned consent records capturing explicit opt-in for telemetry, clinical data, screen time, and research analytics. Ability to revoke consent per domain at any time. | P0 | MVP (Phase 1) |
| **FR-03** | Clinical History Profile | Storage and retrieval of static/slow-moving demographic & clinical traits: age, biological sex, race/ethnicity (optional), family history of diabetes/CVD, personal history of hypertension/gestational diabetes. | P0 | MVP (Phase 1) |
| **FR-04** | Clinical Measurements | Ingestion and longitudinal logging of point-in-time clinical observations: Systolic/Diastolic BP (mmHg), Fasting Blood Glucose (mg/dL or mmol/L), HbA1c (%), Body Weight (kg), Height (cm), BMI ($kg/m^2$). Full unit conversion support. | P0 | MVP (Phase 1) |
| **FR-05** | Fitness & Activity | Daily and intra-day physical activity: total step count, active minutes, estimated active calories, distance (meters). Ingestion via manual entry or Android Health Connect sync. | P0 | MVP (Phase 1) |
| **FR-06** | Sleep Monitoring | Sleep session logs: bedtime, wake time, total sleep duration (minutes), deep/REM/light sleep stages (if provided by device), subjective sleep quality rating (1-5). | P0 | MVP (Phase 1) |
| **FR-07** | Screen Time & Usage | Passive ingestion of total screen-on time (minutes/day), unlock count, and top 3 application categories via Android `UsageStatsManager`. Manual entry fallback for web clients. | P1 | Phase 2 |
| **FR-08** | Nutrition & Mood Check-Ins | Subjective daily logging: perceived stress scale (1-5), mood rating (1-5), fruit/vegetable servings, sugary beverage count, water intake (L). | P1 | Phase 2 |
| **FR-09** | Health Connect Adapter | Android-side bidirectional sync adapter for Google Health Connect with robust runtime permission management, status checking, and conflict resolution. | P0 | MVP (Phase 1) |
| **FR-10** | Personal Baseline Engine | Algorithm computing user rolling baseline statistics: 7-day, 14-day, and 30-day Exponentially Weighted Moving Averages (EWMA) and Standard Deviations for steps, sleep, resting heart rate, and BP. | P0 | MVP (Phase 1) |
| **FR-11** | Data Quality & Validation | Automated validation pipeline: physiological boundary checks (e.g., rejecting BP $>300$ or $<40$), duplicate detection, timestamp sanity checks, and missing-data flags. | P0 | MVP (Phase 1) |
| **FR-12** | Disease Risk Engine (T2D) | Validated screening module for Type 2 Diabetes risk utilizing dual approaches: (1) Rule-based validated ADA/FINDRISC scoring engine; (2) Calibrated scikit-learn tabular machine learning model (Logistic Regression baseline & Gradient Boosting) trained on CDC BRFSS. | P0 | MVP (Phase 1) |
| **FR-13** | Explainability Service | Model-agnostic and feature-attribution explainability producing human-readable risk contributor rankings and percentage influence without medical jargon. | P0 | MVP (Phase 1) |
| **FR-14** | Preventive Recommendations | Rule-driven and profile-aware recommendation engine generating evidence-informed lifestyle targets (WHO physical activity guidelines, ADA nutrition/weight targets, sleep hygiene protocols). | P0 | MVP (Phase 1) |
| **FR-15** | Reminders & Tracking | Scheduled push notifications (Android) and in-app alerts prompting missing data entry, active goal check-ins, and weekly progress reviews. | P1 | Phase 2 |
| **FR-16** | Timelines, Charts & Export | Interactive web and mobile dashboards showing longitudinal trend lines, metric overlays (e.g. sleep vs. screen time), PDF report generation, and full GDPR/CCPA data export/deletion. | P0 | MVP (Phase 1) |
| **FR-17** | CVD & Metabolic Extensibility | Architectural hooks and abstraction interfaces for Phase 3 expansion into 10-year ASCVD risk (AHA/ACC pooled cohort) and metabolic syndrome clustering. | P2 | Phase 3 (Deferred) |

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Security & Data Isolation (SEC)
- **SEC-01 (Authentication):** Stateless JWT authentication with short-lived access tokens (15-60 min) and cryptographically secure refresh tokens stored in HTTP-only, SameSite cookies (web) or EncryptedSharedPreferences (Android).
- **SEC-02 (User Isolation):** All database queries for health records **must** explicitly filter by authenticated `user_id` at the repository/ORM layer. Multi-tenant bleeding is strictly prohibited.
- **SEC-03 (Encryption in Transit):** Strict TLS 1.3 encryption for all client-server communications.
- **SEC-04 (Encryption at Rest):** AES-256 encryption for database volumes and sensitive columns (PII, credentials).
- **SEC-05 (Audit Logging):** Immutable audit log recording all reads, writes, exports, and deletions of sensitive health data, capturing `user_id`, `timestamp`, `action`, `resource`, `ip_hash`, and `user_agent`.

### 6.2 Performance & Scalability (PERF)
- **PERF-01 (API Latency):** 95th percentile latency for ingestion endpoints $< 150$ ms; for dashboard summary queries $< 300$ ms.
- **PERF-02 (ML Inference):** Risk assessment inference time $< 50$ ms per single-user evaluation.
- **PERF-03 (Payload Footprint):** Health Connect sync batches compressed and paginated (max 100 records per HTTP batch).

### 6.3 Reliability & Offline Resilience (REL)
- **REL-01 (Android Offline Ingestion):** Android client caches sensor records and manual logs locally in SQLite (Room) when offline, syncing automatically upon network restoration.
- **REL-02 (Graceful Degradation):** If external device sync or Health Connect is unavailable or denied, the UI seamlessly transitions to manual entry mode without crashes or blocking alerts.

### 6.4 Usability & Accessibility (UX)
- **UX-01 (Accessibility):** Mobile and web interfaces comply with WCAG 2.1 Level AA (minimum contrast ratios, screen reader labels, keyboard navigation).
- **UX-02 (Cognitive Load):** Risk scores must never be presented as alarmist red exclamation marks or punitive score drops. Data visualizations must emphasize progress, consistency, and contextual explanation.

---

## 7. Out-of-Scope & Exclusions

To prevent mission creep and safeguard clinical validity, the following capabilities are **explicitly out of scope**:
1. **Clinical Diagnosis:** The platform will not provide diagnostic declarations (e.g., "You have Type 2 Diabetes").
2. **Medication Prescription & Dosage Alteration:** No advice regarding starting, stopping, or altering insulin, metformin, antihypertensives, or any prescription drug.
3. **Emergency Care Dispatch:** The platform is not an acute emergency monitor. It does not interface with 911 or dispatch emergency services.
4. **Single-Metric Disease Inference:** The system will never deduce chronic pathology from raw step counts, smart watch accelerometer data, screen time, or mood logs alone.
5. **Real-Time Continuous Waveform Telemetry:** High-frequency raw ECG, PPG, or continuous EEG streaming is deferred to future specialized clinical phases.

---

## 8. Acceptance Criteria Matrix

| Feature Area | Acceptance Criteria |
|---|---|
| **Consent & Registration** | User can register, verify email format, accept or decline optional data tracking permissions individually, and see current consent status in Settings. |
| **Clinical Measurement Entry** | User enters Systolic/Diastolic BP (e.g., 120/80 mmHg). The system validates values against human limits ($40 \le SBP \le 300$, $30 \le DBP \le 200$), converts units if needed, and renders in history timeline. |
| **Health Connect Integration** | On supported Android devices, requesting permissions displays standard Android Health Connect modal; granted permissions pull past 7 days of step and sleep data; denied permissions fall back gracefully to manual input. |
| **Diabetes Risk Engine** | Providing Age, Sex, BMI, Family History, Hypertension status, and Physical Activity status yields a deterministic validated score (ADA) and calibrated ML model probability with top 3 contributing factors and clinical disclaimer. |
| **Personal Baseline Calculation** | After 7 days of step logs, system displays rolling 7-day average and flags deviation if step count drops $> 2.5$ standard deviations below baseline for 3 consecutive days. |
| **Data Export & Deletion** | Clicking "Export Data" produces a ZIP containing machine-readable JSON and CSV files of all logged metrics. Clicking "Delete My Account" permanently deletes user identity, measurements, and logs from the primary DB within 5 seconds. |

---

## 9. Incremental Delivery Phases

- **Phase 1 (MVP — First Usable Version):**
  - Core Auth, Granular Consent, Profile & Clinical History.
  - Manual entry for Measurements, Activity, Sleep.
  - Android Health Connect sync adapter (Steps & Sleep).
  - Validated Type 2 Diabetes Risk Module (ADA Survey Engine + CDC BRFSS ML Baseline).
  - Personal Baseline Engine (EWMA 7d/14d).
  - Web & Android Dashboards with basic trend charts, explainability, and PDF/JSON export.
- **Phase 2 (Expanded Telemetry & Engagement):**
  - Android Screen Time ingestion (`UsageStatsManager`) & digital wellness correlations.
  - Nutrition & Mood subjective check-ins.
  - Automated anomaly notification & weekly progress reminders.
  - Expanded explainability visualizations (waterfall feature attribution).
- **Phase 3 (Long-Term Clinical Extension):**
  - Cardiovascular Risk Module (AHA/ACC 10-year ASCVD).
  - Blood Pressure phenotype clustering and circadian dipping analysis.
  - Advanced multi-modal risk synthesis and clinician-facing portal.
