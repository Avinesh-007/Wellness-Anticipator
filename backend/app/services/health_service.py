from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.measurement import Measurement
from app.models.activity import ActivityRecord
from app.models.sleep import SleepRecord
from app.models.consent import ConsentRecord
from app.models.clinical_profile import ClinicalProfile
from app.schemas.measurement import MeasurementCreate, MetricType
from app.schemas.activity import ActivityCreate
from app.schemas.sleep import SleepCreate
from app.schemas.clinical_profile import ClinicalProfileUpdate
from app.core.errors import AppException, ConsentRequiredException, ResourceNotFoundException
from app.services.consent_service import check_user_consent
from app.services.audit_service import log_audit_event


# ---------------------------------------------------------
# Clinical Profile Management
# ---------------------------------------------------------

def get_or_create_clinical_profile(db: Session, user_id: str) -> ClinicalProfile:
    """Retrieves the user's clinical profile, creating one if not yet initialized."""
    profile = db.query(ClinicalProfile).filter(ClinicalProfile.user_id == user_id).first()
    if not profile:
        profile = ClinicalProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_clinical_profile(
    db: Session,
    user_id: str,
    profile_in: ClinicalProfileUpdate,
    client_ip: Optional[str] = None
) -> ClinicalProfile:
    """Updates the user's clinical profile."""
    profile = get_or_create_clinical_profile(db, user_id)
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)

    log_audit_event(
        db=db,
        action="UPDATE_CLINICAL_PROFILE",
        resource_type="clinical_profiles",
        user_id=user_id,
        resource_id=profile.id,
        client_ip=client_ip
    )
    return profile


# ---------------------------------------------------------
# Clinical Measurements (BP, Fasting Glucose, HbA1c, etc.)
# ---------------------------------------------------------

def create_measurement(
    db: Session,
    user_id: str,
    m_in: MeasurementCreate,
    client_ip: Optional[str] = None
) -> Measurement:
    """Ingests a clinical measurement after checking CLINICAL_MEASUREMENTS consent."""
    if not check_user_consent(db, user_id, "CLINICAL_MEASUREMENTS"):
        raise ConsentRequiredException("CLINICAL_MEASUREMENTS")

    measurement = Measurement(
        user_id=user_id,
        metric_type=m_in.metric_type.value,
        value_numeric=m_in.value_numeric,
        secondary_numeric=m_in.secondary_numeric,
        unit=m_in.unit.value,
        measured_at=m_in.measured_at,
        source=m_in.source.value,
        quality_status="VALID",
        notes=m_in.notes
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)

    log_audit_event(
        db=db,
        action="INGEST_MEASUREMENT",
        resource_type="measurements",
        user_id=user_id,
        resource_id=measurement.id,
        client_ip=client_ip,
        details={"metric_type": m_in.metric_type.value, "unit": m_in.unit.value}
    )
    return measurement


def list_measurements(
    db: Session,
    user_id: str,
    metric_type: Optional[MetricType] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Measurement]:
    """Lists clinical measurements strictly scoped to user_id."""
    query = db.query(Measurement).filter(Measurement.user_id == user_id)
    if metric_type:
        query = query.filter(Measurement.metric_type == metric_type.value)
    return query.order_by(Measurement.measured_at.desc()).offset(offset).limit(limit).all()


def get_measurement_by_id(db: Session, user_id: str, measurement_id: str) -> Measurement:
    """Retrieves a measurement ensuring user ownership."""
    m = db.query(Measurement).filter(
        Measurement.id == measurement_id,
        Measurement.user_id == user_id
    ).first()
    if not m:
        raise ResourceNotFoundException("Measurement", measurement_id)
    return m


def delete_measurement(db: Session, user_id: str, measurement_id: str, client_ip: Optional[str] = None) -> None:
    """Deletes a measurement ensuring user ownership."""
    m = get_measurement_by_id(db, user_id, measurement_id)
    db.delete(m)
    db.commit()

    log_audit_event(
        db=db,
        action="DELETE_MEASUREMENT",
        resource_type="measurements",
        user_id=user_id,
        resource_id=measurement_id,
        client_ip=client_ip
    )


