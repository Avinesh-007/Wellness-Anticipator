package com.wellnessanticipator.app.data.api

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    // Android emulator alias for host machine's localhost:8000
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:8000/api/v1/"
    private var baseUrl: String = DEFAULT_BASE_URL

    private lateinit var retrofit: Retrofit
    lateinit var service: WellnessApiService
        private set

    fun init(context: Context, customUrl: String? = null) {
        if (!customUrl.isNullOrBlank()) {
            baseUrl = customUrl
        }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()

        retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        service = retrofit.create(WellnessApiService::class.java)
    }

    fun getBaseUrl(): String = baseUrl
}
