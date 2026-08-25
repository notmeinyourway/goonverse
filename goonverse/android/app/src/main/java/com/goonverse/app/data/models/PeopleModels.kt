package com.goonverse.app.data.models

import com.google.gson.annotations.SerializedName

data class CreatePersonRequest(
    @SerializedName("name") val name: String,
    @SerializedName("notes") val notes: String? = null
)

data class UpdatePersonRequest(
    @SerializedName("name") val name: String? = null,
    @SerializedName("notes") val notes: String? = null
)

data class PersonResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("imageCount") val imageCount: Int = 0,
    @SerializedName("activityCount") val activityCount: Int = 0,
    @SerializedName("images") val images: List<PersonImageDto>? = null
)

data class PersonImageDto(
    @SerializedName("id") val id: String,
    @SerializedName("original_filename") val originalFilename: String,
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("file_size") val fileSize: Int,
    @SerializedName("created_at") val createdAt: String
)

data class PaginatedPeopleResponse(
    @SerializedName("data") val data: List<PersonResponseDto>,
    @SerializedName("meta") val meta: PaginationMetaDto
)

data class PaginationMetaDto(
    @SerializedName("total") val total: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int,
    @SerializedName("totalPages") val totalPages: Int
)
