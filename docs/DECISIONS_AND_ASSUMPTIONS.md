# Wellness Anticipator — Architecture Decisions & Assumptions (ADR)

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Lead Software Architect & Systems Engineering Team  

---

## 1. Architectural Decision Records (ADRs)

### ADR-01: Modular Monolith vs. Microservices Architecture
- **Context:** The system requires user auth, clinical profiles, telemetry ingestion, ML risk screening, personal baseline rollups, and audit logging.
- **Alternatives Considered:**
  1. Distributed Microservices (Auth service, Ingestion service, ML service, Reporting service).
  2. Modular Monolith in Python FastAPI.
- **Decision:** **Adopt a Modular Monolith in FastAPI.**
- **Rationale:** Microservices introduce distributed transactions, inter-service network latency, complex local setup (orchestrating multiple containers), and high operational fragility during a hackathon. A modular monolith enforces strict domain boundaries through code organization (routers, services, repositories) while running as a single, high-performance ASGI process with zero network hop latency between ingestion and inference.
- **Consequences:** Simple single-container deployment, shared database transactions, sub-millisecond in-process ML inference. Can easily be broken into independent microservices later if scaling demands it.

---

### ADR-02: Relational Database Strategy (SQLite -> PostgreSQL)
- **Context:** The platform requires structured relational entities, ACID compliance for audit trails, time-series querying, and rapid local setup.
- **Alternatives Considered:**
  1. Pure PostgreSQL requiring Docker or local server installation for every developer.
  2. Pure NoSQL (MongoDB / DynamoDB).
  3. Relational abstraction via SQLAlchemy 2.0 supporting SQLite (local dev/test) and PostgreSQL (staging/production).
- **Decision:** **Relational abstraction via SQLAlchemy 2.0 and Alembic, defaulting to SQLite locally with an automated PostgreSQL switch.**
- **Rationale:** SQLite allows zero-dependency local setup, instantaneous unit test execution (`sqlite:///:memory:`), and portability. By strictly avoiding dialect-specific SQL and using standard SQLAlchemy 2.0 types, the codebase switches to PostgreSQL simply by changing the `DATABASE_URL` environment variable.
- **Consequences:** Developers can run and test the complete system immediately without spinning up external database daemons.

---

### ADR-03: Selection of CDC BRFSS as Primary ML Dataset
- **Context:** We need a reputable, large, validated dataset for training a preventive Type 2 Diabetes screening model.
- **Alternatives Considered:**
  1. Pima Indians Diabetes Database ($N=768$, females only, severe demographic limitation).
  2. UCI Diabetes 130-US Hospitals (inpatient diabetic hospital encounters; irrelevant for general prevention).
  3. CDC BRFSS (Behavioral Risk Factor Surveillance System, $>400,000$ community adults annually).
  4. Pure synthetic data.
- **Decision:** **Select CDC BRFSS as the primary tabular training cohort; explicitly reject Pima Indians and synthetic data for clinical claims.**
- **Rationale:** BRFSS is the actual epidemiological surveillance foundation used by the CDC and ADA to calibrate population screening tools. It reflects the exact self-reported clinical and lifestyle questions captured by our application. Synthetic data is prohibited for clinical accuracy claims.
- **Consequences:** The model reflects adult population prevalence; limitations of self-reported survey data must be clearly documented.

---

### ADR-04: Android Sensor Integration & Graceful Fallback Pattern
- **Context:** Device sensors and operating system permissions are highly fragmented. Health Connect may be missing, denied, or partially populated.
- **Alternatives Considered:**
  1. Mandate wearable integration; block users without Health Connect.
  2. Build custom sensor listeners for every wearable manufacturer SDK (Fitbit, Garmin, Samsung).
  3. Standardize on Android Health Connect API as a progressive enhancement, with complete manual entry fallback.
- **Decision:** **Standardize on Android Health Connect API with strict manual entry fallback.**
- **Rationale:** Health Connect is Google's modern, unified health data layer for Android. Writing proprietary vendor SDKs is out of scope and fragile. Treating sensor sync as optional ensures that any user can use the platform via manual logs regardless of phone model or wearable ownership.
- **Consequences:** Complete accessibility across hardware tiers.

---

### ADR-05: Strict Boundary Between Disease Risk Screening and Telemetry
- **Context:** It is tempting in consumer tech to claim that smart watch steps or sleep stages "predict diabetes" or "detect hypertension".
- **Alternatives Considered:**
  1. Feed steps, sleep stages, and screen time directly into a black-box model to predict diabetes.
  2. Strictly isolate telemetry into *Personal Lifestyle Trends* and *Baseline Anomaly Detection*, while reserving *Disease Risk Screening* for validated clinical/demographic models.
- **Decision:** **Strict separation. Telemetry informs lifestyle habits and baselines; validated clinical factors determine disease screening.**
- **Rationale:** Clinical ethics and medical literature confirm that steps and screen time do not cause or prove diabetes etiology without metabolic/clinical inputs (age, genetics, BMI, glycemia, blood pressure). Conflating the two produces misleading "snake-oil" health scores.
- **Consequences:** Clinically defensible, ethical, and trustworthy product architecture.

---

## 2. Key Operational Assumptions

1. **Android Target Environment:** Target Android 14 (API 34) with backward compatibility to Android 9 (API 28). Health Connect is pre-installed on Android 14+ and available via Google Play Store on Android 9–13.
2. **Web Browser Environment:** Modern evergreen browsers (Chrome 110+, Firefox 115+, Safari 16+, Edge 110+) supporting ES2022 and modern CSS.
3. **User Input Capability:** Users are assumed to know or be able to measure basic biometrics (approximate height, weight, age) and family medical history. Blood pressure and blood glucose inputs are optional but recommended.
4. **Network Connectivity:** Web dashboard assumes persistent connectivity. Android application supports offline queuing for manual and sensor logs, syncing once network is restored.

---

## 3. Unresolved Decisions Requiring Stakeholder / User Review

The following questions are noted for user discussion before Phase 1 implementation:

| Decision ID | Question / Choice Point | Recommended Option | Alternative Options | Impact |
|---|---|---|---|---|
| **UD-01** | **Backend Deployment Target:** How should the backend be packaged for hackathon evaluation? | **(Recommended) Local Docker Compose + Mock Seed Runner:** Zero cloud cost, instantaneous evaluation, completely reproducible on any machine. | Cloud deployment (Render / Railway / AWS EC2). | Docker Compose requires only Docker installed on evaluator machine; cloud deployment requires hosting configuration. |
| **UD-02** | **CDC BRFSS Feature Set Breadth:** Should the initial Phase 1 ML model use a compact 8-feature survey vector or an expanded 18-feature vector? | **(Recommended) Compact 8-Feature Vector:** Matches the core ADA questions (Age, Sex, BMI, Physical Activity, High BP, High Cholesterol, Smoking, Gestational DB). | Expanded 18-feature vector (adds fruit/veg servings, alcohol frequency, income, education brackets). | Compact vector minimizes user friction during onboarding while retaining $\ge 0.80$ AUROC. |
| **UD-03** | **Android Testing Approach:** How should Android Health Connect sync be demonstrated if physical Android hardware is unavailable? | **(Recommended) Android Studio Emulator with Google's Health Connect Toolbox:** Generates realistic synthetic steps and sleep records directly inside Health Connect. | Physical Android device with active Google account. | Health Connect Toolbox is Google's official emulator testing tool, allowing deterministic scenario testing without a physical phone. |
