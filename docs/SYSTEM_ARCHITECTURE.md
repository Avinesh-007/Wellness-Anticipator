# Wellness Anticipator — System Architecture Document

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Principal Software Architect & Multi-Platform Engineering Lead  

---

## 1. Architectural Philosophy & Strategy

The Wellness Anticipator system is designed around five core engineering principles:

1. **Modular Monolith over Premature Microservices:** For a hackathon and early production prototype, distributed microservices introduce operational overhead, distributed transaction failures, network latency, and deployment complexity. We employ a strictly decoupled, modular monolith in FastAPI with isolated domain modules (Auth, Clinical Profile, Telemetry Ingestion, Trend Analysis, Risk Engines, and Audit).
2. **Contract-Driven Cross-Platform Parity:** Both the native Android application (Kotlin) and the Web dashboard (React/TypeScript) consume the exact same versioned RESTful JSON API (`/api/v1/`). Data schemas are maintained in canonical Pydantic models with exported OpenAPI 3.1 specifications.
3. **Clinical Inference & Pipeline Isolation:** Model training and dataset processing exist in a dedicated ML workspace (`/ml`), isolated from production web server dependencies. Serialized model artifacts (`.joblib`, pipeline preprocessors, and metadata manifests) are loaded at server startup into read-only, in-memory inference runtimes.
4. **Sensor Heterogeneity & Graceful Fallback:** Wearables and mobile operating systems have erratic data availability. The system treats native sensor inputs (Health Connect, UsageStats) as progressive enhancements: if permissions are revoked, hardware is absent, or device APIs fail, the architecture smoothly shifts to validated manual entry forms without breaking client state.
5. **Zero-Trust User Data Isolation:** Every telemetry record, measurement, and assessment is strictly scoped by tenant `user_id` enforced at the database repository boundary, backed by immutable audit trails.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        AndroidApp["Native Android App (Kotlin / Compose)\n- Health Connect API\n- UsageStatsManager\n- Local Room Cache (Offline)"]
        WebDashboard["React Web Dashboard (TS / Vite / Tailwind)\n- Recharts Visualizations\n- Manual Ingestion Forms\n- PDF/JSON Report Export"]
    end

    subgraph Gateway ["Network & Security Layer"]
        ReverseProxy["Reverse Proxy / TLS 1.3 Termination\n(Nginx or Caddy)"]
        AuthMiddleware["FastAPI Security & Auth Middleware\n- JWT Bearer Validation\n- Rate Limiting & CORS\n- Granular Consent Interceptor"]
    end

    subgraph BackendMonolith ["FastAPI Modular Application"]
        subgraph APIRouters ["API Routers (/api/v1)"]
            R_Auth["/auth & /users"]
            R_Health["/measurements & /activities\n/sleep & /screen-time"]
            R_Assess["/assessments & /recommendations"]
            R_Trends["/trends & /anomalies"]
            R_Export["/reports & /export & /audit"]
        end

        subgraph CoreServices ["Domain Business Services"]
            S_Trend["Personal Trend & Baseline Engine\n(Rolling EWMA, Z-Score)"]
            S_Risk["Disease Risk Assessment Service\n(ADA Rules + BRFSS ML Pipeline)"]
            S_Anomaly["Anomaly & Escalation Detector\n(Statistical deviations & Safety limits)"]
            S_Rec["Recommendation Engine\n(Evidence-based rules & Goal tracker)"]
            S_Audit["Audit & Consent Enforcement Engine"]
        end

        subgraph MLRuntime ["ML Inference Runtime"]
            ModelRegistry["Model Artifact Registry & Version Manager"]
            T2D_Model["Calibrated T2D Pipeline (Joblib)\n(Preprocessor + Imputer + GBT/LR)"]
            Explainer["Explainability Engine\n(SHAP / Model-Agnostic Attributions)"]
        end
    end

    subgraph DataStorage ["Data & Storage Layer"]
        SQL_DB[("Relational Database\n- SQLite (Dev/Test)\n- PostgreSQL 16 (Prod)\n(SQLAlchemy 2.0 Async ORM)")]
        LocalFiles["Secure Artifact Storage\n(Generated PDF Reports, Export Archives)"]
    end

    %% Client to Gateway
    AndroidApp -->|REST / HTTPS / JSON| ReverseProxy
    WebDashboard -->|REST / HTTPS / JSON| ReverseProxy
    ReverseProxy --> AuthMiddleware
    AuthMiddleware --> APIRouters

    %% Routers to Services
    R_Auth --> S_Audit
    R_Health --> S_Trend
    R_Health --> S_Anomaly
    R_Assess --> S_Risk
    R_Assess --> S_Rec
    R_Trends --> S_Trend
    R_Export --> S_Audit

    %% Services Interconnections
    S_Risk --> MLRuntime
    MLRuntime --> T2D_Model
    MLRuntime --> Explainer
    S_Anomaly --> S_Rec

    %% Services to Data Layer
    S_Trend --> SQL_DB
    S_Risk --> SQL_DB
    S_Anomaly --> SQL_DB
    S_Rec --> SQL_DB
    S_Audit --> SQL_DB
    R_Export --> LocalFiles
