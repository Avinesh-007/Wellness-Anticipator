package com.wellnessanticipator.app.data.api

import com.wellnessanticipator.app.data.storage.TokenManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = TokenManager.getToken()

        val requestBuilder = original.newBuilder()
        if (!token.isNullOrBlank()) {
            requestBuilder.header("Authorization", "Bearer $token")
        }
        requestBuilder.header("Accept", "application/json")
        requestBuilder.header("Content-Type", "application/json")

        return chain.proceed(requestBuilder.build())
    }
}
