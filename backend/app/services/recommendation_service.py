"""
Evidence-Informed Preventive Recommendations Engine
Wellness Anticipator — Phase 1

Principles:
  1. Achievable micro-goals tailored to identified modifiable factors.
  2. Grounded strictly in validated clinical guidelines (WHO, ADA, AHA).
  3. Every recommendation transparently cites its evidence basis.
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Any


@dataclass
class PreventiveRecommendation:
    category: str  # "PHYSICAL_ACTIVITY", "NUTRITION", "SLEEP", "CLINICAL_SCREENING"
    title: str
    target_action: str
    rationale: str
    guideline_source: str
    difficulty: str  # "EASY", "MODERATE", "ACHIEVABLE"


def generate_recommendations(
    assessment_summary: Dict[str, Any],
    trends_summary: Dict[str, Any]
) -> List[PreventiveRecommendation]:
    """
    Synthesizes assessment outputs and recent longitudinal trends into 3-4 achievable,
    evidence-informed wellness goals.
    """
    recs: List[PreventiveRecommendation] = []
    inputs = assessment_summary.get("input_summary", {})
    ada_pts = assessment_summary.get("ada_clinical_score", {}).get("points", 0)
    bmi = inputs.get("computed_bmi", 25.0)
    is_active = inputs.get("physically_active", True)
    htn_hist = inputs.get("personal_history_hypertension", False)

    # 1. Clinical Screening Recommendation (If ADA score >= 5 or elevated screening risk)
    if ada_pts >= 5:
        recs.append(PreventiveRecommendation(
            category="CLINICAL_SCREENING",
            title="Schedule Routine Preventive Glycemic Lab Screening",
            target_action="Request a fasting plasma glucose (FPG) or glycated hemoglobin (HbA1c) lab test at your next primary care consultation.",
            rationale="Your validated ADA risk score (>=5) qualifies you for standard clinical prediabetes screening. Early detection of impaired fasting glucose allows timely lifestyle intervention.",
            guideline_source="American Diabetes Association (ADA) Standards of Care in Diabetes — 2024 (Section 3: Prevention)",
            difficulty="ACHIEVABLE"
        ))

    # 2. Physical Activity Recommendation
    avg_steps = trends_summary.get("metrics", {}).get("steps", {}).get("mean")
    if not is_active or (avg_steps is not None and avg_steps < 7000):
        recs.append(PreventiveRecommendation(
            category="PHYSICAL_ACTIVITY",
            title="Gradual Daily Walking Target (7,500 Steps)",
            target_action="Incorporate a 15-minute brisk walk post-lunch or post-dinner, building toward 7,500 daily steps.",
            rationale="Post-prandial (post-meal) walking significantly blunts blood glucose excursions and enhances peripheral insulin sensitivity in skeletal muscle.",
            guideline_source="World Health Organization (WHO) Guidelines on Physical Activity and Sedentary Behaviour (2020)",
            difficulty="ACHIEVABLE"
        ))
    else:
        recs.append(PreventiveRecommendation(
            category="PHYSICAL_ACTIVITY",
            title="Maintain Cardiorespiratory Fitness Baseline",
            target_action="Maintain your current active step baseline (>7,500 steps/day) and include 2 weekly sessions of moderate muscle-strengthening exercises.",
            rationale="Consistent physical activity sustains insulin sensitivity and reduces cardiovascular strain.",
            guideline_source="WHO Guidelines on Physical Activity (2020)",
            difficulty="EASY"
        ))

    # 3. Nutrition & Weight Management Recommendation
    if bmi >= 25.0:
        recs.append(PreventiveRecommendation(
            category="NUTRITION",
            title="Dietary Fiber & Satiety Optimization",
            target_action="Aim for at least 25-30 grams of dietary fiber daily by adding leafy vegetables, legumes, and whole grains to your meals.",
            rationale="High-viscosity dietary fiber slows carbohydrate absorption and improves glycemic control while promoting satiety.",
            guideline_source="ADA Standards of Care — Medical Nutrition Therapy (2024)",
            difficulty="MODERATE"
        ))

    # 4. Sleep Hygiene Recommendation
    sleep_ewma = trends_summary.get("metrics", {}).get("sleep_duration", {}).get("ewma")
    if sleep_ewma is not None and sleep_ewma < 420:  # Less than 7 hours
        recs.append(PreventiveRecommendation(
            category="SLEEP",
            title="Establish a 7-Hour Sleep Consistency Window",
            target_action="Set a regular bedtime schedule aiming for 7-8 hours in bed, dimming screens 45 minutes before sleep.",
            rationale="Sleep restriction (<7 hours) acutely impairs morning insulin sensitivity and elevates evening cortisol.",
            guideline_source="American Academy of Sleep Medicine & Sleep Research Society Consensus (2015)",
            difficulty="MODERATE"
        ))

    return recs
