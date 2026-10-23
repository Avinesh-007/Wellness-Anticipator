"""
CDC BRFSS Data Cleaning, Transformation & Preprocessing Pipeline
Wellness Anticipator — Phase 1 ML Pipeline
"""

from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Exact mapping dictionary for BRFSS 14-level age bracket
AGE_BRACKET_MAP: Dict[int, float] = {
    1: 21.0,  # 18-24
    2: 27.0,  # 25-29
    3: 32.0,  # 30-34
    4: 37.0,  # 35-39
    5: 42.0,  # 40-44
    6: 47.0,  # 45-49
    7: 52.0,  # 50-54
    8: 57.0,  # 55-59
    9: 62.0,  # 60-64
    10: 67.0, # 65-69
    11: 72.0, # 70-74
    12: 77.0, # 75-79
    13: 82.0  # 80+
}

CONTINUOUS_FEATURES = ["age", "bmi"]
BINARY_FEATURES = ["sex", "high_bp", "high_chol", "physical_inactivity"]
CATEGORICAL_FEATURES = ["smoking_status"]
ALL_FEATURE_COLUMNS = CONTINUOUS_FEATURES + BINARY_FEATURES + CATEGORICAL_FEATURES


def clean_and_transform_brfss(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Cleans raw CDC BRFSS variables into the standardized compact feature matrix X and target y.
    
    Target:
      1 = Diagnosed with Type 2 Diabetes or Prediabetes (At-risk screening target)
      0 = Non-diabetic (or gestational diabetes only)
      Drops invalid/refused targets (7, 9, NaN)
    """
    if "DIABETE4" not in df.columns:
        raise ValueError("Target column 'DIABETE4' not found in dataframe.")

    # 1. Filter out invalid/refused target labels
    valid_target_mask = df["DIABETE4"].isin([1, 2, 3, 4])
    clean_df = df[valid_target_mask].copy()

    # Target: 1 (Yes) or 4 (Prediabetes) -> 1; 2 (Gestational) or 3 (No) -> 0
    y = clean_df["DIABETE4"].isin([1, 4]).astype(int)

    # 2. Extract and transform Age (_AGEG5YR)
    age_col = clean_df["_AGEG5YR"].map(AGE_BRACKET_MAP)

    # 3. Extract and transform Sex (_SEX): 1=Male (1), 2=Female (0)
    sex_col = clean_df["_SEX"].map({1: 1, 2: 0})

    # 4. Extract and transform BMI (_BMI5): two decimals implied, bounded to physiological range 12.0 - 70.0
    raw_bmi = clean_df["_BMI5"] / 100.0
    bmi_col = raw_bmi.where((raw_bmi >= 12.0) & (raw_bmi <= 70.0), np.nan)

    # 5. High Blood Pressure (BPHIGH4): 1=Yes (1), 2,3,4=No/Preg/Borderline (0), 7,9=NaN
    bp_map = {1: 1, 2: 0, 3: 0, 4: 0}
    high_bp_col = clean_df["BPHIGH4"].map(bp_map)

    # 6. High Cholesterol (TOLDHI2): 1=Yes (1), 2=No (0), 7,9=NaN
    chol_map = {1: 1, 2: 0}
    high_chol_col = clean_df["TOLDHI2"].map(chol_map)

    # 7. Physical Inactivity (_TOTINDA): 1=Active (0 for inactivity), 2=Inactive (1 for inactivity)
    inact_map = {1: 0, 2: 1}
    inact_col = clean_df["_TOTINDA"].map(inact_map)

    # 8. Smoking Status (_SMOKER3): 1,2=CURRENT, 3=FORMER, 4=NEVER
    smoker_map = {1: "CURRENT", 2: "CURRENT", 3: "FORMER", 4: "NEVER"}
    smoker_col = clean_df["_SMOKER3"].map(smoker_map)

    X = pd.DataFrame({
        "age": age_col,
        "bmi": bmi_col,
        "sex": sex_col,
        "high_bp": high_bp_col,
        "high_chol": high_chol_col,
        "physical_inactivity": inact_col,
        "smoking_status": smoker_col
    })

    return X, y


def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Constructs a leak-free scikit-learn ColumnTransformer.
    Must be fit STRICTLY on training split only.
    """
    cont_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    binary_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent"))
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("continuous", cont_pipeline, CONTINUOUS_FEATURES),
            ("binary", binary_pipeline, BINARY_FEATURES),
            ("categorical", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor


def patient_level_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    """
    Executes a patient-level stratified split into Train, Validation, and Held-out Test cohorts.
    """
    # First split off the test set
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y,
        test_size=test_size,
        stratify=y,
        random_state=random_state
    )

    # Then split train into train and validation
    adjusted_val_size = val_size / (1.0 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val,
        test_size=adjusted_val_size,
        stratify=y_train_val,
        random_state=random_state
    )

    return X_train, X_val, X_test, y_train, y_val, y_test
