package com.goonverse.app.data.repository

import com.goonverse.app.data.api.PeopleApi
import com.goonverse.app.data.local.dao.PersonDao
import com.goonverse.app.data.local.entity.PersonEntity
import com.goonverse.app.data.models.CreatePersonRequest
import com.goonverse.app.data.models.PersonResponseDto
import com.goonverse.app.data.models.UpdatePersonRequest
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.model.PersonImage
import com.goonverse.app.domain.repository.PeopleRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class PeopleRepositoryImpl(
    private val peopleApi: PeopleApi,
    private val personDao: PersonDao
) : PeopleRepository {

    override fun getPeopleStream(): Flow<List<Person>> {
        return personDao.getAllPeopleFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun fetchPeople(page: Int, limit: Int, query: String?): Result<List<Person>> {
        return try {
            val response = peopleApi.getPeople(page, limit, query)
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!.data
                val entities = dtoList.map { it.toEntity() }
                if (query.isNullOrEmpty() && page == 1) {
                    personDao.clearAll()
                }
                personDao.insertPeople(entities)
                Result.success(dtoList.map { it.toDomain() })
            } else {
                Result.failure(Exception("Failed to fetch people: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getPerson(id: String): Result<Person> {
        return try {
            val response = peopleApi.getPerson(id)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                personDao.insertPerson(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                val cached = personDao.getPersonById(id)
                if (cached != null) {
                    Result.success(cached.toDomain())
                } else {
                    Result.failure(Exception("Person not found"))
                }
            }
        } catch (e: Exception) {
            val cached = personDao.getPersonById(id)
            if (cached != null) Result.success(cached.toDomain()) else Result.failure(e)
        }
    }

    override suspend fun createPerson(name: String, notes: String?): Result<Person> {
        return try {
            val response = peopleApi.createPerson(CreatePersonRequest(name.trim(), notes?.trim()))
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                personDao.insertPerson(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Failed to create person: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updatePerson(id: String, name: String?, notes: String?): Result<Person> {
        return try {
            val response = peopleApi.updatePerson(id, UpdatePersonRequest(name?.trim(), notes?.trim()))
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                personDao.insertPerson(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Failed to update person: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deletePerson(id: String): Result<Unit> {
        return try {
            val response = peopleApi.deletePerson(id)
            if (response.isSuccessful) {
                personDao.deletePersonById(id)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete person: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun PersonEntity.toDomain(): Person {
        return Person(
            id = id,
            name = name,
            notes = notes,
            createdAt = createdAt,
            updatedAt = updatedAt,
            imageCount = imageCount,
            activityCount = activityCount
        )
    }

    private fun PersonResponseDto.toEntity(): PersonEntity {
        return PersonEntity(
            id = id,
            name = name,
            notes = notes,
            createdAt = createdAt,
            updatedAt = updatedAt,
            imageCount = imageCount,
            activityCount = activityCount
        )
    }

    private fun PersonResponseDto.toDomain(): Person {
        return Person(
            id = id,
            name = name,
            notes = notes,
            createdAt = createdAt,
            updatedAt = updatedAt,
            imageCount = imageCount,
            activityCount = activityCount,
            images = images?.map {
                PersonImage(
                    id = it.id,
                    originalFilename = it.originalFilename,
                    mimeType = it.mimeType,
                    fileSize = it.fileSize,
                    createdAt = it.createdAt
                )
            } ?: emptyList()
        )
    }
}
