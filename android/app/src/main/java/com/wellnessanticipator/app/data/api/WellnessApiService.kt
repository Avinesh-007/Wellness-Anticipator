package com.wellnessanticipator.app.data.api

import com.wellnessanticipator.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface WellnessApiService {

    // Authentication
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<User>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getMe(): Response<User>

    // Consent
    @GET("consent/")
    suspend fun getConsents(): Response<ConsentsResponse>

    @POST("consent/")
    suspend fun updateConsent(@Body request: ConsentUpdateRequest): Response<ConsentRecord>

    // Clinical Profile
    @GET("users/profile")
    suspend fun getProfile(): Response<ClinicalProfile>

    @PUT("users/profile")
    suspend fun updateProfile(@Body request: ProfileUpdateRequest): Response<ClinicalProfile>

    // Measurements
    @GET("measurements/")
    suspend fun getMeasurements(@Query("metric_type") metricType: String? = null): Response<List<Measurement>>

    @POST("measurements/")
    suspend fun createMeasurement(@Body request: MeasurementCreateRequest): Response<Measurement>

    @DELETE("measurements/{id}")
    suspend fun deleteMeasurement(@Path("id") id: String): Response<Unit>

    // Activity & Sleep
    @GET("activities/")
    suspend fun getActivities(): Response<List<ActivityRecord>>

    @POST("activities/")
    suspend fun createActivity(@Body request: ActivityCreateRequest): Response<ActivityRecord>

    @GET("sleep/")
    suspend fun getSleepRecords(): Response<List<SleepRecord>>

    // Longitudinal Trends
    @GET("trends/summary")
    suspend fun getTrendsSummary(@Query("window") windowDays: Int = 14): Response<TrendsSummaryResponse>

    // Assessments
    @GET("assessments/diabetes")
    suspend fun getDiabetesAssessment(): Response<DiabetesAssessmentResponse>

    @POST("assessments/diabetes")
    suspend fun runDiabetesAssessment(@Body overrides: Map<String, Any> = emptyMap()): Response<DiabetesAssessmentResponse>

    // Recommendations
    @GET("recommendations/")
    suspend fun getRecommendations(): Response<RecommendationsResponse>

    // Habits & Consistency
    @GET("habits/")
    suspend fun getHabits(@Query("include_inactive") includeInactive: Boolean = false): Response<List<HabitResponse>>

    @POST("habits/")
    suspend fun createHabit(@Body request: HabitCreateRequest): Response<HabitResponse>

    @POST("habits/{id}/log")
    suspend fun logHabit(@Path("id") id: Int, @Body request: HabitLogRequest): Response<Unit>

    @GET("habits/summary/adherence")
    suspend fun getHabitAdherence(): Response<HabitAdherenceSummary>

    // Preventive Plans
    @GET("plans/active")
    suspend fun getActivePlan(): Response<PreventivePlanResponse>

    @POST("plans/generate")
    suspend fun regeneratePlan(): Response<PreventivePlanResponse>

    @POST("plans/items/{id}/adopt")
    suspend fun adoptPlanItem(@Path("id") id: Int, @Body request: AdoptPlanItemRequest): Response<HabitResponse>

    // Subjective Wellbeing
    @POST("wellbeing/")
    suspend fun submitWellbeing(@Body request: WellbeingCheckInRequest): Response<WellbeingCheckInResponse>

    @GET("wellbeing/today")
    suspend fun getTodayWellbeing(): Response<WellbeingCheckInResponse?>
}
