package com.goonverse.app.data.models

import com.google.gson.annotations.SerializedName

data class RegisterRequest(
    @SerializedName("email") val email: String,
    @SerializedName("username") val username: String,
    @SerializedName("password") val password: String,
    @SerializedName("age_verified") val ageVerified: Boolean = true,
    @SerializedName("terms_accepted") val termsAccepted: Boolean = true,
    @SerializedName("privacy_accepted") val privacyAccepted: Boolean = true
)

data class LoginRequest(
    @SerializedName("identifier") val identifier: String,
    @SerializedName("password") val password: String
)

data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

data class LogoutRequest(
    @SerializedName("refreshToken") val refreshToken: String? = null
)

data class UserProfileDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("username") val username: String,
    @SerializedName("role") val role: String,
    @SerializedName("age_verified") val ageVerified: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("counts") val counts: UserCountsDto? = null
)

data class UserCountsDto(
    @SerializedName("people") val people: Int,
    @SerializedName("images") val images: Int,
    @SerializedName("activities") val activities: Int
)

data class AuthResponseDto(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String,
    @SerializedName("expiresIn") val expiresIn: Int,
    @SerializedName("user") val user: UserProfileDto
)

data class UpdateUserRequest(
    @SerializedName("username") val username: String? = null
)

data class ChangePasswordRequest(
    @SerializedName("currentPassword") val currentPassword: String,
    @SerializedName("newPassword") val newPassword: String
)

data class ApiResponse<T>(
    @SerializedName("statusCode") val statusCode: Int? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("data") val data: T? = null
)
