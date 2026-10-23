export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ConsentRecord {
  id: string;
  consent_domain: 'CLINICAL_MEASUREMENTS' | 'DEVICE_TELEMETRY' | 'USAGE_STATS' | 'RESEARCH_ANALYTICS';
  is_granted: boolean;
  policy_version: string;
  granted_at: string;
  revoked_at?: string | null;
}

export interface ClinicalProfile {
  id: string;
  user_id: string;
  date_of_birth?: string | null;
  age?: number | null;
  biological_sex?: string | null;
  height_cm?: number | null;
  family_history_diabetes: boolean;
  personal_history_hypertension: boolean;
  gestational_diabetes: boolean;
  smoking_status: string;
  alcohol_intake: string;
  updated_at: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  metric_type: 'BLOOD_PRESSURE' | 'FASTING_GLUCOSE' | 'HBA1C' | 'WEIGHT' | 'RESTING_HEART_RATE';
  value_numeric: number;
  secondary_numeric?: number | null;
  unit: string;
  measured_at: string;
  source: string;
  quality_status: string;
  notes?: string | null;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  user_id: string;
  recorded_date: string;
  step_count: number;
  active_minutes: number;
  active_calories_kcal: number;
  distance_meters: number;
  source: string;
  sync_timestamp: string;
}

export interface SleepRecord {
  id: string;
  user_id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  deep_minutes?: number | null;
  rem_minutes?: number | null;
  light_minutes?: number | null;
  quality_rating?: number | null;
  source: string;
  sync_timestamp: string;
}

export interface MetricBaseline {
  metric_name: string;
  window_days: number;
  data_quality_status: 'SUFFICIENT' | 'INSUFFICIENT_DATA';
  sample_count: number;
  missing_days: number;
  coverage_percentage: number;
  mean?: number | null;
  std_dev?: number | null;
  ewma?: number | null;
  latest_value?: number | null;
  z_score?: number | null;
  trend_direction: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
  notes: string;
}

export interface AnomalyAlert {
  metric_name: string;
  severity: 'INFO' | 'WARNING' | 'URGENT_CLINICAL';
  alert_type: string;
  message: string;
  observed_value: number;
  baseline_value?: number | null;
  action_guidance: string;
}

export interface TrendsSummaryResponse {
  analysis_timestamp: string;
  window_days: number;
  metrics: {
    steps: MetricBaseline;
    sleep_duration: MetricBaseline;
    systolic_bp: MetricBaseline;
    diastolic_bp: MetricBaseline;
  };
  anomalies: AnomalyAlert[];
  telemetry_governance_disclaimer: string;
}

export interface ContributingFactor {
  feature_name: string;
  impact: 'POSITIVE_RISK' | 'PROTECTIVE' | 'NEUTRAL';
  relative_weight: number;
  plain_language_explanation: string;
}

export interface ADAClinicalScore {
  tool_name: string;
  points: number;
  max_points: number;
  threshold_increased_risk: number;
  risk_category: 'LOW_TO_MODERATE_RISK' | 'HIGH_RISK';
  score_breakdown: Record<string, number>;
  clinical_guidance: string;
}

export interface StatisticalScreeningModel {
  model_version: string;
  model_architecture: string;
  calibrated_screening_probability: number;
  risk_tier: 'LOW_SCREENING_RISK' | 'AVERAGE_POPULATION_RISK' | 'MODERATE_SCREENING_RISK' | 'ELEVATED_SCREENING_RISK';
  intended_prediction_target: string;
}

export interface DiabetesAssessmentResponse {
  assessment_type: string;
  assessment_timestamp: string;
  input_summary: {
    age: number;
    biological_sex?: string | null;
    height_cm: number;
    weight_kg: number;
    computed_bmi: number;
    family_history_diabetes: boolean;
    personal_history_hypertension: boolean;
    gestational_diabetes: boolean;
    smoking_status: string;
    physically_active: boolean;
    recent_14d_average_steps?: number | null;
  };
  ada_clinical_score: ADAClinicalScore;
  statistical_screening_model: StatisticalScreeningModel;
  contributing_factors: ContributingFactor[];
  safety_escalations: Array<{
    severity: string;
    message: string;
    guidance: string;
  }>;
  clinical_limitations_and_disclaimer: {
    intended_population: string;
    screening_nature: string;
    medical_escalation_guidance: string;
  };
}

export interface PreventiveRecommendation {
  id?: number;
  category: 'PHYSICAL_ACTIVITY' | 'NUTRITION' | 'SLEEP' | 'CLINICAL_SCREENING' | 'STRESS_MANAGEMENT' | string;
  title: string;
  target_action: string;
  rationale: string;
  guideline_source: string;
  difficulty: 'EASY' | 'MODERATE' | 'ACHIEVABLE' | string;
  is_adopted_into_habit?: boolean;
  adopted_habit_id?: number | null;
}

export interface Habit {
  id: number;
  user_id: string;
  title: string;
  category: string;
  target_action: string;
  frequency: string;
  target_value?: number | null;
  target_unit?: string | null;
  schedule_time?: string | null;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  paused_at?: string | null;
  completed_today: boolean;
  today_status?: string | null;
  seven_day_consistency_pct: number;
}

export interface HabitCreateRequest {
  title: string;
  category?: string;
  target_action: string;
  frequency?: string;
  target_value?: number | null;
  target_unit?: string | null;
  schedule_time?: string | null;
  difficulty?: string;
}

export interface HabitLogRequest {
  log_date?: string;
  status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED';
  value_achieved?: number | null;
  notes?: string | null;
  reason_missed?: string | null;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  user_id: string;
  log_date: string;
  status: string;
  value_achieved?: number | null;
  notes?: string | null;
  reason_missed?: string | null;
  logged_at: string;
}

export interface HabitAdherenceSummary {
  total_active_habits: number;
  completed_today_count: number;
  today_completion_rate: number;
  seven_day_consistency_rate: number;
  thirty_day_consistency_rate: number;
  supportive_feedback: string;
  recovery_recommendation?: string | null;
  category_breakdown: Record<string, number>;
}

export interface PlanItem {
  id: number;
  plan_id: number;
  category: string;
  title: string;
  target_action: string;
  rationale: string;
  guideline_source: string;
  difficulty: string;
  is_adopted_into_habit: boolean;
  adopted_habit_id?: number | null;
}

export interface PreventivePlan {
  id: number;
  user_id: string;
  title: string;
  status: string;
  review_period_days: number;
  created_at: string;
  updated_at: string;
  items: PlanItem[];
}

export interface WellbeingCheckIn {
  id: number;
  user_id: string;
  recorded_date: string;
  mood_score: number;
  stress_level: 'LOW' | 'MODERATE' | 'HIGH' | string;
  energy_level: number;
  sleep_perceived_quality?: string | null;
  reflection_notes?: string | null;
  created_at: string;
}

export interface WellbeingCheckInRequest {
  recorded_date?: string;
  mood_score: number;
  stress_level: string;
  energy_level: number;
  sleep_perceived_quality?: string | null;
  reflection_notes?: string | null;
}

export interface WellbeingTrendsSummary {
  window_days: number;
  total_checkins: number;
  coverage_percentage: number;
  average_mood?: number | null;
  average_energy?: number | null;
  predominant_stress_level?: string | null;
  stress_distribution: Record<string, number>;
  recent_checkins: WellbeingCheckIn[];
  clinical_boundary_notice: string;
}
