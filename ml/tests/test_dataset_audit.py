import pytest
from ml.audits.cdc_brfss_audit import (
    generate_benchmark_brfss_sample,
    audit_brfss_dataset,
    PROHIBITED_LEAKAGE_VARS
)


def test_brfss_audit_clean_cohort():
    df = generate_benchmark_brfss_sample(n_samples=500, random_seed=123)
    report = audit_brfss_dataset(df, source_desc="Test Clean Cohort")
    
    assert report.sample_size == 500
    assert report.leakage_detected is False
    assert len(report.leakage_variables_found) == 0
    assert report.target_variable == "DIABETE4"
    assert report.clinical_use_case_supported is True
    assert report.target_distribution["positive_at_risk_count"] > 0
    assert report.target_distribution["negative_non_diabetic_count"] > 0


def test_brfss_audit_detects_prohibited_leakage():
    df = generate_benchmark_brfss_sample(n_samples=200, random_seed=456)
    
    # Inject post-diagnosis clinical leakage variables
    df["INSULIN1"] = 1  # Taking insulin
    df["DOCTDIAB"] = 2  # Doctor visits for diabetes
    
    report = audit_brfss_dataset(df, source_desc="Cohort with Injected Leakage")
    
    assert report.leakage_detected is True
    assert "INSULIN1" in report.leakage_variables_found
    assert "DOCTDIAB" in report.leakage_variables_found
    assert report.clinical_use_case_supported is False
