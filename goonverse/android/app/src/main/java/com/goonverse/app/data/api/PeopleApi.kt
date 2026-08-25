package com.goonverse.app.data.api

import com.goonverse.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface PeopleApi {
    @GET("people")
    suspend fun getPeople(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("q") query: String? = null
    ): Response<PaginatedPeopleResponse>

    @POST("people")
    suspend fun createPerson(@Body request: CreatePersonRequest): Response<PersonResponseDto>

    @GET("people/{id}")
    suspend fun getPerson(@Path("id") id: String): Response<PersonResponseDto>

    @PATCH("people/{id}")
    suspend fun updatePerson(
        @Path("id") id: String,
        @Body request: UpdatePersonRequest
    ): Response<PersonResponseDto>

    @DELETE("people/{id}")
    suspend fun deletePerson(@Path("id") id: String): Response<ApiResponse<Unit>>
}
