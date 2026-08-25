package com.goonverse.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_people")
data class PersonEntity(
    @PrimaryKey val id: String,
    val name: String,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val imageCount: Int,
    val activityCount: Int
)

@Entity(tableName = "cached_images")
data class ImageEntity(
    @PrimaryKey val id: String,
    val personId: String?,
    val originalFilename: String,
    val mimeType: String,
    val fileSize: Int,
    val createdAt: String,
    val tags: String // Comma separated
)

@Entity(tableName = "cached_activities")
data class ActivityEntity(
    @PrimaryKey val id: String,
    val personId: String?,
    val personName: String?,
    val imageId: String?,
    val imageFilename: String?,
    val occurredAt: String,
    val notes: String?,
    val createdAt: String
)

@Entity(tableName = "cached_stats")
data class StatsCacheEntity(
    @PrimaryKey val id: Int = 1,
    val totalActivities: Int,
    val currentStreak: Int,
    val longestStreak: Int,
    val totalActiveDays: Int,
    val todayActivities: Int,
    val weeklyActivities: Int,
    val monthlyActivities: Int,
    val totalPeople: Int,
    val totalImages: Int,
    val lastActivityDate: String?,
    val lastUpdated: Long = System.currentTimeMillis()
)
