# Wellness Anticipator — Security, Privacy & Compliance Architecture

**Document Version:** 1.0.0  
**Phase:** Phase 0 (Planning & Architecture)  
**Status:** Approved for Baseline Design  
**Author:** Chief Information Security Officer (CISO) & Data Privacy Counsel  

---

## 1. Privacy-by-Design (PbD) Framework

Healthcare applications handle highly sensitive personal information. Wellness Anticipator integrates privacy and security into the foundation of its architecture rather than treating it as an afterthought. Our implementation adheres strictly to the **7 Foundational Principles of Privacy by Design**:

1. **Proactive not Reactive; Preventative not Remedial:** Default configurations protect user privacy; no sensitive data is transmitted or shared without active, affirmative consent.
2. **Privacy as the Default Setting:** Screen-time analytics and telemetry tracking are strictly opt-in. An unconfigured account defaults to minimal manual data entry with zero passive device harvesting.
3. **Privacy Embedded into Design:** Architectural boundaries physically isolate telemetry ingestion, ML model inference, and audit logging.
4. **Full Functionality (Positive-Sum, not Zero-Sum):** Users who deny Health Connect or Screen Time permissions retain full access to manual logging, baseline tracking, and clinical risk calculators.
5. **End-to-End Security (Full Lifecycle Protection):** Data is encrypted in transit, at rest, and completely purged upon account deletion.
6. **Visibility and Transparency:** Users can view the exact inputs used by AI models, read why each feature influenced their score, and review their data access audit history.
7. **Respect for User Privacy (User-Centric):** Full support for GDPR / CCPA rights: Data Access, Data Portability, and the Right to be Forgotten.

---

## 2. Granular Consent Engine & Data Sovereignty

Consent is not a monolithic terms-of-service checkbox. In Wellness Anticipator, consent is managed as a granular, versioned database record (`consent_records`):

```
+-----------------------------------------------------------------------------------------+
|                               GRANULAR CONSENT DOMAINS                                  |
+-----------------------------------------------------------------------------------------+
| 1. CLINICAL_MEASUREMENTS                                                                |
|    Authorizes storage of Blood Pressure, Blood Glucose, HbA1c, and Lab Results.        |
|    Required for: Clinical Risk Calculators (ADA, ASCVD).                                |
+-----------------------------------------------------------------------------------------+
| 2. DEVICE_TELEMETRY                                                                     |
|    Authorizes background sync from Android Health Connect (Steps, Sleep, Calories).     |
|    Required for: Passive personal baseline trends.                                      |
+-----------------------------------------------------------------------------------------+
| 3. USAGE_STATS                                                                          |
|    Authorizes Android UsageStatsManager access for screen time & category summaries.    |
|    Required for: Digital wellness & sedentary screen correlation.                       |
+-----------------------------------------------------------------------------------------+
| 4. RESEARCH_ANALYTICS                                                                   |
|    Authorizes inclusion of fully de-identified, k-anonymized data for model refinement. |
|    Default: Opt-Out.                                                                    |
+-----------------------------------------------------------------------------------------+
```

### 2.1 Consent Interceptor Middleware
FastAPI incorporates a dedicated `ConsentInterceptor` dependency on all data ingestion endpoints:
- Ingestion of blood pressure checks `has_consent(user_id, "CLINICAL_MEASUREMENTS")`.
- Health Connect sync batches check `has_consent(user_id, "DEVICE_TELEMETRY")`.
- If consent has been revoked, the API immediately returns `403 Forbidden` with error code `CONSENT_REQUIRED_OR_REVOKED`, halting data ingestion without affecting other modules.

---

## 3. Authentication, Authorization & Tenant Isolation

### 3.1 Authentication Architecture
- **Credential Storage:** User passwords are never stored in plaintext. They are hashed using **Argon2id** (memory cost $65,536$ KiB, time cost 3 iterations, parallelism 4) with unique per-user 16-byte cryptographically secure salts.
- **Session Tokens:** Stateless RFC 7519 JSON Web Tokens (JWT) signed with HMAC-SHA256 (or asymmetric RS256 in production).
  - `access_token`: Short lifespan (15 minutes). Transmitted via HTTP `Authorization: Bearer <token>` header.
  - `refresh_token`: 7-day lifespan with automatic token rotation. Web client stores refresh tokens in `HttpOnly`, `SameSite=Strict`, `Secure` cookies. Android client stores tokens inside `EncryptedSharedPreferences` backed by the hardware-level **Android Keystore System**.

