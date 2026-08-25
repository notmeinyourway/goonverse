package com.goonverse.app.data.api

import com.goonverse.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponseDto>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponseDto>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<AuthResponseDto>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest = LogoutRequest()): Response<ApiResponse<Unit>>

    @GET("users/me")
    suspend fun getMe(): Response<UserProfileDto>

    @PATCH("users/me")
    suspend fun updateMe(@Body request: UpdateUserRequest): Response<UserProfileDto>

    @PATCH("users/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<Unit>>

    @DELETE("users/me")
    suspend fun deleteAccount(): Response<ApiResponse<Unit>>
}
