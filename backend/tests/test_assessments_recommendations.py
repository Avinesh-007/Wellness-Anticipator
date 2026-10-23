from app.services.risk_service import evaluate_ada_risk_test, evaluate_survey_model_risk


def test_ada_risk_test_scoring_vignettes():
    # Vignette 1: 30yo active female, normal BMI (22.0), no family history, no HTN -> Score = 0
    score_low = evaluate_ada_risk_test(
        age=30,
        biological_sex="FEMALE",
        family_history_diabetes=False,
        personal_history_hypertension=False,
        physically_active=True,
        gestational_diabetes=False,
        bmi=22.0
    )
    assert score_low.points == 0
    assert score_low.risk_category == "LOW_TO_MODERATE_RISK"

    # Vignette 2: 56yo inactive male (age:2, sex:1, inact:1), family history (+1), high BP (+1), BMI 32 (+2) -> Score = 8
    score_high = evaluate_ada_risk_test(
        age=56,
        biological_sex="MALE",
        family_history_diabetes=True,
        personal_history_hypertension=True,
        physically_active=False,
        gestational_diabetes=False,
        bmi=32.0
    )
    assert score_high.points == 8
    assert score_high.risk_category == "HIGH_RISK"
    assert "recommends discussing these results" in score_high.clinical_guidance


def test_survey_model_inference_and_factors():
    prob, tier, factors = evaluate_survey_model_risk(
        age=55.0,
        bmi=32.0,
        sex=1,
        high_bp=1,
        high_chol=1,
        physical_inactivity=1,
        smoking_status="CURRENT"
    )
    assert 0.0 <= prob <= 1.0
    assert tier in ["LOW_SCREENING_RISK", "AVERAGE_POPULATION_RISK", "MODERATE_SCREENING_RISK", "ELEVATED_SCREENING_RISK"]
    assert len(factors) >= 3
    # High BP and high BMI should be flagged as positive risk
    risk_names = [f.feature_name for f in factors if f.impact == "POSITIVE_RISK"]
    assert any("Blood Pressure" in name for name in risk_names)
    assert any("Body Mass Index" in name for name in risk_names)


def test_api_diabetes_assessment_endpoint(auth_user_a, client):
    # Set clinical profile
    client.put(
        "/api/v1/users/profile",
        json={
            "date_of_birth": "1975-04-12",
            "biological_sex": "MALE",
            "height_cm": 178.0,
            "family_history_diabetes": True,
            "personal_history_hypertension": True
        },
        headers=auth_user_a["headers"]
    )

    resp = client.post(
        "/api/v1/assessments/diabetes",
        json={"weight_kg": 95.0, "physically_active": False},
        headers=auth_user_a["headers"]
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["assessment_type"] == "DIABETES_T2D"
    assert "ada_clinical_score" in data
    assert "statistical_screening_model" in data
    assert "contributing_factors" in data
    assert "clinical_limitations_and_disclaimer" in data
    assert data["ada_clinical_score"]["points"] >= 5


def test_api_recommendations_endpoint(auth_user_a, client):
    resp = client.get("/api/v1/recommendations/", headers=auth_user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    assert data["recommendations_count"] >= 1
    first_rec = data["recommendations"][0]
    assert "guideline_source" in first_rec
    assert "target_action" in first_rec
