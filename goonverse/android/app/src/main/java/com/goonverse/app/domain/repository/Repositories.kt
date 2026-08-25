package com.goonverse.app.domain.repository

import com.goonverse.app.domain.model.*
import kotlinx.coroutines.flow.Flow
import java.io.File

interface AuthRepository {
    val isAuthenticated: Flow<Boolean>
    suspend fun register(email: String, username: String, password: String): Result<User>
    suspend fun login(identifier: String, password: String): Result<User>
    suspend fun logout(): Result<Unit>
    suspend fun getMe(): Result<User>
    suspend fun updateUsername(username: String): Result<User>
    suspend fun changePassword(current: String, new: String): Result<Unit>
    suspend fun deleteAccount(): Result<Unit>
    fun getCachedUser(): User?
}

interface PeopleRepository {
    fun getPeopleStream(): Flow<List<Person>>
    suspend fun fetchPeople(page: Int = 1, limit: Int = 50, query: String? = null): Result<List<Person>>
    suspend fun getPerson(id: String): Result<Person>
    suspend fun createPerson(name: String, notes: String?): Result<Person>
    suspend fun updatePerson(id: String, name: String?, notes: String?): Result<Person>
    suspend fun deletePerson(id: String): Result<Unit>
}

interface ImagesRepository {
    fun getImagesStream(personId: String? = null): Flow<List<ImageItem>>
    suspend fun fetchImages(page: Int = 1, limit: Int = 50, personId: String? = null): Result<List<ImageItem>>
    suspend fun uploadImage(file: File, personId: String?, tags: List<String>?): Result<ImageItem>
    suspend fun getImageAccess(id: String): Result<ImageAccess>
    suspend fun deleteImage(id: String): Result<Unit>
}

interface ActivitiesRepository {
    fun getActivitiesStream(personId: String? = null): Flow<List<ActivityItem>>
    suspend fun fetchActivities(
        page: Int = 1,
        limit: Int = 50,
        personId: String? = null,
        imageId: String? = null,
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<ActivityItem>>
    suspend fun getActivity(id: String): Result<ActivityItem>
    suspend fun createActivity(
        personId: String?,
        imageId: String?,
        occurredAt: String?,
        notes: String?
    ): Result<ActivityItem>
    suspend fun deleteActivity(id: String): Result<Unit>
}

interface StatsRepository {
    fun getStatsStream(): Flow<StatsOverview?>
    suspend fun fetchOverview(): Result<StatsOverview>
    suspend fun fetchStreak(): Result<StreakDetails>
    suspend fun fetchCalendar(startDate: String? = null, endDate: String? = null): Result<CalendarStats>
}
