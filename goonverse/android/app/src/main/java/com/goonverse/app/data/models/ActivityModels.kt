package com.goonverse.app.data.models

import com.google.gson.annotations.SerializedName

data class CreateActivityRequest(
    @SerializedName("personId") val personId: String? = null,
    @SerializedName("imageId") val imageId: String? = null,
    @SerializedName("occurredAt") val occurredAt: String? = null,
    @SerializedName("notes") val notes: String? = null
)

data class ActivityPersonSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)

data class ActivityImageSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("original_filename") val originalFilename: String,
    @SerializedName("mime_type") val mimeType: String
)

data class ActivityResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("person_id") val personId: String? = null,
    @SerializedName("image_id") val imageId: String? = null,
    @SerializedName("occurred_at") val occurredAt: String,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("person") val person: ActivityPersonSummaryDto? = null,
    @SerializedName("image") val image: ActivityImageSummaryDto? = null
)

data class PaginatedActivitiesResponse(
    @SerializedName("data") val data: List<ActivityResponseDto>,
    @SerializedName("meta") val meta: PaginationMetaDto
)
