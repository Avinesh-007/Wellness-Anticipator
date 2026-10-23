# Dataset Inventory & Governance: CDC BRFSS

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-23  
**Status:** Pre-Training Audit Approved  
**Author:** Healthcare AI/ML Research Team  

---

## 1. Dataset Identification & Official Provenance

- **Dataset Title:** Behavioral Risk Factor Surveillance System (BRFSS)
- **Cohort Year Selected:** 2021 (with cross-reference to 2022).
- **Issuing Authority:** Centers for Disease Control and Prevention (CDC), Division of Population Health, National Center for Chronic Disease Prevention and Health Promotion.
- **Official URL:** [https://www.cdc.gov/brfss/annual_data/annual_2021.html](https://www.cdc.gov/brfss/annual_data/annual_2021.html)
- **License & Legal Permissibility:** Public Domain (U.S. Federal Government work under 17 U.S.C. § 105). Permitted for open research, educational, and commercial analytics without proprietary licensing restrictions.
- **Survey Design & Sampling Methodology:** Continuous, state-based, random-digit-dialed (RDD) telephone survey of non-institutionalized civilian adults aged 18 years and older residing in the United States and participating territories.

---

## 2. Intended Population & Sampling Characteristics

- **Total Sample Size (2021 Cohort):** 438,693 individual survey respondents across all 50 states, DC, Guam, and Puerto Rico.
- **Inclusion Criteria:** Non-institutionalized civilian U.S. residents $\ge 18$ years of age with a landline or cellular telephone.
- **Exclusion Criteria:** Institutionalized persons (nursing home residents, incarcerated individuals, active-duty military barracks), individuals under 18 years, individuals unable to complete an English or Spanish telephone interview.
- **Demographic Composition:** Cross-sectional adult population spanning young adults (18–34), middle-aged adults (35–64), and older adults ($\ge 65$).

---

## 3. Clinical Task Definition & Critical Epistemological Separation

> [!CRITICAL]
> **Cross-Sectional Prevalence Classification vs. Prospective Incidence Prediction**
> 
> A fundamental failure mode in health AI is claiming that a model trained on cross-sectional survey data "predicts future risk of developing diabetes." We must clearly document this distinction:
> 
> 1. **Cross-Sectional Classification (What BRFSS Actually Measures):**
>    The survey asks: *"Have you ever been told by a doctor that you have diabetes?"*
>    Therefore, a supervised model trained on raw BRFSS data learns to classify **current prevalence / undiagnosed risk indicators** among people living with the condition today.
> 
> 2. **Prospective Incidence (Future 5-10 Year Risk):**
>    Determining who will develop *incident* diabetes over the next decade requires longitudinal prospective cohort studies (e.g., Framingham Offspring, DPP, ARIC) where healthy individuals are followed over time until diagnosis.
> 
> **Architecture Decision:** In Wellness Anticipator, the model is strictly designated as a **"Population-Calibrated Preventive Screening Model"** for identifying high-risk metabolic phenotypes and undiagnosed prediabetes/diabetes eligibility for clinical lab testing (HbA1c/FPG), NOT a deterministic oracle predicting exact date of future disease onset.

---

## 4. Target Label Definition & Class Balance

### 4.1 Raw Variable: `DIABETE4` (or `DIABETE3`)
Question: *(Ever told) you have diabetes?*

| Raw Code | Survey Response Value | Clinical Interpretation | Preprocessing Target Mapping (`target_diabetes`) |
|---|---|---|---|
| **1** | Yes | Clinically diagnosed diabetes | **1 (Positive Risk)** |
| **2** | Yes, but female told only during pregnancy | Gestational diabetes only | **0 (Negative for Type 2)** — *Captured separately as `gestational_diabetes` risk factor* |
| **3** | No | No diagnosed diabetes | **0 (Negative / Non-diabetic)** |
| **4** | No, pre-diabetes or borderline diabetes | Impaired fasting glucose / prediabetes | **1 (Positive Risk)** (Screening target captures at-risk prediabetes) |
| **7** | Don't know / Not sure | Ambiguous / unverified | **EXCLUDED (Dropped from training cohort)** |
| **9** | Refused | Missing response | **EXCLUDED (Dropped from training cohort)** |
| **BLANK** | Not asked or missing | Missing | **EXCLUDED (Dropped from training cohort)** |

### 4.2 Class Distribution (2021 Survey Weighted Baseline)
- Non-diabetic (0): $\sim 84.8\%$
- Diagnosed Diabetes + Prediabetes (1): $\sim 15.2\%$
- **Class Imbalance Ratio:** Approximately $5.6 : 1$.
- **Clinical Consequence:** Accuracy is completely invalid as a primary evaluation metric. Evaluation must rely on **AUPRC**, **AUROC**, and **Brier Calibration Score**.

---

## 5. Feature Mapping: CDC BRFSS to Compact Feature Vector

The compact survey feature vector was chosen to mirror the validated American Diabetes Association (ADA) 60-Second Risk Test while maximizing user completion rates:

| User Feature in Platform | Canonical Unit / Type | BRFSS Source Variable | BRFSS Encoding & Transformation Logic | Clinical Rationale |
|---|---|---|---|---|
| **Age** | Integer ($18 \dots 99$) | `_AGEG5YR` | 14 categorical brackets (1: 18–24, 2: 25–29, ..., 13: 80+). Mapped to bracket midpoints (e.g., 2: 27, 13: 82). | Age is the strongest demographic non-modifiable risk factor for metabolic decline. |
| **Biological Sex** | Binary (`MALE`/`FEMALE`) | `_SEX` | 1: Male, 2: Female. Mapped to Binary (1: Male, 0: Female). | Men have statistically higher risk of undiagnosed diabetes at lower BMIs. |
| **Body Mass Index (BMI)** | Float ($kg/m^2$) | `_BMI5` | Two decimal implied ($BMI \times 100$). Filter values outside $12.0 \le BMI \le 70.0$, divide by 100.0. | Adiposity strongly correlates with peripheral insulin resistance. |
| **High Blood Pressure History** | Boolean (`True`/`False`) | `BPHIGH4` | 1: Yes $\rightarrow 1$; 2/3/4: No/Pregnancy/Borderline $\rightarrow 0$; 7/9: Excluded. | Essential component of metabolic syndrome clustering. |
| **High Cholesterol History** | Boolean (`True`/`False`) | `TOLDHI2` | 1: Yes $\rightarrow 1$; 2: No $\rightarrow 0$; 7/9: Excluded. | Dyslipidemia indicator (elevated triglycerides, low HDL). |
| **Physical Inactivity** | Boolean (`True`/`False`) | `_TOTINDA` | 1: Had physical activity in past 30 days $\rightarrow 0$ (Active); 2: No activity $\rightarrow 1$ (Inactive). | Sedentary lifestyle impairs muscle glucose uptake. |
| **Smoking Status** | Categorical | `_SMOKER3` | 1: Current daily, 2: Current some days $\rightarrow$ `CURRENT`; 3: Former $\rightarrow$ `FORMER`; 4: Never $\rightarrow$ `NEVER`. | Smoking increases systemic inflammation and oxidative stress. |
| **Gestational Diabetes** | Boolean (`True`/`False`) | `DIABETE4` code 2 | Derived from pregnancy diagnosis code. | Strongest lifetime metabolic stress test in biological females. |

---

## 6. Target Leakage & Confounder Exclusion Analysis

To prevent artificial model inflation ("data leakage"), predictors that only exist *because* a patient has already received medical treatment for diabetes must be rigorously identified and stripped:

```
[EXCLUDED LEAKAGE VARIABLES — MUST NEVER ENTER TRAINING PIPELINE]
1. `INSULIN1` (Now taking insulin pills or shots?) -> 100% Post-diagnosis leakage.
2. `BLDSUGAR` (How often check blood sugar?) -> Diagnostic monitor leakage.
3. `DOCTDIAB` (Visits to doctor for diabetes in past year?) -> Direct diagnosis label leakage.
4. `CHKHEMO3` (Number of times doctor checked A1C in year?) -> Diabetes monitoring leakage.
5. `EYEEXAM1` (Last dilated eye exam for retinopathy?) -> Complication screening leakage.
6. `FEETCHK3` (Feet checked for sores by professional?) -> Diabetic neuropathy leakage.
```

All 6 variables above are explicitly filtered and will never enter feature selection.

---

## 7. Known Data Limitations & Ethical Disclosures

1. **Self-Reported Telephonic Bias:** All heights, weights, and diagnoses are self-reported via telephone interview. Respondents systematically under-report weight and over-report height, leading to a recognized downward bias in self-reported BMI ($\sim 1.0 - 1.5 \, kg/m^2$ lower than clinical scale measurement).
2. **Exclusion of Institutionalized Populations:** Nursing home residents and hospitalized patients are excluded, which may slightly underestimate prevalence in frail elderly cohorts.
3. **No Direct Laboratory Ground-Truth in BRFSS:** Unlike NHANES (which draws venous blood for fasting plasma glucose and HbA1c), BRFSS relies on participant recall of physician diagnosis. Undiagnosed diabetics who have not visited a doctor will be labeled as 0 (false negatives in ground truth).
4. **Generalization Scope:** The dataset represents the adult United States population. Generalization to pediatric populations ($<18$) or non-US healthcare systems with vastly different baseline diets and genetic backgrounds must be explicitly disclosed as unverified.
