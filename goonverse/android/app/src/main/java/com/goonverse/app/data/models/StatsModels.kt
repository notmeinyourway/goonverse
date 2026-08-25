package com.goonverse.app.data.models

import com.google.gson.annotations.SerializedName

data class StatsOverviewDto(
    @SerializedName("totalActivities") val totalActivities: Int,
    @SerializedName("currentStreak") val currentStreak: Int,
    @SerializedName("longestStreak") val longestStreak: Int,
    @SerializedName("totalActiveDays") val totalActiveDays: Int,
    @SerializedName("todayActivities") val todayActivities: Int,
    @SerializedName("weeklyActivities") val weeklyActivities: Int,
    @SerializedName("monthlyActivities") val monthlyActivities: Int,
    @SerializedName("totalPeople") val totalPeople: Int,
    @SerializedName("totalImages") val totalImages: Int,
    @SerializedName("lastActivityDate") val lastActivityDate: String? = null
)

data class StreakMilestoneDto(
    @SerializedName("target") val target: Int,
    @SerializedName("name") val name: String,
    @SerializedName("achieved") val achieved: Boolean
)

data class StreakDetailsDto(
    @SerializedName("currentStreak") val currentStreak: Int,
    @SerializedName("longestStreak") val longestStreak: Int,
    @SerializedName("totalActiveDays") val totalActiveDays: Int,
    @SerializedName("lastActivityDate") val lastActivityDate: String? = null,
    @SerializedName("milestones") val milestones: List<StreakMilestoneDto>
)

data class CalendarStatsDto(
    @SerializedName("startDate") val startDate: String? = null,
    @SerializedName("endDate") val endDate: String? = null,
    @SerializedName("totalRecorded") val totalRecorded: Int,
    @SerializedName("days") val days: Map<String, Int>
)
