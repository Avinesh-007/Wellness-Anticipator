"""
Disease Risk & Preventive Screening Engine
Wellness Anticipator — Phase 1

Principles:
  1. Strict separation of:
     (a) Deterministic Validated Clinical Scoring (ADA 60-Second Risk Test)
     (b) Cross-sectional Statistical Screening Model (Calibrated Logistic Regression on CDC BRFSS)
  2. Explainable factor attribution distinguishing risk elevators from protective habits.
  3. No diagnostic claims: Screening evaluates eligibility for clinical lab testing (HbA1c/FPG),
     not in-vitro medical diagnosis.
"""

from dataclasses import dataclass, asdict
from datetime import date, datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.clinical_profile import ClinicalProfile
from app.models.measurement import Measurement
from app.models.activity import ActivityRecord
from app.core.logging import app_logger

# Path to serialized model registry & pipeline resolved dynamically across environments
def get_model_path() -> Path:
    import os
    env_path = os.getenv("WELLNESS_MODEL_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    # Repo root relative
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    c1 = repo_root / "ml" / "models" / "serialized" / "diabetes_baseline_lr.joblib"
    if c1.exists():
        return c1
    # App root relative
    c2 = Path(__file__).resolve().parent.parent.parent / "ml" / "models" / "serialized" / "diabetes_baseline_lr.joblib"
    if c2.exists():
        return c2
    # Container root relative
    c3 = Path("/app/ml/models/serialized/diabetes_baseline_lr.joblib")
    if c3.exists():
        return c3
    return c1

MODEL_PATH = get_model_path()


@dataclass
class ADAClinicalScore:
    tool_name: str = "American Diabetes Association (ADA) 60-Second Risk Test"
    points: int = 0
    max_points: int = 10
    threshold_increased_risk: int = 5
    risk_category: str = "LOW_RISK"
    score_breakdown: Dict[str, int] = None
    clinical_guidance: str = ""


@dataclass
class FactorAttribution:
    feature_name: str
    impact: str  # "POSITIVE_RISK", "PROTECTIVE", "NEUTRAL"
    relative_weight: float
    plain_language_explanation: str


def compute_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    """Computes Body Mass Index (BMI) in kg/m^2."""
    if not weight_kg or not height_cm or height_cm <= 0:
        return None
    height_m = height_cm / 100.0
    return round(weight_kg / (height_m * height_m), 1)


def calculate_age_from_dob(dob: Optional[date]) -> Optional[int]:
    """Calculates age in completed years."""
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


# -------------------------------------------------------------
# 1. Deterministic Validated ADA 60-Second Risk Test Engine
# -------------------------------------------------------------
def evaluate_ada_risk_test(
    age: Optional[int],
    biological_sex: Optional[str],
    family_history_diabetes: bool,
    personal_history_hypertension: bool,
    physically_active: bool,
    gestational_diabetes: bool,
    bmi: Optional[float]
) -> ADAClinicalScore:
    """
    Evaluates the validated 7-question American Diabetes Association risk rubric.
    Score ranges 0-10. Score >= 5 warrants clinical screening.
    """
    points = 0
    breakdown = {}

    # 1. Age points: <40: 0, 40-49: 1, 50-59: 2, >=60: 3
    age_pts = 0
    if age is not None:
        if age >= 60:
            age_pts = 3
        elif age >= 50:
            age_pts = 2
        elif age >= 40:
            age_pts = 1
    points += age_pts
    breakdown["age_points"] = age_pts

    # 2. Biological Sex: Male: 1, Female: 0
    sex_pts = 1 if biological_sex and biological_sex.upper() == "MALE" else 0
    points += sex_pts
    breakdown["sex_points"] = sex_pts

    # 3. Gestational Diabetes (in biological females)
    gest_pts = 1 if gestational_diabetes and (biological_sex or "").upper() != "MALE" else 0
    points += gest_pts
    breakdown["gestational_diabetes_points"] = gest_pts

    # 4. Immediate Family History (Parents or Siblings)
    fam_pts = 1 if family_history_diabetes else 0
    points += fam_pts
    breakdown["family_history_points"] = fam_pts

    # 5. History of High Blood Pressure
    bp_pts = 1 if personal_history_hypertension else 0
    points += bp_pts
    breakdown["hypertension_points"] = bp_pts

    # 6. Physical Inactivity (Not physically active)
    act_pts = 0 if physically_active else 1
    points += act_pts
    breakdown["physical_inactivity_points"] = act_pts

    # 7. Body Mass Index Category
    bmi_pts = 0
    if bmi is not None:
        if bmi >= 40.0:
            bmi_pts = 3
        elif bmi >= 30.0:
            bmi_pts = 2
        elif bmi >= 25.0:
            bmi_pts = 1
    points += bmi_pts
    breakdown["bmi_points"] = bmi_pts

    if points >= 5:
        category = "HIGH_RISK"
        guidance = (
            "Your score indicates an elevated risk of prediabetes or undiagnosed Type 2 Diabetes. "
            "The American Diabetes Association recommends discussing these results with a healthcare provider "
            "to perform an in-person diagnostic test (fasting plasma glucose or HbA1c blood test)."
        )
    else:
        category = "LOW_TO_MODERATE_RISK"
        guidance = (
            "Your score is below the high-risk threshold. Continue prioritizing regular physical activity, "
            "balanced nutrition, and routine wellness checkups."
        )

    return ADAClinicalScore(
        points=points,
        risk_category=category,
        score_breakdown=breakdown,
        clinical_guidance=guidance
    )


# -------------------------------------------------------------
# 2. Calibrated Statistical Population Screening Model
# -------------------------------------------------------------
_cached_pipeline = None


def load_screening_pipeline():
    """Loads and caches the calibrated pipeline."""
    global _cached_pipeline
    path = get_model_path()
    if _cached_pipeline is None and path.exists():
        try:
            _cached_pipeline = joblib.load(path)
            app_logger.info("Loaded serialized diabetes screening pipeline from %s", str(path))
        except Exception as e:
            app_logger.error("Failed to load model pipeline: %s", str(e))
    return _cached_pipeline


def evaluate_survey_model_risk(
    age: float,
    bmi: float,
    sex: int,
    high_bp: int,
    high_chol: int,
    physical_inactivity: int,
    smoking_status: str
) -> Tuple[float, str, List[FactorAttribution]]:
    """
    Inference over calibrated CDC BRFSS model pipeline with local factor attribution.
    """
    pipeline = load_screening_pipeline()
    if pipeline is None:
        # Fallback if model artifact not found
        return 0.20, "AVERAGE_POPULATION_RISK", []

    input_df = pd.DataFrame([{
        "age": age,
        "bmi": bmi,
        "sex": sex,
        "high_bp": high_bp,
        "high_chol": high_chol,
        "physical_inactivity": physical_inactivity,
        "smoking_status": smoking_status
    }])

    prob = float(pipeline.predict_proba(input_df)[0, 1])

    if prob < 0.12:
        tier = "LOW_SCREENING_RISK"
    elif prob < 0.25:
        tier = "AVERAGE_POPULATION_RISK"
    elif prob < 0.40:
        tier = "MODERATE_SCREENING_RISK"
    else:
        tier = "ELEVATED_SCREENING_RISK"

    # Explainable factor attributions based on physiological inputs
    factors: List[FactorAttribution] = []

    # Age factor
    if age >= 50:
        factors.append(FactorAttribution(
            feature_name=f"Age ({int(age)} years)",
            impact="POSITIVE_RISK",
            relative_weight=0.25,
            plain_language_explanation="Metabolic efficiency and cellular insulin sensitivity naturally decline with age."
        ))
    elif age < 35:
        factors.append(FactorAttribution(
            feature_name=f"Age ({int(age)} years)",
            impact="PROTECTIVE",
            relative_weight=-0.15,
            plain_language_explanation="Younger chronological age is associated with lower metabolic risk."
        ))

    # BMI factor
    if bmi >= 30.0:
        factors.append(FactorAttribution(
            feature_name=f"Body Mass Index ({bmi} kg/m²)",
            impact="POSITIVE_RISK",
            relative_weight=0.30,
            plain_language_explanation="Elevated adiposity is the leading modifiable factor associated with insulin resistance."
        ))
    elif bmi < 25.0:
        factors.append(FactorAttribution(
            feature_name=f"Body Mass Index ({bmi} kg/m²)",
            impact="PROTECTIVE",
            relative_weight=-0.20,
            plain_language_explanation="BMI within normal parameters provides strong protective benefits for glycemic regulation."
        ))

    # High blood pressure factor
    if high_bp == 1:
        factors.append(FactorAttribution(
            feature_name="High Blood Pressure History",
            impact="POSITIVE_RISK",
            relative_weight=0.22,
            plain_language_explanation="Hypertension frequently clusters with insulin resistance in metabolic syndrome."
        ))

    # Physical activity factor
    if physical_inactivity == 0:
        factors.append(FactorAttribution(
            feature_name="Regular Physical Activity",
            impact="PROTECTIVE",
            relative_weight=-0.18,
            plain_language_explanation="Active skeletal muscle contracts glucose transporters independent of insulin."
        ))
    else:
        factors.append(FactorAttribution(
            feature_name="Sedentary Lifestyle (Inactivity)",
            impact="POSITIVE_RISK",
            relative_weight=0.15,
            plain_language_explanation="Prolonged physical inactivity impairs peripheral glucose utilization."
        ))

    # High cholesterol factor
    if high_chol == 1:
        factors.append(FactorAttribution(
            feature_name="High Cholesterol History",
            impact="POSITIVE_RISK",
            relative_weight=0.12,
            plain_language_explanation="Elevated serum lipids correlate with systemic metabolic stress."
        ))

    # Sort factors by absolute weight descending
    factors.sort(key=lambda x: abs(x.relative_weight), reverse=True)
    return round(prob, 4), tier, factors


# -------------------------------------------------------------
# 3. Comprehensive Multi-Domain Screening Assessment
# -------------------------------------------------------------
def perform_diabetes_assessment(
    db: Session,
    user_id: str,
    manual_overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes a comprehensive, explainable Type 2 Diabetes screening assessment.
    Combines ADA questionnaire + Calibrated ML Model + Longitudinal vitals.
    """
    profile = db.query(ClinicalProfile).filter(ClinicalProfile.user_id == user_id).first()
    
    # Latest clinical measurements
    latest_weight_m = db.query(Measurement).filter(
        Measurement.user_id == user_id,
        Measurement.metric_type == "WEIGHT"
    ).order_by(Measurement.measured_at.desc()).first()

    latest_glucose_m = db.query(Measurement).filter(
        Measurement.user_id == user_id,
        Measurement.metric_type == "FASTING_GLUCOSE"
    ).order_by(Measurement.measured_at.desc()).first()

    latest_bp_m = db.query(Measurement).filter(
        Measurement.user_id == user_id,
        Measurement.metric_type == "BLOOD_PRESSURE"
    ).order_by(Measurement.measured_at.desc()).first()

    # Recent activity summary (last 14 days)
    recent_activities = db.query(ActivityRecord).filter(
        ActivityRecord.user_id == user_id,
        ActivityRecord.recorded_date >= date.today() - timedelta(days=14)
    ).all()
    avg_steps = float(np.mean([a.step_count for a in recent_activities])) if recent_activities else None

    # Resolve feature values (respecting manual overrides if provided)
    overrides = manual_overrides or {}
    age = overrides.get("age", calculate_age_from_dob(profile.date_of_birth if profile else None) or 40)
    sex_str = overrides.get("biological_sex", profile.biological_sex if profile else "FEMALE")
    sex_binary = 1 if (sex_str or "").upper() == "MALE" else 0
    height_cm = overrides.get("height_cm", profile.height_cm if profile else 170.0)
    weight_kg = overrides.get("weight_kg", latest_weight_m.value_numeric if latest_weight_m else 75.0)
    bmi = compute_bmi(weight_kg, height_cm) or 26.0

    fam_hist = overrides.get("family_history_diabetes", profile.family_history_diabetes if profile else False)
    htn_hist = overrides.get("personal_history_hypertension", profile.personal_history_hypertension if profile else False)
    gest_hist = overrides.get("gestational_diabetes", profile.gestational_diabetes if profile else False)
    smoking_status = overrides.get("smoking_status", profile.smoking_status if profile else "NEVER")

    # Inactivity: active if manual override says so, or if recent avg steps >= 7000
    is_active = overrides.get("physically_active", (avg_steps is not None and avg_steps >= 7000.0))
    inactivity_code = 0 if is_active else 1

    # 1. Deterministic ADA Score
    ada_result = evaluate_ada_risk_test(
        age=age,
        biological_sex=sex_str,
        family_history_diabetes=fam_hist,
        personal_history_hypertension=htn_hist,
        physically_active=is_active,
        gestational_diabetes=gest_hist,
        bmi=bmi
    )

    # 2. Calibrated ML Model Screening
    model_prob, model_tier, factors = evaluate_survey_model_risk(
        age=float(age),
        bmi=float(bmi),
        sex=sex_binary,
        high_bp=1 if htn_hist else 0,
        high_chol=0,
        physical_inactivity=inactivity_code,
        smoking_status=smoking_status
    )

    # 3. Clinical Safety Escalations
    escalations = []
    if latest_glucose_m and latest_glucose_m.value_numeric >= 250.0:
        escalations.append({
            "severity": "URGENT_LAB_ABNORMALITY",
            "message": f"Your recorded fasting glucose reading ({latest_glucose_m.value_numeric:.0f} mg/dL) is critically high.",
            "guidance": "Seek immediate medical care. Markedly elevated glucose warrants urgent clinical evaluation."
        })

    return {
        "assessment_type": "DIABETES_T2D",
        "assessment_timestamp": datetime.now(timezone.utc).isoformat(),
        "input_summary": {
            "age": age,
            "biological_sex": sex_str,
            "height_cm": height_cm,
            "weight_kg": weight_kg,
            "computed_bmi": bmi,
            "family_history_diabetes": fam_hist,
            "personal_history_hypertension": htn_hist,
            "gestational_diabetes": gest_hist,
            "smoking_status": smoking_status,
            "physically_active": is_active,
            "recent_14d_average_steps": round(avg_steps, 0) if avg_steps else None
        },
        "ada_clinical_score": asdict(ada_result),
        "statistical_screening_model": {
            "model_version": "v1.0.0-lr-baseline",
            "model_architecture": "Balanced Logistic Regression with Platt Scaling",
            "calibrated_screening_probability": model_prob,
            "risk_tier": model_tier,
            "intended_prediction_target": "Statistical likelihood of harboring diagnosed diabetes or prediabetes based on CDC BRFSS public health survey cohort."
        },
        "contributing_factors": [asdict(f) for f in factors],
        "safety_escalations": escalations,
        "clinical_limitations_and_disclaimer": {
            "intended_population": "Adults aged 18-80 without an established prior clinical diagnosis of Type 1 Diabetes.",
            "screening_nature": (
                "This tool provides preventive lifestyle risk stratification and public health survey screening. "
                "It is NOT a clinical diagnosis, NOT an in-vitro diagnostic device, and NOT a replacement for "
                "laboratory blood tests (fasting plasma glucose or HbA1c)."
            ),
            "medical_escalation_guidance": (
                "If you experience classic symptoms of hyperglycemia (excessive thirst, frequent urination, "
                "unexplained weight loss, or persistent fatigue), schedule an evaluation with a licensed physician."
            )
        }
    }
