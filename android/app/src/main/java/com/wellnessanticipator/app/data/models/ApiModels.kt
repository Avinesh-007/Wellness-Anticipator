package com.wellnessanticipator.app.data.models

import com.google.gson.annotations.SerializedName

// User & Auth
data class User(
    val id: String,
    val email: String,
    @SerializedName("full_name") val fullName: String?,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("created_at") val createdAt: String
)

data class AuthResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("expires_in") val expiresIn: Long
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    @SerializedName("full_name") val fullName: String? = null
)

// Consent
data class ConsentRecord(
    val id: String,
    @SerializedName("consent_domain") val consentDomain: String,
    @SerializedName("is_granted") val isGranted: Boolean,
    @SerializedName("policy_version") val policyVersion: String,
    @SerializedName("granted_at") val grantedAt: String,
    @SerializedName("revoked_at") val revokedAt: String?
)

data class ConsentUpdateRequest(
    @SerializedName("consent_domain") val consentDomain: String,
    @SerializedName("is_granted") val isGranted: Boolean,
    @SerializedName("policy_version") val policyVersion: String = "2026.1"
)

data class ConsentsResponse(
    val consents: List<ConsentRecord>
)

// Clinical Profile
data class ClinicalProfile(
    val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("date_of_birth") val dateOfBirth: String?,
    val age: Int?,
    @SerializedName("biological_sex") val biologicalSex: String?,
    @SerializedName("height_cm") val heightCm: Double?,
    @SerializedName("family_history_diabetes") val familyHistoryDiabetes: Boolean,
    @SerializedName("personal_history_hypertension") val personalHistoryHypertension: Boolean,
    @SerializedName("gestational_diabetes") val gestationalDiabetes: Boolean,
    @SerializedName("smoking_status") val smokingStatus: String?,
    @SerializedName("alcohol_intake") val alcoholIntake: String?,
    @SerializedName("updated_at") val updatedAt: String
)

data class ProfileUpdateRequest(
    @SerializedName("date_of_birth") val dateOfBirth: String? = null,
    @SerializedName("biological_sex") val biologicalSex: String? = null,
    @SerializedName("height_cm") val heightCm: Double? = null,
    @SerializedName("family_history_diabetes") val familyHistoryDiabetes: Boolean? = null,
    @SerializedName("personal_history_hypertension") val personalHistoryHypertension: Boolean? = null,
    @SerializedName("gestational_diabetes") val gestationalDiabetes: Boolean? = null,
    @SerializedName("smoking_status") val smokingStatus: String? = null,
    @SerializedName("alcohol_intake") val alcoholIntake: String? = null
)

// Measurements
data class Measurement(
    val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("metric_type") val metricType: String,
    @SerializedName("value_numeric") val valueNumeric: Double,
    @SerializedName("secondary_numeric") val secondaryNumeric: Double?,
    val unit: String,
    @SerializedName("measured_at") val measuredAt: String,
    val source: String,
    @SerializedName("quality_status") val qualityStatus: String,
    val notes: String?,
    @SerializedName("created_at") val createdAt: String
)

data class MeasurementCreateRequest(
    @SerializedName("metric_type") val metricType: String,
    @SerializedName("value_numeric") val valueNumeric: Double,
    @SerializedName("secondary_numeric") val secondaryNumeric: Double? = null,
    val unit: String,
    @SerializedName("measured_at") val measuredAt: String,
    val source: String = "MANUAL_ENTRY",
    val notes: String? = null
)

// Physical Activity & Sleep
data class ActivityRecord(
    val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("recorded_date") val recordedDate: String,
    @SerializedName("step_count") val stepCount: Int,
    @SerializedName("active_minutes") val activeMinutes: Int,
    @SerializedName("active_calories_kcal") val activeCaloriesKcal: Double,
    @SerializedName("distance_meters") val distanceMeters: Double,
    val source: String,
    @SerializedName("sync_timestamp") val syncTimestamp: String
)

data class ActivityCreateRequest(
    @SerializedName("recorded_date") val recordedDate: String,
    @SerializedName("step_count") val stepCount: Int,
    @SerializedName("active_minutes") val activeMinutes: Int = 0,
    @SerializedName("active_calories_kcal") val activeCaloriesKcal: Double = 0.0,
    @SerializedName("distance_meters") val distanceMeters: Double = 0.0,
    val source: String = "MANUAL_ENTRY"
)

