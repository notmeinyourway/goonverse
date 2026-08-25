package com.goonverse.app.data.repository

import com.goonverse.app.data.api.ActivitiesApi
import com.goonverse.app.data.local.dao.ActivityDao
import com.goonverse.app.data.local.entity.ActivityEntity
import com.goonverse.app.data.models.ActivityResponseDto
import com.goonverse.app.data.models.CreateActivityRequest
import com.goonverse.app.domain.model.ActivityItem
import com.goonverse.app.domain.repository.ActivitiesRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ActivitiesRepositoryImpl(
    private val activitiesApi: ActivitiesApi,
    private val activityDao: ActivityDao
) : ActivitiesRepository {

    override fun getActivitiesStream(personId: String?): Flow<List<ActivityItem>> {
        val flow = if (personId != null) {
            activityDao.getActivitiesForPersonFlow(personId)
        } else {
            activityDao.getAllActivitiesFlow()
        }
        return flow.map { entities -> entities.map { it.toDomain() } }
    }

    override suspend fun fetchActivities(
        page: Int,
        limit: Int,
        personId: String?,
        imageId: String?,
        startDate: String?,
        endDate: String?
    ): Result<List<ActivityItem>> {
        return try {
            val response = activitiesApi.getActivities(page, limit, personId, imageId, startDate, endDate)
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!.data
                val entities = dtoList.map { it.toEntity() }
                if (personId == null && imageId == null && startDate == null && endDate == null && page == 1) {
                    activityDao.clearAll()
                }
                activityDao.insertActivities(entities)
                Result.success(dtoList.map { it.toDomain() })
            } else {
                Result.failure(Exception("Failed to fetch activities: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getActivity(id: String): Result<ActivityItem> {
        return try {
            val response = activitiesApi.getActivity(id)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                activityDao.insertActivity(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Activity not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createActivity(
        personId: String?,
        imageId: String?,
        occurredAt: String?,
        notes: String?
    ): Result<ActivityItem> {
        return try {
            val request = CreateActivityRequest(
                personId = personId,
                imageId = imageId,
                occurredAt = occurredAt,
                notes = notes?.trim()
            )
            val response = activitiesApi.createActivity(request)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                activityDao.insertActivity(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Failed to record activity: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteActivity(id: String): Result<Unit> {
        return try {
            val response = activitiesApi.deleteActivity(id)
            if (response.isSuccessful) {
                activityDao.deleteActivityById(id)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete activity: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun ActivityEntity.toDomain(): ActivityItem {
        return ActivityItem(
            id = id,
            personId = personId,
            personName = personName,
            imageId = imageId,
            imageFilename = imageFilename,
            occurredAt = occurredAt,
            notes = notes,
            createdAt = createdAt
        )
    }

    private fun ActivityResponseDto.toEntity(): ActivityEntity {
        return ActivityEntity(
            id = id,
            personId = personId,
            personName = person?.name,
            imageId = imageId,
            imageFilename = image?.originalFilename,
            occurredAt = occurredAt,
            notes = notes,
            createdAt = createdAt
        )
    }

    private fun ActivityResponseDto.toDomain(): ActivityItem {
        return ActivityItem(
            id = id,
            personId = personId,
            personName = person?.name,
            imageId = imageId,
            imageFilename = image?.originalFilename,
            occurredAt = occurredAt,
            notes = notes,
            createdAt = createdAt
        )
    }
}
