package com.goonverse.app.data.api

import com.goonverse.app.data.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ImagesApi {
    @Multipart
    @POST("images")
    suspend fun uploadImage(
        @Part file: MultipartBody.Part,
        @Part("personId") personId: RequestBody? = null,
        @Part("tags") tags: RequestBody? = null
    ): Response<ImageResponseDto>

    @GET("images")
    suspend fun getImages(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("personId") personId: String? = null
    ): Response<PaginatedImagesResponse>

    @GET("images/{id}")
    suspend fun getImageAccess(@Path("id") id: String): Response<ImageAccessResponseDto>

    @DELETE("images/{id}")
    suspend fun deleteImage(@Path("id") id: String): Response<ApiResponse<Unit>>
}
