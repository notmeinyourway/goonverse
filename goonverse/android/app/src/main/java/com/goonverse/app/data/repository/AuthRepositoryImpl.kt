package com.goonverse.app.data.repository

import com.goonverse.app.data.api.AuthApi
import com.goonverse.app.data.local.GoonverseDatabase
import com.goonverse.app.data.models.*
import com.goonverse.app.domain.model.User
import com.goonverse.app.domain.repository.AuthRepository
import com.goonverse.app.security.EncryptedSessionManager
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject

class AuthRepositoryImpl(
    private val authApi: AuthApi,
    private val sessionManager: EncryptedSessionManager,
    private val database: GoonverseDatabase
) : AuthRepository {

    override val isAuthenticated: Flow<Boolean> = sessionManager.isAuthenticated

    override suspend fun register(email: String, username: String, password: String): Result<User> {
        return try {
            val request = RegisterRequest(
                email = email.trim(),
                username = username.trim(),
                password = password,
                ageVerified = true,
                termsAccepted = true,
                privacyAccepted = true
            )
            val response = authApi.register(request)
            if (response.isSuccessful && response.body() != null) {
                val authData = response.body()!!
                sessionManager.saveTokens(authData.accessToken, authData.refreshToken)
                sessionManager.saveUserProfile(authData.user)
                Result.success(mapDtoToDomain(authData.user))
            } else {
                Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun login(identifier: String, password: String): Result<User> {
        return try {
            val request = LoginRequest(
                identifier = identifier.trim(),
                password = password
            )
            val response = authApi.login(request)
            if (response.isSuccessful && response.body() != null) {
                val authData = response.body()!!
                sessionManager.saveTokens(authData.accessToken, authData.refreshToken)
                sessionManager.saveUserProfile(authData.user)
                Result.success(mapDtoToDomain(authData.user))
            } else {
                Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            val refreshToken = sessionManager.getRefreshToken()
            try {
                authApi.logout(LogoutRequest(refreshToken))
            } catch (_: Exception) {
                // Ignore network failure on logout
            }
            sessionManager.clearSession()
            database.clearAllCache()
            Result.success(Unit)
        } catch (e: Exception) {
            sessionManager.clearSession()
            database.clearAllCache()
            Result.success(Unit)
        }
    }

    override suspend fun getMe(): Result<User> {
        return try {
            val response = authApi.getMe()
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                sessionManager.saveUserProfile(dto)
                Result.success(mapDtoToDomain(dto))
            } else {
                val cached = getCachedUser()
                if (cached != null) {
                    Result.success(cached)
                } else {
                    Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
                }
            }
        } catch (e: Exception) {
            val cached = getCachedUser()
            if (cached != null) Result.success(cached) else Result.failure(e)
        }
    }

    override suspend fun updateUsername(username: String): Result<User> {
        return try {
            val response = authApi.updateMe(UpdateUserRequest(username.trim()))
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                sessionManager.saveUserProfile(dto)
                Result.success(mapDtoToDomain(dto))
            } else {
                Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun changePassword(current: String, new: String): Result<Unit> {
        return try {
            val response = authApi.changePassword(ChangePasswordRequest(current, new))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteAccount(): Result<Unit> {
        return try {
            val response = authApi.deleteAccount()
            if (response.isSuccessful) {
                sessionManager.clearSession()
                database.clearAllCache()
                Result.success(Unit)
            } else {
                Result.failure(Exception(parseErrorMessage(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getCachedUser(): User? {
        val dto = sessionManager.getUserProfile() ?: return null
        return mapDtoToDomain(dto)
    }

    private fun mapDtoToDomain(dto: UserProfileDto): User {
        return User(
            id = dto.id,
            email = dto.email,
            username = dto.username,
            role = dto.role,
            ageVerified = dto.ageVerified,
            createdAt = dto.createdAt,
            updatedAt = dto.updatedAt,
            peopleCount = dto.counts?.people ?: 0,
            imageCount = dto.counts?.images ?: 0,
            activityCount = dto.counts?.activities ?: 0
        )
    }

    private fun parseErrorMessage(errorBody: String?): String {
        if (errorBody.isNullOrEmpty()) return "Unknown server error"
        return try {
            val json = JSONObject(errorBody)
            if (json.has("message")) {
                val msg = json.get("message")
                if (msg is org.json.JSONArray) {
                    val list = mutableListOf<String>()
                    for (i in 0 until msg.length()) list.add(msg.getString(i))
                    list.joinToString("\n")
                } else {
                    msg.toString()
                }
            } else {
                "Request failed (${json.optInt("statusCode", 400)})"
            }
        } catch (e: Exception) {
            "An error occurred"
        }
    }
}
