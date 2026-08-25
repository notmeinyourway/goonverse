package com.goonverse.app.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.goonverse.app.data.models.UserProfileDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

class EncryptedSessionManager(context: Context) {

    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = try {
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILENAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        context.deleteSharedPreferences(PREFS_FILENAME)
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILENAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private val gson = Gson()

    private val _isAuthenticated = MutableStateFlow(!getAccessToken().isNullOrEmpty())
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    fun saveTokens(accessToken: String, refreshToken: String) {
        sharedPreferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
        _isAuthenticated.value = true
    }

    fun getAccessToken(): String? {
        return sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }

    fun getRefreshToken(): String? {
        return sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }

    fun saveUserProfile(user: UserProfileDto) {
        sharedPreferences.edit()
            .putString(KEY_USER_PROFILE, gson.toJson(user))
            .apply()
    }

    fun getUserProfile(): UserProfileDto? {
        val json = sharedPreferences.getString(KEY_USER_PROFILE, null) ?: return null
        return try {
            gson.fromJson(json, UserProfileDto::class.java)
        } catch (e: Exception) {
            null
        }
    }

    // --- App Lock & PIN (Salted SHA-256) ---

    fun setAppLockPin(pin: String?) {
        if (pin.isNullOrBlank()) {
            sharedPreferences.edit()
                .remove(KEY_APP_LOCK_PIN_HASH)
                .remove(KEY_APP_LOCK_PIN_SALT)
                .apply()
        } else {
            val salt = ByteArray(16)
            SecureRandom().nextBytes(salt)
            val saltBase64 = android.util.Base64.encodeToString(salt, android.util.Base64.NO_WRAP)
            val hash = hashPin(pin, salt)

            sharedPreferences.edit()
                .putString(KEY_APP_LOCK_PIN_HASH, hash)
                .putString(KEY_APP_LOCK_PIN_SALT, saltBase64)
                .apply()
        }
    }

    fun isAppLockEnabled(): Boolean {
        return !sharedPreferences.getString(KEY_APP_LOCK_PIN_HASH, null).isNullOrEmpty()
    }

    fun verifyAppLockPin(pin: String): Boolean {
        val storedHash = sharedPreferences.getString(KEY_APP_LOCK_PIN_HASH, null) ?: return false
        val storedSaltBase64 = sharedPreferences.getString(KEY_APP_LOCK_PIN_SALT, null) ?: return false
        val salt = android.util.Base64.decode(storedSaltBase64, android.util.Base64.NO_WRAP)
        val calculatedHash = hashPin(pin, salt)
        return storedHash == calculatedHash
    }

    private fun hashPin(pin: String, salt: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        digest.update(salt)
        val hash = digest.digest(pin.toByteArray(Charsets.UTF_8))
        return android.util.Base64.encodeToString(hash, android.util.Base64.NO_WRAP)
    }

    // --- Security Preferences ---

    fun isBiometricsEnabled(): Boolean {
        return sharedPreferences.getBoolean(KEY_BIOMETRICS_ENABLED, false)
    }

    fun setBiometricsEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean(KEY_BIOMETRICS_ENABLED, enabled).apply()
    }

    fun isScreenshotProtectionEnabled(): Boolean {
        return sharedPreferences.getBoolean(KEY_SCREENSHOT_PROTECTION, true)
    }

    fun setScreenshotProtectionEnabled(enabled: Boolean) {
        sharedPreferences.edit().putBoolean(KEY_SCREENSHOT_PROTECTION, enabled).apply()
    }

    /**
     * Auto lock timeout in seconds (0 = immediately, 60 = 1m, 300 = 5m, 900 = 15m, -1 = never)
     */
    fun getAutoLockTimeoutSeconds(): Int {
        return sharedPreferences.getInt(KEY_AUTO_LOCK_TIMEOUT, 60)
    }

    fun setAutoLockTimeoutSeconds(seconds: Int) {
        sharedPreferences.edit().putInt(KEY_AUTO_LOCK_TIMEOUT, seconds).apply()
    }

    fun clearSession() {
        sharedPreferences.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_USER_PROFILE)
            .apply()
        _isAuthenticated.value = false
    }

    companion object {
        private const val PREFS_FILENAME = "goonverse_secure_prefs"
        private const val KEY_ACCESS_TOKEN = "jwt_access_token"
        private const val KEY_REFRESH_TOKEN = "jwt_refresh_token"
        private const val KEY_USER_PROFILE = "cached_user_profile"
        private const val KEY_APP_LOCK_PIN_HASH = "app_lock_pin_hash_v2"
        private const val KEY_APP_LOCK_PIN_SALT = "app_lock_pin_salt_v2"
        private const val KEY_BIOMETRICS_ENABLED = "pref_biometrics_enabled"
        private const val KEY_SCREENSHOT_PROTECTION = "pref_screenshot_protection"
        private const val KEY_AUTO_LOCK_TIMEOUT = "pref_auto_lock_timeout"
    }
}
