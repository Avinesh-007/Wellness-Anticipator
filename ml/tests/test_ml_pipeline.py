import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from ml.audits.cdc_brfss_audit import generate_benchmark_brfss_sample
from ml.pipelines.data_preprocessing import clean_and_transform_brfss, build_preprocessing_pipeline
from ml.pipelines.train_models import train_and_evaluate_pipeline


def test_preprocessing_target_and_feature_cleaning():
    raw_df = pd.DataFrame({
        "DIABETE4": [1, 4, 3, 2, 7, 9],  # 1=Yes, 4=Prediabetes, 3=No, 2=Gestational, 7=Don't know, 9=Refused
        "_AGEG5YR": [1, 5, 10, 13, 14, 1],
        "_SEX": [1, 2, 1, 2, 1, 1],
        "_BMI5": [2450, 3100, 2200, 9999, 2800, 2500],  # 9999 is invalid/missing
        "BPHIGH4": [1, 3, 2, 1, 7, 1],
        "TOLDHI2": [1, 2, 1, 2, 9, 2],
        "_TOTINDA": [1, 2, 1, 2, 9, 1],
        "_SMOKER3": [1, 4, 3, 4, 9, 1]
    })

    X, y = clean_and_transform_brfss(raw_df)

    # Invalid targets (7, 9) must be dropped -> 4 rows remain
    assert len(X) == 4
    assert len(y) == 4
    # 1 and 4 mapped to 1, 3 and 2 mapped to 0
    assert list(y.values) == [1, 1, 0, 0]

    # Age bracket 1 maps to 21.0, bracket 5 maps to 42.0
    assert X["age"].iloc[0] == 21.0
    assert X["age"].iloc[1] == 42.0

    # BMI 2450 -> 24.5, 9999 -> NaN
    assert X["bmi"].iloc[0] == 24.5
    assert np.isnan(X["bmi"].iloc[3])


def test_model_serialization_and_inference():
    model_path = Path("ml/models/serialized/diabetes_baseline_lr.joblib")
    assert model_path.exists(), "Serialized model baseline artifact must exist."

    pipeline = joblib.load(model_path)
    assert hasattr(pipeline, "predict_proba")

    # Sample inference
    sample_df = pd.DataFrame([{
        "age": 52.0,
        "bmi": 29.5,
        "sex": 1,
        "high_bp": 1,
        "high_chol": 0,
        "physical_inactivity": 1,
        "smoking_status": "FORMER"
    }])

    probs = pipeline.predict_proba(sample_df)
    assert probs.shape == (1, 2)
    assert 0.0 <= probs[0, 1] <= 1.0


def test_model_registry_and_evaluation_report():
    registry_path = Path("ml/models/registry.json")
    eval_path = Path("ml/models/evaluation_report.json")

    assert registry_path.exists()
    assert eval_path.exists()

    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    assert "baseline_logistic_regression" in registry["models"]
    assert "comparison_hist_gradient_boosting" in registry["models"]
    
    lr_metrics = registry["models"]["baseline_logistic_regression"]["metrics"]
    assert "auroc" in lr_metrics
    assert "auprc" in lr_metrics
    assert "brier_score" in lr_metrics
    assert lr_metrics["auroc"] > 0.60
    assert lr_metrics["brier_score"] <= 0.25
