package com.goonverse.app.data.api

import com.goonverse.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface StatsApi {
    @GET("stats/overview")
    suspend fun getOverview(
        @Query("tzOffset") tzOffsetMinutes: Int? = null
    ): Response<StatsOverviewDto>

    @GET("stats/streak")
    suspend fun getStreak(
        @Query("tzOffset") tzOffsetMinutes: Int? = null
    ): Response<StreakDetailsDto>

    @GET("stats/calendar")
    suspend fun getCalendar(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("tzOffset") tzOffsetMinutes: Int? = null
    ): Response<CalendarStatsDto>
}
