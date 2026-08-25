package com.goonverse.app.data.api

import com.goonverse.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ActivitiesApi {
    @POST("activities")
    suspend fun createActivity(@Body request: CreateActivityRequest): Response<ActivityResponseDto>

    @GET("activities")
    suspend fun getActivities(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("personId") personId: String? = null,
        @Query("imageId") imageId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<PaginatedActivitiesResponse>

    @GET("activities/{id}")
    suspend fun getActivity(@Path("id") id: String): Response<ActivityResponseDto>

    @DELETE("activities/{id}")
    suspend fun deleteActivity(@Path("id") id: String): Response<ApiResponse<Unit>>
}
