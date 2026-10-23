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
}
