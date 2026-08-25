package com.goonverse.app.data.local.dao

import androidx.room.*
import com.goonverse.app.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PersonDao {
    @Query("SELECT * FROM cached_people ORDER BY updatedAt DESC")
    fun getAllPeopleFlow(): Flow<List<PersonEntity>>

    @Query("SELECT * FROM cached_people WHERE id = :id")
    suspend fun getPersonById(id: String): PersonEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPeople(people: List<PersonEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPerson(person: PersonEntity)

    @Query("DELETE FROM cached_people WHERE id = :id")
    suspend fun deletePersonById(id: String)

    @Query("DELETE FROM cached_people")
    suspend fun clearAll()
}

@Dao
interface ImageDao {
    @Query("SELECT * FROM cached_images ORDER BY createdAt DESC")
    fun getAllImagesFlow(): Flow<List<ImageEntity>>

    @Query("SELECT * FROM cached_images WHERE personId = :personId ORDER BY createdAt DESC")
    fun getImagesForPersonFlow(personId: String): Flow<List<ImageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertImages(images: List<ImageEntity>)

    @Query("DELETE FROM cached_images WHERE id = :id")
    suspend fun deleteImageById(id: String)

    @Query("DELETE FROM cached_images")
    suspend fun clearAll()
}

@Dao
interface ActivityDao {
    @Query("SELECT * FROM cached_activities ORDER BY occurredAt DESC")
    fun getAllActivitiesFlow(): Flow<List<ActivityEntity>>

    @Query("SELECT * FROM cached_activities WHERE personId = :personId ORDER BY occurredAt DESC")
    fun getActivitiesForPersonFlow(personId: String): Flow<List<ActivityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivities(activities: List<ActivityEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivity(activity: ActivityEntity)

    @Query("DELETE FROM cached_activities WHERE id = :id")
    suspend fun deleteActivityById(id: String)

    @Query("DELETE FROM cached_activities")
    suspend fun clearAll()
}

@Dao
interface StatsDao {
    @Query("SELECT * FROM cached_stats WHERE id = 1")
    fun getStatsFlow(): Flow<StatsCacheEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStats(stats: StatsCacheEntity)

    @Query("DELETE FROM cached_stats")
    suspend fun clearAll()
}