# ---------------------------------------------------------
# Physical Activity (Steps, Active Minutes, Distance)
# ---------------------------------------------------------

def upsert_activity_record(
    db: Session,
    user_id: str,
    act_in: ActivityCreate,
    client_ip: Optional[str] = None
) -> ActivityRecord:
    """Creates or updates a daily activity record after checking DEVICE_TELEMETRY consent."""
    if not check_user_consent(db, user_id, "DEVICE_TELEMETRY"):
        raise ConsentRequiredException("DEVICE_TELEMETRY")

    existing = db.query(ActivityRecord).filter(
        ActivityRecord.user_id == user_id,
        ActivityRecord.recorded_date == act_in.recorded_date
    ).first()

    if existing:
        existing.step_count = act_in.step_count
        existing.active_minutes = act_in.active_minutes
        existing.active_calories_kcal = act_in.active_calories_kcal
        existing.distance_meters = act_in.distance_meters
        existing.source = act_in.source
        existing.sync_timestamp = datetime.now(timezone.utc)
        record = existing
    else:
        record = ActivityRecord(
            user_id=user_id,
            recorded_date=act_in.recorded_date,
            step_count=act_in.step_count,
            active_minutes=act_in.active_minutes,
            active_calories_kcal=act_in.active_calories_kcal,
            distance_meters=act_in.distance_meters,
            source=act_in.source
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        action="UPSERT_ACTIVITY",
        resource_type="activity_records",
        user_id=user_id,
        resource_id=record.id,
        client_ip=client_ip,
        details={"recorded_date": str(act_in.recorded_date), "step_count": act_in.step_count}
    )
    return record


def list_activity_records(
    db: Session,
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100
) -> List[ActivityRecord]:
    """Lists activity records strictly scoped to user_id."""
    query = db.query(ActivityRecord).filter(ActivityRecord.user_id == user_id)
    if start_date:
        query = query.filter(ActivityRecord.recorded_date >= start_date)
    if end_date:
        query = query.filter(ActivityRecord.recorded_date <= end_date)
    return query.order_by(ActivityRecord.recorded_date.desc()).limit(limit).all()


# ---------------------------------------------------------
# Sleep Sessions (Duration, Architecture)
# ---------------------------------------------------------

def create_sleep_record(
    db: Session,
    user_id: str,
    sleep_in: SleepCreate,
    client_ip: Optional[str] = None
) -> SleepRecord:
    """Logs a sleep record after checking DEVICE_TELEMETRY consent."""
    if not check_user_consent(db, user_id, "DEVICE_TELEMETRY"):
        raise ConsentRequiredException("DEVICE_TELEMETRY")

    record = SleepRecord(
        user_id=user_id,
        sleep_date=sleep_in.sleep_date,
        start_time=sleep_in.start_time,
        end_time=sleep_in.end_time,
        duration_minutes=sleep_in.duration_minutes,
        deep_minutes=sleep_in.deep_minutes,
        rem_minutes=sleep_in.rem_minutes,
        light_minutes=sleep_in.light_minutes,
        quality_rating=sleep_in.quality_rating,
        source=sleep_in.source
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        action="CREATE_SLEEP_RECORD",
        resource_type="sleep_records",
        user_id=user_id,
        resource_id=record.id,
        client_ip=client_ip,
        details={"sleep_date": str(sleep_in.sleep_date), "duration_minutes": sleep_in.duration_minutes}
    )
    return record


def list_sleep_records(
    db: Session,
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100
) -> List[SleepRecord]:
    """Lists sleep records strictly scoped to user_id."""
    query = db.query(SleepRecord).filter(SleepRecord.user_id == user_id)
    if start_date:
        query = query.filter(SleepRecord.sleep_date >= start_date)
    if end_date:
        query = query.filter(SleepRecord.sleep_date <= end_date)
    return query.order_by(SleepRecord.sleep_date.desc()).limit(limit).all()


