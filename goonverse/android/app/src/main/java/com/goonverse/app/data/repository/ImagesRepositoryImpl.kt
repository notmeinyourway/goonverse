package com.goonverse.app.data.repository

import com.goonverse.app.data.api.ImagesApi
import com.goonverse.app.data.local.dao.ImageDao
import com.goonverse.app.data.local.entity.ImageEntity
import com.goonverse.app.data.models.ImageResponseDto
import com.goonverse.app.domain.model.ImageAccess
import com.goonverse.app.domain.model.ImageItem
import com.goonverse.app.domain.repository.ImagesRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class ImagesRepositoryImpl(
    private val imagesApi: ImagesApi,
    private val imageDao: ImageDao
) : ImagesRepository {

    override fun getImagesStream(personId: String?): Flow<List<ImageItem>> {
        val flow = if (personId != null) {
            imageDao.getImagesForPersonFlow(personId)
        } else {
            imageDao.getAllImagesFlow()
        }
        return flow.map { entities -> entities.map { it.toDomain() } }
    }

    override suspend fun fetchImages(page: Int, limit: Int, personId: String?): Result<List<ImageItem>> {
        return try {
            val response = imagesApi.getImages(page, limit, personId)
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!.data
                val entities = dtoList.map { it.toEntity() }
                if (personId == null && page == 1) {
                    imageDao.clearAll()
                }
                imageDao.insertImages(entities)
                Result.success(dtoList.map { it.toDomain() })
            } else {
                Result.failure(Exception("Failed to fetch images: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun uploadImage(file: File, personId: String?, tags: List<String>?): Result<ImageItem> {
        return try {
            val mimeType = when (file.extension.lowercase()) {
                "jpg", "jpeg" -> "image/jpeg"
                "png" -> "image/png"
                "webp" -> "image/webp"
                "gif" -> "image/gif"
                else -> "image/jpeg"
            }

            val requestFile = file.asRequestBody(mimeType.toMediaTypeOrNull())
            val filePart = MultipartBody.Part.createFormData("file", file.name, requestFile)

            val personIdPart = personId?.toRequestBody("text/plain".toMediaTypeOrNull())
            val tagsPart = tags?.joinToString(",")?.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = imagesApi.uploadImage(filePart, personIdPart, tagsPart)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                imageDao.insertImages(listOf(dto.toEntity()))
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Image upload failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getImageAccess(id: String): Result<ImageAccess> {
        return try {
            val response = imagesApi.getImageAccess(id)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                Result.success(
                    ImageAccess(
                        id = dto.id,
                        originalFilename = dto.originalFilename,
                        mimeType = dto.mimeType,
                        fileSize = dto.fileSize,
                        url = dto.url,
                        expiresIn = dto.expiresIn
                    )
                )
            } else {
                Result.failure(Exception("Failed to obtain signed image URL: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteImage(id: String): Result<Unit> {
        return try {
            val response = imagesApi.deleteImage(id)
            if (response.isSuccessful) {
                imageDao.deleteImageById(id)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete image: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun ImageEntity.toDomain(): ImageItem {
        return ImageItem(
            id = id,
            personId = personId,
            originalFilename = originalFilename,
            mimeType = mimeType,
            fileSize = fileSize,
            createdAt = createdAt,
            tags = if (tags.isNotEmpty()) tags.split(",") else emptyList()
        )
    }

    private fun ImageResponseDto.toEntity(): ImageEntity {
        return ImageEntity(
            id = id,
            personId = personId,
            originalFilename = originalFilename,
            mimeType = mimeType,
            fileSize = fileSize,
            createdAt = createdAt,
            tags = tags?.joinToString(",") ?: ""
        )
    }

    private fun ImageResponseDto.toDomain(): ImageItem {
        return ImageItem(
            id = id,
            personId = personId,
            originalFilename = originalFilename,
            mimeType = mimeType,
            fileSize = fileSize,
            createdAt = createdAt,
            tags = tags ?: emptyList()
        )
    }
}
