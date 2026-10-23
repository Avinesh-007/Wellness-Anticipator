"""
Model Training, Calibration, Evaluation and Serialization Pipeline
Wellness Anticipator — Phase 1 ML Pipeline
"""

import hashlib
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from ml.audits.cdc_brfss_audit import generate_benchmark_brfss_sample
from ml.pipelines.data_preprocessing import (
    clean_and_transform_brfss,
    build_preprocessing_pipeline
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("model_training")


def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
    """Computes comprehensive clinical evaluation metrics."""
    auroc = float(roc_auc_score(y_true, y_prob))
    auprc = float(average_precision_score(y_true, y_prob))
    brier = float(brier_score_loss(y_true, y_prob))

    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    sensitivity = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    positive_predictive_value = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0

    # Calibration curve (5 probability bins)
    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=5, strategy="uniform")

    return {
        "auroc": round(auroc, 4),
        "auprc": round(auprc, 4),
        "brier_score": round(brier, 4),
        "sensitivity": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "positive_predictive_value": round(positive_predictive_value, 4),
        "operating_threshold": threshold,
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "calibration_curve": {
            "prob_true": [round(float(p), 4) for p in prob_true],
            "prob_pred": [round(float(p), 4) for p in prob_pred]
        }
    }


def train_and_evaluate_pipeline(
    raw_df: pd.DataFrame,
    artifacts_dir: str = "ml/models"
) -> Dict[str, Any]:
    """
    Executes end-to-end training, calibration, and evaluation for:
      1. Logistic Regression Baseline
      2. HistGradientBoosting Comparison Model
    """
    logger.info("Cleaning raw BRFSS dataset (total rows: %d)...", len(raw_df))
    X, y = clean_and_transform_brfss(raw_df)
    logger.info("Cleaned feature matrix: %d rows, %d columns. Positive rate: %.2f%%",
                len(X), len(X.columns), (y.mean() * 100))

    # Patient-level stratified split: 80% Train/Calibrate, 20% Held-Out Test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42
    )
    logger.info("Split sizes -> Train: %d, Test: %d", len(X_train), len(X_test))

    # Preprocessor fit ONLY on training split
    preprocessor = build_preprocessing_pipeline()

    # -------------------------------------------------------------
    # 1. Baseline Model: Calibrated Balanced Logistic Regression
    # -------------------------------------------------------------
    logger.info("Training Baseline Model: Logistic Regression (5-fold Calibrated)...")
    lr_base = LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000, random_state=42)
    lr_calibrated = CalibratedClassifierCV(estimator=lr_base, method="sigmoid", cv=5)

    lr_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", lr_calibrated)
    ])
    lr_pipeline.fit(X_train, y_train)

    lr_test_probs = lr_pipeline.predict_proba(X_test)[:, 1]
    lr_metrics = compute_metrics(y_test.values, lr_test_probs)
    logger.info("Baseline Logistic Regression Test AUROC: %.4f, AUPRC: %.4f, Brier: %.4f",
                lr_metrics["auroc"], lr_metrics["auprc"], lr_metrics["brier_score"])

    # -------------------------------------------------------------
    # 2. Comparison Model: Calibrated HistGradientBoostingClassifier
    # -------------------------------------------------------------
    logger.info("Training Comparison Model: HistGradientBoostingClassifier (5-fold Calibrated)...")
    gbt_base = HistGradientBoostingClassifier(
        class_weight="balanced",
        max_iter=100,
        learning_rate=0.08,
        random_state=42
    )
    gbt_calibrated = CalibratedClassifierCV(estimator=gbt_base, method="sigmoid", cv=5)

    gbt_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", gbt_calibrated)
    ])
    gbt_pipeline.fit(X_train, y_train)

    gbt_test_probs = gbt_pipeline.predict_proba(X_test)[:, 1]
    gbt_metrics = compute_metrics(y_test.values, gbt_test_probs)
    logger.info("Comparison HistGradientBoosting Test AUROC: %.4f, AUPRC: %.4f, Brier: %.4f",
                gbt_metrics["auroc"], gbt_metrics["auprc"], gbt_metrics["brier_score"])

    # -------------------------------------------------------------
    # Serialization & Artifacts
    # -------------------------------------------------------------
    out_dir = Path(artifacts_dir)
    serialized_dir = out_dir / "serialized"
    serialized_dir.mkdir(parents=True, exist_ok=True)

    # Save baseline pipeline
    lr_path = serialized_dir / "diabetes_baseline_lr.joblib"
    joblib.dump(lr_pipeline, lr_path)
    lr_sha = hashlib.sha256(open(lr_path, "rb").read()).hexdigest()

    # Save comparison GBT pipeline
    gbt_path = serialized_dir / "diabetes_comparison_gbt.joblib"
    joblib.dump(gbt_pipeline, gbt_path)
    gbt_sha = hashlib.sha256(open(gbt_path, "rb").read()).hexdigest()

    # Model registry manifest
    registry = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "task_name": "T2D_POPULATION_SCREENING",
        "prediction_target": "Diagnosed Type 2 Diabetes or Prediabetes prevalence in adult survey cohort",
        "models": {
            "baseline_logistic_regression": {
                "version": "v1.0.0-lr-baseline",
                "algorithm": "LogisticRegression(C=1.0, class_weight='balanced') + CalibratedClassifierCV(5-fold sigmoid)",
                "calibrated": True,
                "calibration_method": "Platt Scaling (5-Fold Cross-Validation Sigmoid)",
                "artifact_path": str(lr_path).replace("\\", "/"),
                "sha256": lr_sha,
                "metrics": lr_metrics,
                "is_active": True
            },
            "comparison_hist_gradient_boosting": {
                "version": "v1.0.0-gbt-comparison",
                "algorithm": "HistGradientBoostingClassifier(class_weight='balanced') + CalibratedClassifierCV(5-fold sigmoid)",
                "calibrated": True,
                "calibration_method": "Platt Scaling (5-Fold Cross-Validation Sigmoid)",
                "artifact_path": str(gbt_path).replace("\\", "/"),
                "sha256": gbt_sha,
                "metrics": gbt_metrics,
                "is_active": False
            }
        }
    }

    with open(out_dir / "registry.json", "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

    # Detailed evaluation report
    eval_report = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "test_cohort_size": len(y_test),
        "test_prevalence": float(y_test.mean()),
        "baseline_model": registry["models"]["baseline_logistic_regression"],
        "comparison_model": registry["models"]["comparison_hist_gradient_boosting"],
        "clinical_epistemology_statement": (
            "Models predict current screening positivity / high-risk metabolic phenotype on cross-sectional "
            "survey data. They do not predict longitudinal 10-year prospective disease incidence."
        )
    }

    with open(out_dir / "evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    logger.info("Model pipelines successfully serialized and registered in %s", str(out_dir))
    return eval_report


if __name__ == "__main__":
    df_sample = generate_benchmark_brfss_sample(n_samples=5000, random_seed=42)
    report = train_and_evaluate_pipeline(df_sample)
    print("\n--- MODEL TRAINING SUMMARY ---")
    print(f"Baseline LR AUROC: {report['baseline_model']['metrics']['auroc']}")
    print(f"Baseline LR AUPRC: {report['baseline_model']['metrics']['auprc']}")
    print(f"Baseline LR Brier Score: {report['baseline_model']['metrics']['brier_score']}")
    print(f"Comparison GBT AUROC: {report['comparison_model']['metrics']['auroc']}")
    print(f"Comparison GBT AUPRC: {report['comparison_model']['metrics']['auprc']}")
    print(f"Comparison GBT Brier Score: {report['comparison_model']['metrics']['brier_score']}")