### 3.2 Strict Multi-Tenant Data Isolation
To prevent cross-tenant data leaks (the most severe vulnerability in SaaS health applications):
- The application enforces the **Scoped Repository Pattern**: all database queries through SQLAlchemy repositories **must** include `WHERE user_id = :current_user_id`.
- Foreign key cascading deletes (`ON DELETE CASCADE`) ensure that deleting a user guarantees immediate removal of all associated measurements, activities, sleep logs, and assessments.
- Automated integration tests verify that User A cannot read, modify, or infer the existence of User B's records under any circumstance.

---

## 4. Data Minimization & Privacy Protection

To prevent unnecessary surveillance:
1. **Screen Time Sanitization:** The Android `UsageStatsManager` service aggregates daily minutes by general category (e.g., `"SOCIAL"`, `"PRODUCTIVITY"`, `"ENTERTAINMENT"`). The app **never** records application titles, window contents, keystrokes, URLs, or notification texts.
2. **IP Address Minimization in Audits:** Raw client IP addresses are immediately hashed with a daily rotating salt:
   $$IP\_Hash = \text{SHA-256}(\text{Client\_IP} \mathbin{\Vert} \text{Daily\_Salt})$$
   This satisfies regulatory requirements to detect brute-force attacks while preventing permanent longitudinal IP tracking of users.
3. **No Third-Party Analytics Trackers:** No third-party behavioral analytics SDKs (e.g., Google Analytics, Meta Pixel, Firebase Analytics) are embedded in either the web or Android client. All telemetry is first-party.

---

## 5. Encryption & Secrets Management

| State | Security Mechanism | Standard / Specification |
|---|---|---|
| **In Transit** | TLS 1.3 / Strict HTTPS | TLS 1.3 with strong cipher suites (`TLS_AES_256_GCM_SHA384`), mandatory HSTS (`max-age=31536000; includeSubDomains`). |
| **At Rest (Server)** | Database Volume Encryption | LUKS-encrypted partitions for on-premise deployments or AWS/GCP AES-256 encrypted managed storage. |
| **At Rest (Android)** | Keystore & Room Encryption | Local SQLite caching uses SQLCipher or EncryptedSharedPreferences with keys stored in the Android Hardware Security Module (HSM). |
| **Secrets Management** | Environment Variables & Vault | Zero hardcoded credentials. All JWT secrets, DB connection URIs, and encryption keys loaded from `.env` via `pydantic-settings` with strict `.env.example` templates. |

---

## 6. Audit Logging & Regulatory Compliance

### 6.1 Immutable Audit Log Specifications
Every access or state change involving health information generates an immutable record in `audit_logs`:
- `timestamp`: UTC microsecond timestamp.
- `user_id`: Subject UUID (or NULL if unauthenticated attempt).
- `action`: `CREATE`, `READ`, `UPDATE`, `DELETE`, `ASSESSMENT_RUN`, `EXPORT_DATA`.
- `resource_type`: `measurements`, `risk_assessments`, `clinical_profile`.
- `resource_id`: Identifier of the accessed record.
- `ip_hash`: One-way hashed IP address.
- `user_agent`: Client browser / mobile OS identifier.

> **CRITICAL PHI PROTECTION RULE:** Audit log `details` JSON payloads **must never** store raw clinical values (e.g., blood glucose levels or blood pressure values). They store only metadata (e.g., `{"metric_type": "BLOOD_PRESSURE", "status": "SUCCESS"}`).

---

## 7. Data Portability, Retention & Right to be Forgotten

### 7.1 Data Portability Workflow (GDPR Article 20)
When a user requests a data export:
1. An authenticated `POST /api/v1/export/full` request is received.
2. An asynchronous background task queries all tables tied to `user_id`.
3. Datasets are formatted into human-readable CSVs (for Excel/clinician review) and standard JSON files (for machine interchange).
4. Files are zipped and delivered as a secure, signed temporary download link or immediate file response.
5. The export event is logged in `audit_logs`.

### 7.2 Right to be Forgotten / Account Purge Workflow (GDPR Article 17)
When a user requests permanent deletion:
1. The user must authenticate with their current password and confirm intent via `DELETE /api/v1/export/account`.
2. A single atomic database transaction deletes the root `users` entity.
3. Database foreign key constraints cascade deletions across:
   - `consent_records`
   - `clinical_profiles`
   - `measurements`
   - `activity_records`
   - `sleep_records`
   - `screen_time_records`
   - `nutrition_checkins`
   - `mood_stress_checkins`
   - `baseline_metrics`
   - `risk_assessments`
   - `preventive_goals`
4. The user's entry in `audit_logs` is anonymized (`user_id` set to NULL, `details` scrubbed).
5. All local device caches on Android (Room database) are purged via the Android client deletion handler.
6. The user is logged out and redirected to a clean landing page.