data class SleepRecord(
    val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("sleep_date") val sleepDate: String,
    @SerializedName("start_time") val startTime: String,
    @SerializedName("end_time") val endTime: String,
    @SerializedName("duration_minutes") val durationMinutes: Int,
    @SerializedName("deep_minutes") val deepMinutes: Int?,
    @SerializedName("rem_minutes") val remMinutes: Int?,
    @SerializedName("light_minutes") val lightMinutes: Int?,
    @SerializedName("quality_rating") val qualityRating: Int?,
    val source: String,
    @SerializedName("sync_timestamp") val syncTimestamp: String
)

// Longitudinal Trends
data class MetricBaseline(
    @SerializedName("metric_name") val metricName: String,
    @SerializedName("window_days") val windowDays: Int,
    @SerializedName("data_quality_status") val dataQualityStatus: String,
    @SerializedName("sample_count") val sampleCount: Int,
    @SerializedName("missing_days") val missingDays: Int,
    @SerializedName("coverage_percentage") val coveragePercentage: Double,
    val mean: Double?,
    @SerializedName("std_dev") val stdDev: Double?,
    val ewma: Double?,
    @SerializedName("latest_value") val latestValue: Double?,
    @SerializedName("z_score") val zScore: Double?,
    @SerializedName("trend_direction") val trendDirection: String,
    val notes: String
)

data class AnomalyAlert(
    @SerializedName("metric_name") val metricName: String,
    val severity: String,
    @SerializedName("alert_type") val alertType: String,
    val message: String,
    @SerializedName("observed_value") val observedValue: Double,
    @SerializedName("baseline_value") val baselineValue: Double?,
    @SerializedName("action_guidance") val actionGuidance: String
)

data class TrendsMetrics(
    val steps: MetricBaseline,
    @SerializedName("sleep_duration") val sleepDuration: MetricBaseline,
    @SerializedName("systolic_bp") val systolicBp: MetricBaseline,
    @SerializedName("diastolic_bp") val diastolicBp: MetricBaseline
)

data class TrendsSummaryResponse(
    @SerializedName("analysis_timestamp") val analysisTimestamp: String,
    @SerializedName("window_days") val windowDays: Int,
    val metrics: TrendsMetrics,
    val anomalies: List<AnomalyAlert>,
    @SerializedName("telemetry_governance_disclaimer") val telemetryGovernanceDisclaimer: String
)

// Diabetes Assessment
data class ADAClinicalScore(
    @SerializedName("tool_name") val toolName: String,
    val points: Int,
    @SerializedName("max_points") val maxPoints: Int,
    @SerializedName("threshold_increased_risk") val thresholdIncreasedRisk: Int,
    @SerializedName("risk_category") val riskCategory: String,
    @SerializedName("score_breakdown") val scoreBreakdown: Map<String, Int>,
    @SerializedName("clinical_guidance") val clinicalGuidance: String
)

data class StatisticalScreeningModel(
    @SerializedName("model_version") val modelVersion: String,
    @SerializedName("model_architecture") val modelArchitecture: String,
    @SerializedName("calibrated_screening_probability") val calibratedScreeningProbability: Double,
    @SerializedName("risk_tier") val riskTier: String,
    @SerializedName("intended_prediction_target") val intendedPredictionTarget: String
)

data class ContributingFactor(
    @SerializedName("feature_name") val featureName: String,
    val impact: String,
    @SerializedName("relative_weight") val relativeWeight: Double,
    @SerializedName("plain_language_explanation") val plainLanguageExplanation: String
)

data class SafetyEscalation(
    val severity: String,
    val message: String,
    val guidance: String
)

data class ClinicalLimitations(
    @SerializedName("intended_population") val intendedPopulation: String,
    @SerializedName("screening_nature") val screeningNature: String,
    @SerializedName("medical_escalation_guidance") val medicalEscalationGuidance: String
)

data class AssessmentInputSummary(
    val age: Int,
    @SerializedName("biological_sex") val biologicalSex: String?,
    @SerializedName("height_cm") val heightCm: Double,
    @SerializedName("weight_kg") val weightKg: Double,
    @SerializedName("computed_bmi") val computedBmi: Double,
    @SerializedName("family_history_diabetes") val familyHistoryDiabetes: Boolean,
    @SerializedName("personal_history_hypertension") val personalHistoryHypertension: Boolean,
    @SerializedName("gestational_diabetes") val gestationalDiabetes: Boolean,
    @SerializedName("smoking_status") val smokingStatus: String?,
    @SerializedName("physically_active") val physicallyActive: Boolean,
    @SerializedName("recent_14d_average_steps") val recent14dAverageSteps: Double?
)

