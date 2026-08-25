package com.goonverse.app.domain.model

data class User(
    val id: String,
    val email: String,
    val username: String,
    val role: String,
    val ageVerified: Boolean,
    val createdAt: String,
    val updatedAt: String,
    val peopleCount: Int = 0,
    val imageCount: Int = 0,
    val activityCount: Int = 0
)

data class Person(
    val id: String,
    val name: String,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val imageCount: Int = 0,
    val activityCount: Int = 0,
    val images: List<PersonImage> = emptyList()
)

data class PersonImage(
    val id: String,
    val originalFilename: String,
    val mimeType: String,
    val fileSize: Int,
    val createdAt: String
)

data class ImageItem(
    val id: String,
    val personId: String?,
    val originalFilename: String,
    val mimeType: String,
    val fileSize: Int,
    val createdAt: String,
    val tags: List<String> = emptyList()
)

data class ImageAccess(
    val id: String,
    val originalFilename: String,
    val mimeType: String,
    val fileSize: Int,
    val url: String,
    val expiresIn: Int
)

data class ActivityItem(
    val id: String,
    val personId: String?,
    val personName: String?,
    val imageId: String?,
    val imageFilename: String?,
    val occurredAt: String,
    val notes: String?,
    val createdAt: String
)

data class StatsOverview(
    val totalActivities: Int,
    val currentStreak: Int,
    val longestStreak: Int,
    val totalActiveDays: Int,
    val todayActivities: Int,
    val weeklyActivities: Int,
    val monthlyActivities: Int,
    val totalPeople: Int,
    val totalImages: Int,
    val lastActivityDate: String?
)

data class StreakMilestone(
    val target: Int,
    val name: String,
    val achieved: Boolean
)

data class StreakDetails(
    val currentStreak: Int,
    val longestStreak: Int,
    val totalActiveDays: Int,
    val lastActivityDate: String?,
    val milestones: List<StreakMilestone>
)

data class CalendarStats(
    val startDate: String?,
    val endDate: String?,
    val totalRecorded: Int,
    val days: Map<String, Int>
)
