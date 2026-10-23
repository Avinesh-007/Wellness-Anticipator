package com.wellnessanticipator.app.data.api

import android.content.Context
import android.os.Build
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)
    }

    private fun getDefaultBaseUrl(): String {
        return if (isEmulator()) {
            "http://10.0.2.2:8000/api/v1/"
        } else {
            "http://127.0.0.1:8000/api/v1/"
        }
    }

    private var baseUrl: String = "http://10.0.2.2:8000/api/v1/"

    private lateinit var retrofit: Retrofit
    lateinit var service: WellnessApiService
        private set

    fun init(context: Context, customUrl: String? = null) {
        baseUrl = if (!customUrl.isNullOrBlank()) {
            customUrl
        } else {
            getDefaultBaseUrl()
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
