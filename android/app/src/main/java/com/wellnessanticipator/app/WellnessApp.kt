package com.wellnessanticipator.app

import android.app.Application
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.storage.TokenManager

class WellnessApp : Application() {
    companion object {
        lateinit var instance: WellnessApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        TokenManager.init(this)
        ApiClient.init(this)
    }
}