data class DiabetesAssessmentResponse(
    @SerializedName("assessment_type") val assessmentType: String,
    @SerializedName("assessment_timestamp") val assessmentTimestamp: String,
    @SerializedName("input_summary") val inputSummary: AssessmentInputSummary,
    @SerializedName("ada_clinical_score") val adaClinicalScore: ADAClinicalScore,
    @SerializedName("statistical_screening_model") val statisticalScreeningModel: StatisticalScreeningModel,
    @SerializedName("contributing_factors") val contributingFactors: List<ContributingFactor>,
    @SerializedName("safety_escalations") val safetyEscalations: List<SafetyEscalation>,
    @SerializedName("clinical_limitations_and_disclaimer") val clinicalLimitations: ClinicalLimitations
)

// Recommendations
data class PreventiveRecommendation(
    val category: String,
    val title: String,
    @SerializedName("target_action") val targetAction: String,
    val rationale: String,
    @SerializedName("guideline_source") val guidelineSource: String,
    val difficulty: String
)

data class RecommendationsResponse(
    @SerializedName("user_id") val userId: String,
    @SerializedName("recommendations_count") val recommendationsCount: Int,
    val recommendations: List<PreventiveRecommendation>
)

// Daily Habits & Adherence Models
data class HabitResponse(
    val id: Int,
    @SerializedName("user_id") val userId: String,
    val title: String,
    val category: String,
    @SerializedName("target_action") val targetAction: String,
    val frequency: String,
    @SerializedName("target_value") val targetValue: Double?,
    @SerializedName("target_unit") val targetUnit: String?,
    @SerializedName("schedule_time") val scheduleTime: String?,
    val difficulty: String,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("completed_today") val completedToday: Boolean,
    @SerializedName("today_status") val todayStatus: String?,
    @SerializedName("seven_day_consistency_pct") val sevenDayConsistencyPct: Double
)

data class HabitCreateRequest(
    val title: String,
    val category: String = "PHYSICAL_ACTIVITY",
    @SerializedName("target_action") val targetAction: String,
    val frequency: String = "DAILY",
    @SerializedName("schedule_time") val scheduleTime: String? = null,
    val difficulty: String = "ACHIEVABLE"
)

data class HabitLogRequest(
    @SerializedName("log_date") val logDate: String? = null,
    val status: String,
    @SerializedName("value_achieved") val valueAchieved: Double? = null,
    val notes: String? = null
)

data class HabitAdherenceSummary(
    @SerializedName("total_active_habits") val totalActiveHabits: Int,
    @SerializedName("completed_today_count") val completedTodayCount: Int,
    @SerializedName("today_completion_rate") val todayCompletionRate: Double,
    @SerializedName("seven_day_consistency_rate") val sevenDayConsistencyRate: Double,
    @SerializedName("thirty_day_consistency_rate") val thirtyDayConsistencyRate: Double,
    @SerializedName("supportive_feedback") val supportiveFeedback: String,
    @SerializedName("recovery_recommendation") val recoveryRecommendation: String?
)

// Preventive Plan Models
data class PlanItemResponse(
    val id: Int,
    @SerializedName("plan_id") val planId: Int,
    val category: String,
    val title: String,
    @SerializedName("target_action") val targetAction: String,
    val rationale: String,
    @SerializedName("guideline_source") val guidelineSource: String,
    val difficulty: String,
    @SerializedName("is_adopted_into_habit") val isAdoptedIntoHabit: Boolean,
    @SerializedName("adopted_habit_id") val adoptedHabitId: Int?
)

data class PreventivePlanResponse(
    val id: Int,
    @SerializedName("user_id") val userId: String,
    val title: String,
    val status: String,
    @SerializedName("review_period_days") val reviewPeriodDays: Int,
    val items: List<PlanItemResponse>
)

data class AdoptPlanItemRequest(
    @SerializedName("schedule_time") val scheduleTime: String? = "Daily Routine",
    val frequency: String = "DAILY"
)

// Subjective Wellbeing Check-In Models
data class WellbeingCheckInRequest(
    @SerializedName("recorded_date") val recordedDate: String? = null,
    @SerializedName("mood_score") val moodScore: Int,
    @SerializedName("stress_level") val stressLevel: String,
    @SerializedName("energy_level") val energyLevel: Int,
    @SerializedName("reflection_notes") val reflectionNotes: String? = null
)

data class WellbeingCheckInResponse(
    val id: Int,
    @SerializedName("user_id") val userId: String,
    @SerializedName("recorded_date") val recordedDate: String,
    @SerializedName("mood_score") val moodScore: Int,
    @SerializedName("stress_level") val stressLevel: String,
    @SerializedName("energy_level") val energyLevel: Int,
    @SerializedName("reflection_notes") val reflectionNotes: String?
)
