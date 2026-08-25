package com.goonverse.app.data.repository

import com.goonverse.app.data.api.StatsApi
import com.goonverse.app.data.local.dao.StatsDao
import com.goonverse.app.data.local.entity.StatsCacheEntity
import com.goonverse.app.data.models.StatsOverviewDto
import com.goonverse.app.domain.model.*
import com.goonverse.app.domain.repository.StatsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.TimeZone

class StatsRepositoryImpl(
    private val statsApi: StatsApi,
    private val statsDao: StatsDao
) : StatsRepository {

    private fun getClientTimezoneOffsetMinutes(): Int {
        val tz = TimeZone.getDefault()
        return - (tz.rawOffset / (60 * 1000))
    }

    override fun getStatsStream(): Flow<StatsOverview?> {
        return statsDao.getStatsFlow().map { entity -> entity?.toDomain() }
    }

    override suspend fun fetchOverview(): Result<StatsOverview> {
        return try {
            val offset = getClientTimezoneOffsetMinutes()
            val response = statsApi.getOverview(offset)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                statsDao.insertStats(dto.toEntity())
                Result.success(dto.toDomain())
            } else {
                Result.failure(Exception("Failed to fetch overview stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun fetchStreak(): Result<StreakDetails> {
        return try {
            val offset = getClientTimezoneOffsetMinutes()
            val response = statsApi.getStreak(offset)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                Result.success(
                    StreakDetails(
                        currentStreak = dto.currentStreak,
                        longestStreak = dto.longestStreak,
                        totalActiveDays = dto.totalActiveDays,
                        lastActivityDate = dto.lastActivityDate,
                        milestones = dto.milestones.map {
                            StreakMilestone(target = it.target, name = it.name, achieved = it.achieved)
                        }
                    )
                )
            } else {
                Result.failure(Exception("Failed to fetch streak details: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun fetchCalendar(startDate: String?, endDate: String?): Result<CalendarStats> {
        return try {
            val offset = getClientTimezoneOffsetMinutes()
            val response = statsApi.getCalendar(startDate, endDate, offset)
            if (response.isSuccessful && response.body() != null) {
                val dto = response.body()!!
                Result.success(
                    CalendarStats(
                        startDate = dto.startDate,
                        endDate = dto.endDate,
                        totalRecorded = dto.totalRecorded,
                        days = dto.days
                    )
                )
            } else {
                Result.failure(Exception("Failed to fetch calendar stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun StatsCacheEntity.toDomain(): StatsOverview {
        return StatsOverview(
            totalActivities = totalActivities,
            currentStreak = currentStreak,
            longestStreak = longestStreak,
            totalActiveDays = totalActiveDays,
            todayActivities = todayActivities,
            weeklyActivities = weeklyActivities,
            monthlyActivities = monthlyActivities,
            totalPeople = totalPeople,
            totalImages = totalImages,
            lastActivityDate = lastActivityDate
        )
    }

    private fun StatsOverviewDto.toEntity(): StatsCacheEntity {
        return StatsCacheEntity(
            id = 1,
            totalActivities = totalActivities,
            currentStreak = currentStreak,
            longestStreak = longestStreak,
            totalActiveDays = totalActiveDays,
            todayActivities = todayActivities,
            weeklyActivities = weeklyActivities,
            monthlyActivities = monthlyActivities,
            totalPeople = totalPeople,
            totalImages = totalImages,
            lastActivityDate = lastActivityDate
        )
    }

    private fun StatsOverviewDto.toDomain(): StatsOverview {
        return StatsOverview(
            totalActivities = totalActivities,
            currentStreak = currentStreak,
            longestStreak = longestStreak,
            totalActiveDays = totalActiveDays,
            todayActivities = todayActivities,
            weeklyActivities = weeklyActivities,
            monthlyActivities = monthlyActivities,
            totalPeople = totalPeople,
            totalImages = totalImages,
            lastActivityDate = lastActivityDate
        )
    }
}