```

---

## 3. Subsystem Breakdown & Responsibilities

### 3.1 Android Mobile Application (Kotlin)
- **Architecture:** Modern Android MVVM / MVI architecture utilizing Jetpack Compose, Kotlin Coroutines, StateFlow, and Jetpack Navigation.
- **Health Connect Integration:** Communicates with the `androidx.health.connect.client.HealthConnectClient`. Handles runtime availability checks (`HealthConnectClient.getSdkStatus`), permission requests for `StepsRecord`, `TotalCaloriesBurnedRecord`, and `SleepSessionRecord`, and differential synchronization.
- **Screen Time Aggregator:** Interacts with `android.app.usage.UsageStatsManager` subject to user-granted `PACKAGE_USAGE_STATS`. Summarizes daily screen minutes, screen unlock frequency, and category breakdowns without harvesting application-specific sensitive metadata.
- **Offline Resilience:** Employs an offline-first Room database for buffering telemetry. If network is lost, pending records remain safely staged and sync automatically when connectivity resumes.
- **Security:** Secure storage of JWT tokens inside `EncryptedSharedPreferences` backed by the Android Keystore system.

### 3.2 React Web Dashboard (TypeScript & Vite)
- **Architecture:** Single-Page Application (SPA) built with React 18/19, TypeScript, Vite, and TailwindCSS for modern, accessible UI components.
- **Data Visualization:** Employs Recharts and custom SVG components for multi-metric overlays (e.g., dual-axis sleep duration vs. sedentary screen time; blood pressure trend bands with target ranges).
- **Manual Data Entry:** Highly responsive, accessible forms with client-side validation for users without wearable devices, including blood pressure, fasting blood glucose, sleep journals, and lifestyle check-ins.
- **Export & Reports:** Client-side preview and triggering of standardized health reports (PDF rendering via headless backend templates or browser print styles; complete JSON/CSV export archives).

### 3.3 Python FastAPI Backend
- **Framework:** FastAPI utilizing asynchronous ASGI (Uvicorn), Pydantic v2 for data validation, and SQLAlchemy 2.0 ORM.
- **Routing & Controllers:** Structured domain routers under `/api/v1/` ensuring strict separation of concerns.
- **Database Abstraction:** Database access is abstracted via the Repository Pattern. The system natively supports SQLite for rapid zero-dependency local development and CI testing, and connects seamlessly to PostgreSQL for production deployments via asyncpg.
- **Background Tasks:** Non-blocking asynchronous calculation of baseline rollups, audit log archiving, and export generation using FastAPI background tasks.

### 3.4 AI/ML & Personal Baseline Engines
- **Personal Baseline Engine (Pure Math/Stat):**
  - Maintains rolling 7-day, 14-day, and 30-day baseline statistics for each metric.
  - Implements Exponentially Weighted Moving Averages (EWMA) to discount older records while responding to meaningful lifestyle shifts:
    $$EWMA_t = \alpha \cdot X_t + (1 - \alpha) \cdot EWMA_{t-1}$$
  - Computes dynamic user Z-scores ($Z = \frac{x - \mu}{\sigma}$) to detect personal deviations without using rigid universal cutoffs.
- **Disease-Risk Assessment Service (Hybrid Clinical/ML):**
  - **Deterministic Clinical Screener:** Implements the validated American Diabetes Association (ADA) 7-question Risk Score and FINDRISC screening calculator as deterministic, verified scoring baselines.
  - **Calibrated ML Model:** Pre-trained, calibrated tabular model (Logistic Regression baseline + LightGBM / Gradient Boosting) trained on verified CDC BRFSS public health survey data.
  - **Explainability Layer:** Calculates exact local feature attributions (via TreeExplainer/KernelExplainer or linear coefficients), converting raw model outputs into transparent, categorized risk factors (e.g., BMI contribution, physical activity protective effect).
- **Clinical Safety & Anomaly Detection:**
  - Evaluates every measurement against physiological bounds.
  - Immediately triggers escalation flags for critical clinical readings (e.g., Systolic BP $> 180$ or Diastolic BP $> 120$ mmHg) and displays prominent healthcare provider consultation instructions.

---

## 4. End-to-End Data Flows

### 4.1 Ingestion & Baseline Processing Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Mobile Client
    participant API as FastAPI Gateway (/api/v1)
    participant Auth as Auth & Consent Interceptor
    participant DB as Relational Database
    participant Trend as Baseline & Anomaly Engine
    participant Audit as Audit Logger

    User->>API: POST /api/v1/measurements/ (e.g., BP or Glucose)
    API->>Auth: Validate JWT & Verify Consent ("clinical_measurements")
    alt Consent Denied or Token Invalid
        Auth-->>User: 403 Forbidden / 401 Unauthorized
    else Consent Granted
        Auth->>API: Proceed with User Context (user_id=101)
        API->>DB: Validate Schema & Insert Measurement Record
        DB-->>API: Record Persisted (ID=8042)
        API->>Trend: Trigger Async Baseline & Anomaly Check (user_id=101)
        activate Trend
        Trend->>DB: Fetch 30-day Window for Metric
        Trend->>Trend: Recompute Rolling EWMA & Standard Deviation
        Trend->>Trend: Evaluate Anomaly Thresholds & Safety Limits
        Trend->>DB: Store Updated Baseline & Any Generated Anomalies
        deactivate Trend
        API->>Audit: Log Append (Action="INGEST", Resource="measurements", ID=8042)
        Audit->>DB: Insert Audit Log Entry
        API-->>User: 201 Created (Data & Baseline Summary)
    end
```

