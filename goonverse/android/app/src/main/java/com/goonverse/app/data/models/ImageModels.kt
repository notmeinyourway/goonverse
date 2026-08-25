package com.goonverse.app.data.models

import com.google.gson.annotations.SerializedName

data class ImageResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("person_id") val personId: String? = null,
    @SerializedName("original_filename") val originalFilename: String,
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("file_size") val fileSize: Int,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("tags") val tags: List<String>? = null
)

data class ImageAccessResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("original_filename") val originalFilename: String,
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("file_size") val fileSize: Int,
    @SerializedName("url") val url: String,
    @SerializedName("expiresIn") val expiresIn: Int
)

data class PaginatedImagesResponse(
    @SerializedName("data") val data: List<ImageResponseDto>,
    @SerializedName("meta") val meta: PaginationMetaDto
)
