import {
  User,
  AuthResponse,
  ConsentRecord,
  ClinicalProfile,
  Measurement,
  ActivityRecord,
  SleepRecord,
  TrendsSummaryResponse,
  DiabetesAssessmentResponse,
  PreventiveRecommendation,
  Habit,
  HabitCreateRequest,
  HabitLogRequest,
  HabitAdherenceSummary,
  PreventivePlan,
  PlanItem,
  WellbeingCheckIn,
  WellbeingCheckInRequest,
  WellbeingTrendsSummary,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  errorCode: string;
  statusCode: number;
  details?: Array<{ field?: string; issue?: string }>;

  constructor(message: string, errorCode: string = 'UNKNOWN_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('wellness_auth_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('wellness_auth_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('wellness_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError('Network error. Unable to connect to server.', 'NETWORK_ERROR', 0);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.detail || 'An unexpected error occurred.';
    const errorCode = data.error_code || 'HTTP_ERROR';
    throw new ApiError(errorMsg, errorCode, response.status, data.details);
  }

  return data as T;
}

export const api = {
  // Authentication
  async register(payload: { email: string; password: string; full_name?: string }): Promise<User> {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  logout(): void {
    clearStoredToken();
  },

  // Consent
  async getConsents(): Promise<{ consents: ConsentRecord[] }> {
    return request<{ consents: ConsentRecord[] }>('/consent/');
  },

  async updateConsent(payload: { consent_domain: string; is_granted: boolean; policy_version?: string }): Promise<ConsentRecord> {
    return request<ConsentRecord>('/consent/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Clinical Profile
  async getProfile(): Promise<ClinicalProfile> {
    return request<ClinicalProfile>('/users/profile');
  },

  async updateProfile(payload: Partial<ClinicalProfile>): Promise<ClinicalProfile> {
    return request<ClinicalProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Measurements
  async getMeasurements(metricType?: string): Promise<Measurement[]> {
    const query = metricType ? `?metric_type=${encodeURIComponent(metricType)}` : '';
    return request<Measurement[]>(`/measurements/${query}`);
  },

  async createMeasurement(payload: {
    metric_type: string;
    value_numeric: number;
    secondary_numeric?: number | null;
    unit: string;
    measured_at: string;
    source?: string;
    notes?: string;
  }): Promise<Measurement> {
    return request<Measurement>('/measurements/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteMeasurement(id: string): Promise<void> {
    return request<void>(`/measurements/${id}`, {
      method: 'DELETE',
    });
  },

  // Physical Activity
  async getActivities(): Promise<ActivityRecord[]> {
    return request<ActivityRecord[]>('/activities/');
  },

  async createActivity(payload: {
    recorded_date: string;
    step_count: number;
    active_minutes?: number;
    active_calories_kcal?: number;
    distance_meters?: number;
    source?: string;
  }): Promise<ActivityRecord> {
    return request<ActivityRecord>('/activities/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Sleep
  async getSleepRecords(): Promise<SleepRecord[]> {
    return request<SleepRecord[]>('/sleep/');
  },

  async createSleep(payload: {
    sleep_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    deep_minutes?: number | null;
    rem_minutes?: number | null;
    light_minutes?: number | null;
    quality_rating?: number | null;
    source?: string;
  }): Promise<SleepRecord> {
    return request<SleepRecord>('/sleep/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Longitudinal Trends & Anomaly Alerts
  async getTrends(windowDays: number = 14): Promise<TrendsSummaryResponse> {
    return request<TrendsSummaryResponse>(`/trends/summary?window=${windowDays}`);
  },

  // Assessments
  async getDiabetesAssessment(): Promise<DiabetesAssessmentResponse> {
    return request<DiabetesAssessmentResponse>('/assessments/diabetes');
  },

  async runDiabetesAssessment(overrides?: Record<string, any>): Promise<DiabetesAssessmentResponse> {
    return request<DiabetesAssessmentResponse>('/assessments/diabetes', {
      method: 'POST',
      body: JSON.stringify(overrides || {}),
    });
  },

  // Recommendations
  async getRecommendations(): Promise<{ user_id: string; plan_id?: number; plan_title?: string; recommendations_count: number; recommendations: PreventiveRecommendation[] }> {
    return request<{ user_id: string; plan_id?: number; plan_title?: string; recommendations_count: number; recommendations: PreventiveRecommendation[] }>('/recommendations/');
  },

  // Daily Habits & Adherence Engine
  async getHabits(includeInactive: boolean = false): Promise<Habit[]> {
    return request<Habit[]>(`/habits/?include_inactive=${includeInactive}`);
  },

  async createHabit(payload: HabitCreateRequest): Promise<Habit> {
    return request<Habit>('/habits/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateHabit(habitId: number, payload: Partial<HabitCreateRequest> & { is_active?: boolean }): Promise<Habit> {
    return request<Habit>(`/habits/${habitId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteHabit(habitId: number): Promise<void> {
    return request<void>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  async logHabit(habitId: number, payload: HabitLogRequest): Promise<any> {
    return request<any>(`/habits/${habitId}/log`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getHabitAdherenceSummary(): Promise<HabitAdherenceSummary> {
    return request<HabitAdherenceSummary>('/habits/summary/adherence');
  },

  // Personalized Preventive Plans
  async getActivePlan(): Promise<PreventivePlan> {
    return request<PreventivePlan>('/plans/active');
  },

  async regeneratePlan(): Promise<PreventivePlan> {
    return request<PreventivePlan>('/plans/generate', {
      method: 'POST',
    });
  },

  async adoptPlanItem(itemId: number, payload: { schedule_time?: string; frequency?: string } = {}): Promise<Habit> {
    return request<Habit>(`/plans/items/${itemId}/adopt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Subjective Wellbeing Check-Ins
  async submitWellbeingCheckIn(payload: WellbeingCheckInRequest): Promise<WellbeingCheckIn> {
    return request<WellbeingCheckIn>('/wellbeing/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTodayWellbeing(): Promise<WellbeingCheckIn | null> {
    return request<WellbeingCheckIn | null>('/wellbeing/today');
  },

  async getWellbeingTrends(windowDays: number = 14): Promise<WellbeingTrendsSummary> {
    return request<WellbeingTrendsSummary>(`/wellbeing/trends?window_days=${windowDays}`);
  },

  // Data Export & Deletion
  async exportFullData(): Promise<any> {
    return request<any>('/export/full');
  },

  async deleteAccount(payload: { password: string; confirm_phrase: string }): Promise<void> {
    return request<void>('/export/account', {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  },
};

export { ApiError };
