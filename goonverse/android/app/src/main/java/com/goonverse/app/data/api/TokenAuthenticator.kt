package com.goonverse.app.data.api

import com.google.gson.Gson
import com.goonverse.app.data.models.AuthResponseDto
import com.goonverse.app.data.models.RefreshTokenRequest
import com.goonverse.app.security.EncryptedSessionManager
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class TokenAuthenticator(
    private val sessionManager: EncryptedSessionManager,
    private val baseUrl: String
) : Authenticator {

    private val gson = Gson()

    override fun authenticate(route: Route?, response: Response): Request? {
        // Prevent infinite loops by checking retry count
        if (responseCount(response) >= 2) {
            sessionManager.clearSession()
            return null
        }

        // Do not attempt to refresh if the 401 came from the refresh endpoint itself
        if (response.request.url.encodedPath.contains("/auth/refresh")) {
            sessionManager.clearSession()
            return null
        }

        synchronized(this) {
            val currentToken = sessionManager.getAccessToken()
            val authHeader = response.request.header("Authorization")

            // If another thread already refreshed the token, retry with updated token
            if (authHeader != null && currentToken != null && authHeader != "Bearer $currentToken") {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $currentToken")
                    .build()
            }

            val refreshToken = sessionManager.getRefreshToken()
            if (refreshToken.isNullOrEmpty()) {
                sessionManager.clearSession()
                return null
            }

            // Perform synchronous refresh call
            val refreshSuccess = performTokenRefresh(refreshToken)
            if (refreshSuccess) {
                val newToken = sessionManager.getAccessToken()
                if (!newToken.isNullOrEmpty()) {
                    return response.request.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()
                }
            }

            // Refresh failed or revoked: clear session
            sessionManager.clearSession()
            return null
        }
    }

    private fun performTokenRefresh(refreshToken: String): Boolean {
        return try {
            val client = OkHttpClient.Builder().build()
            val requestBody = gson.toJson(RefreshTokenRequest(refreshToken))
                .toRequestBody("application/json; charset=utf-8".toMediaType())

            val refreshUrl = if (baseUrl.endsWith("/")) "${baseUrl}auth/refresh" else "$baseUrl/auth/refresh"

            val request = Request.Builder()
                .url(refreshUrl)
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val bodyString = response.body?.string() ?: return false
                val authResponse = gson.fromJson(bodyString, AuthResponseDto::class.java)
                sessionManager.saveTokens(authResponse.accessToken, authResponse.refreshToken)
                sessionManager.saveUserProfile(authResponse.user)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var prior = response.priorResponse
        while (prior != null) {
            result++
            prior = prior.priorResponse
        }
        return result
    }
}
