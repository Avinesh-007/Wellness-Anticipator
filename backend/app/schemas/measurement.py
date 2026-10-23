from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class MetricType(str, Enum):
    BLOOD_PRESSURE = "BLOOD_PRESSURE"
    FASTING_GLUCOSE = "FASTING_GLUCOSE"
    HBA1C = "HBA1C"
    WEIGHT = "WEIGHT"
    RESTING_HEART_RATE = "RESTING_HEART_RATE"


class MeasurementUnit(str, Enum):
    MMHG = "mmHg"
    MG_DL = "mg/dL"
    MMOL_L = "mmol/L"
    PERCENT = "%"
    KG = "kg"
    LBS = "lbs"
    BPM = "bpm"


class MeasurementSource(str, Enum):
    MANUAL_ENTRY = "MANUAL_ENTRY"
    ANDROID_HEALTH_CONNECT = "ANDROID_HEALTH_CONNECT"
    DEVICE_BLE = "DEVICE_BLE"
    LAB_REPORT = "LAB_REPORT"


class QualityStatus(str, Enum):
    VALID = "VALID"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"
    SUSPECT_DUPLICATE = "SUSPECT_DUPLICATE"


METRIC_PERMISSIBLE_UNITS = {
    MetricType.BLOOD_PRESSURE: {MeasurementUnit.MMHG},
    MetricType.FASTING_GLUCOSE: {MeasurementUnit.MG_DL, MeasurementUnit.MMOL_L},
    MetricType.HBA1C: {MeasurementUnit.PERCENT},
    MetricType.WEIGHT: {MeasurementUnit.KG, MeasurementUnit.LBS},
    MetricType.RESTING_HEART_RATE: {MeasurementUnit.BPM},
}


class MeasurementCreate(BaseModel):
    metric_type: MetricType
    value_numeric: float = Field(..., description="Primary numeric reading")
    secondary_numeric: Optional[float] = Field(None, description="Secondary numeric reading (e.g. Diastolic BP)")
    unit: MeasurementUnit
    measured_at: datetime
    source: MeasurementSource = MeasurementSource.MANUAL_ENTRY
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_measurement_consistency(self) -> "MeasurementCreate":
        metric = self.metric_type
        unit = self.unit
        val1 = self.value_numeric
        val2 = self.secondary_numeric
        measured_time = self.measured_at

        allowed_units = METRIC_PERMISSIBLE_UNITS.get(metric, set())
        if unit not in allowed_units:
            allowed_str = ", ".join(u.value for u in allowed_units)
            raise ValueError(f"Invalid unit '{unit.value}' for {metric.value}. Permissible units: {allowed_str}")

        now_utc = datetime.now(timezone.utc)
        if measured_time.tzinfo is None:
            measured_time_tz = measured_time.replace(tzinfo=timezone.utc)
        else:
            measured_time_tz = measured_time
        if measured_time_tz > now_utc + timedelta(days=1):
            raise ValueError("Observation time cannot be in the future.")

        if metric == MetricType.BLOOD_PRESSURE:
            if val2 is None:
                raise ValueError("Blood pressure requires secondary_numeric for Diastolic BP (mmHg).")
            if not (40.0 <= val1 <= 300.0):
                raise ValueError(f"Systolic blood pressure {val1} mmHg is outside physiological bounds (40-300 mmHg).")
            if not (30.0 <= val2 <= 200.0):
                raise ValueError(f"Diastolic blood pressure {val2} mmHg is outside physiological bounds (30-200 mmHg).")
            if val1 <= val2:
                raise ValueError(f"Systolic blood pressure ({val1}) must be strictly greater than diastolic ({val2}).")

        elif metric == MetricType.FASTING_GLUCOSE:
            if unit == MeasurementUnit.MG_DL:
                if not (20.0 <= val1 <= 600.0):
                    raise ValueError(f"Fasting glucose {val1} mg/dL is outside physiological bounds (20-600 mg/dL).")
            elif unit == MeasurementUnit.MMOL_L:
                if not (1.1 <= val1 <= 33.3):
                    raise ValueError(f"Fasting glucose {val1} mmol/L is outside physiological bounds (1.1-33.3 mmol/L).")

        elif metric == MetricType.HBA1C:
            if not (3.0 <= val1 <= 25.0):
                raise ValueError(f"HbA1c {val1}% is outside physiological bounds (3.0-25.0%).")

        elif metric == MetricType.WEIGHT:
            if unit == MeasurementUnit.KG:
                if not (15.0 <= val1 <= 500.0):
                    raise ValueError(f"Weight {val1} kg is outside physiological bounds (15-500 kg).")
            elif unit == MeasurementUnit.LBS:
                if not (33.0 <= val1 <= 1100.0):
                    raise ValueError(f"Weight {val1} lbs is outside physiological bounds (33-1100 lbs).")

        elif metric == MetricType.RESTING_HEART_RATE:
            if not (25.0 <= val1 <= 250.0):
                raise ValueError(f"Resting heart rate {val1} bpm is outside physiological bounds (25-250 bpm).")

        return self


class MeasurementResponse(BaseModel):
    id: str
    user_id: str
    metric_type: MetricType
    value_numeric: float
    secondary_numeric: Optional[float] = None
    unit: str
    measured_at: datetime
    source: str
    quality_status: QualityStatus
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
