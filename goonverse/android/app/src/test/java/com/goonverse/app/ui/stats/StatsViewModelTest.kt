package com.goonverse.app.ui.stats

import com.goonverse.app.domain.model.CalendarStats
import com.goonverse.app.domain.model.StatsOverview
import com.goonverse.app.domain.model.StreakDetails
import com.goonverse.app.domain.model.StreakMilestone
import com.goonverse.app.domain.repository.StatsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class StatsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private val fakeStatsRepository = object : StatsRepository {
        override fun getStatsStream(): Flow<StatsOverview?> = flowOf(null)

        override suspend fun fetchOverview(): Result<StatsOverview> {
            return Result.success(
                StatsOverview(
                    totalActivities = 42,
                    currentStreak = 7,
                    longestStreak = 14,
                    totalActiveDays = 25,
                    todayActivities = 2,
                    weeklyActivities = 10,
                    monthlyActivities = 30,
                    totalPeople = 5,
                    totalImages = 12,
                    lastActivityDate = "2026-08-25"
                )
            )
        }

        override suspend fun fetchStreak(): Result<StreakDetails> {
            return Result.success(
                StreakDetails(
                    currentStreak = 7,
                    longestStreak = 14,
                    totalActiveDays = 25,
                    lastActivityDate = "2026-08-25",
                    milestones = listOf(
                        StreakMilestone(target = 3, name = "3-Day Spark", achieved = true),
                        StreakMilestone(target = 7, name = "1-Week Momentum", achieved = true),
                        StreakMilestone(target = 30, name = "Monthly Master", achieved = false)
                    )
                )
            )
        }

        override suspend fun fetchCalendar(startDate: String?, endDate: String?): Result<CalendarStats> {
            return Result.success(
                CalendarStats(
                    startDate = "2026-06-01",
                    endDate = "2026-08-25",
                    totalRecorded = 42,
                    days = mapOf("2026-08-25" to 2, "2026-08-24" to 1)
                )
            )
        }
    }

    private lateinit var viewModel: StatsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = StatsViewModel(fakeStatsRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadStats_populatesOverviewAndStreaks() = runTest(testDispatcher) {
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.overview)
        assertEquals(42, state.overview?.totalActivities)
        assertEquals(7, state.overview?.currentStreak)
        assertEquals(3, state.streakDetails?.milestones?.size)
        assertTrue(state.streakDetails?.milestones?.first()?.achieved == true)
        assertEquals(2, state.calendarStats?.days?.size)
    }
}