# ---------------------------------------------------------
# Data Portability & Right to be Forgotten (GDPR Art. 17/20)
# ---------------------------------------------------------

def export_all_user_data(db: Session, user: User, client_ip: Optional[str] = None) -> Dict[str, Any]:
    """Assembles all personal health records and metadata for machine-readable export."""
    measurements = db.query(Measurement).filter(Measurement.user_id == user.id).all()
    activities = db.query(ActivityRecord).filter(ActivityRecord.user_id == user.id).all()
    sleep = db.query(SleepRecord).filter(SleepRecord.user_id == user.id).all()
    consents = db.query(ConsentRecord).filter(ConsentRecord.user_id == user.id).all()
    profile = db.query(ClinicalProfile).filter(ClinicalProfile.user_id == user.id).first()

    payload = {
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "user_profile": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat()
        },
        "clinical_profile": {
            "date_of_birth": str(profile.date_of_birth) if profile and profile.date_of_birth else None,
            "biological_sex": profile.biological_sex if profile else None,
            "height_cm": profile.height_cm if profile else None,
            "family_history_diabetes": profile.family_history_diabetes if profile else False,
            "personal_history_hypertension": profile.personal_history_hypertension if profile else False,
            "gestational_diabetes": profile.gestational_diabetes if profile else False,
            "smoking_status": profile.smoking_status if profile else "NEVER",
            "alcohol_intake": profile.alcohol_intake if profile else "NONE"
        } if profile else None,
        "consents": [
            {
                "domain": c.consent_domain,
                "is_granted": c.is_granted,
                "policy_version": c.policy_version,
                "granted_at": c.granted_at.isoformat() if c.granted_at else None,
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None
            } for c in consents
        ],
        "measurements": [
            {
                "id": m.id,
                "metric_type": m.metric_type,
                "value_numeric": m.value_numeric,
                "secondary_numeric": m.secondary_numeric,
                "unit": m.unit,
                "measured_at": m.measured_at.isoformat(),
                "source": m.source,
                "quality_status": m.quality_status,
                "notes": m.notes
            } for m in measurements
        ],
        "activities": [
            {
                "id": a.id,
                "recorded_date": str(a.recorded_date),
                "step_count": a.step_count,
                "active_minutes": a.active_minutes,
                "active_calories_kcal": a.active_calories_kcal,
                "distance_meters": a.distance_meters,
                "source": a.source
            } for a in activities
        ],
        "sleep_records": [
            {
                "id": s.id,
                "sleep_date": str(s.sleep_date),
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "duration_minutes": s.duration_minutes,
                "deep_minutes": s.deep_minutes,
                "rem_minutes": s.rem_minutes,
                "light_minutes": s.light_minutes,
                "quality_rating": s.quality_rating,
                "source": s.source
            } for s in sleep
        ]
    }

    log_audit_event(
        db=db,
        action="EXPORT_FULL_DATA",
        resource_type="users",
        user_id=user.id,
        resource_id=user.id,
        client_ip=client_ip
    )
    return payload


def delete_user_account_permanently(db: Session, user: User, client_ip: Optional[str] = None) -> None:
    """Executes GDPR Article 17 Right to be Forgotten by cascading hard-deleting the user account."""
    user_id = user.id
    email = user.email

    # Log audit event before user record deletion
    log_audit_event(
        db=db,
        action="DELETE_ACCOUNT_PURGE",
        resource_type="users",
        user_id=user_id,
        resource_id=user_id,
        client_ip=client_ip,
        details={"status": "INITIATING_PURGE"}
    )

    # Deleting the user row will automatically trigger cascading deletion across
    # measurements, activity_records, sleep_records, consent_records, and clinical_profiles
    db.delete(user)
    db.commit()