### 4.2 Risk Assessment Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Web or Android)
    participant API as FastAPI (/api/v1/assessments)
    participant RiskSvc as Risk Assessment Service
    participant Registry as Model Version Registry
    participant ML as ML Inference Engine (T2D Model)
    participant Explain as Explainability Engine
    participant DB as Relational Database

    User->>API: POST /api/v1/assessments/diabetes (Optional overrides)
    API->>RiskSvc: Run Assessment Request (user_id=101)
    RiskSvc->>DB: Fetch Clinical Profile, Demographics, & Recent Activity
    DB-->>RiskSvc: User Clinical Feature Vector
    RiskSvc->>RiskSvc: Validate Mandatory Inputs (Age, BMI, Family History, BP History)
    alt Missing Mandatory Clinical Input
        RiskSvc-->>User: 422 Unprocessable Entity (Detail: "Missing clinical feature: BMI")
    else All Inputs Valid
        RiskSvc->>Registry: Load Active Model Pipeline (e.g., v1.0.0-brfss-gbt)
        Registry-->>RiskSvc: Serialized Pipeline & Metadata
        RiskSvc->>ML: Predict Probability & Risk Tier (Vector)
        ML-->>RiskSvc: Raw Probability (e.g., 0.38) -> Tier: "Moderate Risk"
        RiskSvc->>Explain: Generate Local Feature Attributions (Vector)
        Explain-->>RiskSvc: Top Attributions (BMI: +18%, Age: +12%, Active: -8%)
        RiskSvc->>DB: Save Assessment Record (Inputs, Outputs, Attributions, Model Version)
        DB-->>RiskSvc: Assessment Saved (ID=501)
        RiskSvc-->>API: Complete Explainable Risk Payload
        API-->>User: 200 OK (Score, Tier, Contributing Factors, Limitations, Escalations)
    end
```

---

## 5. Mobile Data Synchronization & Graceful Degradation Flow

The Android application operates on a layered capability model:

```mermaid
flowchart TD
    StartSync(["App Launch or Background Sync Trigger"]) --> CheckSDK{"Health Connect Available\non Device?"}
    
    CheckSDK -- Yes --> CheckPerms{"User Granted\nHealth Connect\nPermissions?"}
    CheckSDK -- No / Unsupported --> ManualMode["Activate Manual Entry Mode\n(Prompt user for manual steps/sleep/BP)"]
    
    CheckPerms -- Granted --> QueryHC["Query Health Connect Records\n(Steps, Sleep, Active Calories)\nSince Last Sync Token"]
    CheckPerms -- Denied --> PromptPerm["Display Non-Intrusive Permission Banner\nFallback to Manual Logging"]
    
    QueryHC --> CheckStats{"Usage Access Granted\nfor Screen Time?"}
    CheckStats -- Granted --> QueryUsage["Aggregate Daily Screen Minutes\nvia UsageStatsManager"]
    CheckStats -- Denied --> SkipUsage["Omit Screen Time or Prompt Manual Log"]
    
    QueryUsage --> AssembleBatch["Assemble Ingestion Payload\n(Add Provenance: DEVICE_HEALTH_CONNECT)"]
    SkipUsage --> AssembleBatch
    
    AssembleBatch --> CheckNetwork{"Network Online?"}
    CheckNetwork -- Yes --> SendAPI["POST /api/v1/sync/batch\nto FastAPI Backend"]
    CheckNetwork -- No --> CacheRoom["Stage in Local Room SQLite Database\nMark status: PENDING_SYNC"]
    
    SendAPI --> SyncSuccess["Update Sync Anchor Token\nClear Staged Room Queue"]
