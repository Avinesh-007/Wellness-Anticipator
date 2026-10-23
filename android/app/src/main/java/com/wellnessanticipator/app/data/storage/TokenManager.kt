package com.wellnessanticipator.app.data.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

object TokenManager {
    private const val PREF_NAME = "wellness_secure_prefs"
    private const val KEY_AUTH_TOKEN = "jwt_auth_token"
    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                PREF_NAME,
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to standard private preferences if keystore is unavailable in some emulator versions
            context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun clearToken() {
        prefs.edit().remove(KEY_AUTH_TOKEN).apply()
    }

    fun hasToken(): Boolean {
        return !getToken().isNullOrBlank()
    }
}