```

---

## 6. Repository Layout & Workspace Structure

```
Wellness Anticipator/
├── .gitignore
├── README.md
├── docker-compose.yml
├── docs/                               # Phase 0 Architecture & Specs
│   ├── PROJECT_REQUIREMENTS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPECIFICATION.md
│   ├── AI_ML_STRATEGY.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── SECURITY_AND_PRIVACY.md
│   ├── TESTING_STRATEGY.md
│   ├── DECISIONS_AND_ASSUMPTIONS.md
│   └── REQUIREMENTS_TRACEABILITY.md
├── contracts/                          # Shared API & Data Schemas
│   ├── openapi.json
│   └── schemas/
│       ├── health_data.json
│       └── risk_assessment.json
├── backend/                            # Python FastAPI Modular Monolith
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   ├── measurements.py
│   │   │   │   │   ├── activities.py
│   │   │   │   │   ├── sleep.py
│   │   │   │   │   ├── screen_time.py
│   │   │   │   │   ├── checkins.py
│   │   │   │   │   ├── assessments.py
│   │   │   │   │   ├── recommendations.py
│   │   │   │   │   ├── reports.py
│   │   │   │   │   └── audit_export.py
│   │   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/                     # SQLAlchemy 2.0 ORM Entities
│   │   ├── schemas/                    # Pydantic v2 Request/Response Schemas
│   │   ├── services/                   # Business & ML Logic
│   │   │   ├── trend_engine.py
│   │   │   ├── anomaly_service.py
│   │   │   ├── risk_service.py
│   │   │   └── recommendation_service.py
│   │   └── main.py
│   ├── alembic/                        # DB Migration Scripts
│   ├── tests/                          # Backend Unit & Integration Tests
│   ├── requirements.txt
│   └── Dockerfile
├── ml/                                 # Dedicated ML & Research Pipeline
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── dataset_inventory.md
│   ├── pipelines/
│   │   ├── data_validation.py
│   │   ├── preprocessing.py
│   │   ├── train_diabetes_baseline.py
│   │   ├── train_diabetes_gbt.py
│   │   └── evaluate_model.py
│   ├── models/                         # Serialized Artifacts & Registries
│   │   ├── registry.json
│   │   └── serialized/
│   ├── tests/
│   └── requirements.txt
├── web/                                # React / TypeScript / Vite Dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/                   # Axios API Clients
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── android/                            # Native Kotlin Android Application
    ├── app/
    │   ├── src/
    │   │   ├── main/
    │   │   │   ├── java/com/wellness/anticipator/
    │   │   │   │   ├── data/           # Health Connect, Room, Network
    │   │   │   │   ├── domain/         # Repositories & Use Cases
    │   │   │   │   └── ui/             # Jetpack Compose Screens & ViewModels
    │   │   │   └── AndroidManifest.xml
    │   └── build.gradle.kts
    ├── build.gradle.kts
    └── settings.gradle.kts
```

---

## 7. Operational & Technical Risk Mitigations

| Risk | Impact | Architectural Mitigation |
|---|---|---|
| **Health Connect Unavailable or Permissions Denied** | High (Missing device telemetry) | Abstracted `HealthDataProvider` interface with automatic graceful fallback to clean, accessible manual entry dialogs. |
| **Model Hallucination or Inappropriate Diagnosis** | Critical (Clinical / Ethical) | Absolute architectural wall: models output risk percentages with disclaimers; diagnostic text is prohibited; high-risk readings trigger standard provider escalation notices. |
| **Data Bleeding Across User Accounts** | Critical (Privacy / Security) | Strict tenant-scoping enforced via ORM query filters wrapped in repository classes; automated multi-tenant isolation unit tests in CI. |
| **Drift Between Web and Android API Payloads** | High (Broken Client Integration) | Single source of truth OpenAPI JSON exported from FastAPI Pydantic models; automated schema validation tests run against mock payloads for both clients. |
