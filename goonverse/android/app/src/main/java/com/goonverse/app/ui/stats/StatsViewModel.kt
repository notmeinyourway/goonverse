package com.goonverse.app.ui.stats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.model.CalendarStats
import com.goonverse.app.domain.model.StatsOverview
import com.goonverse.app.domain.model.StreakDetails
import com.goonverse.app.domain.repository.StatsRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class StatsUiState(
    val isLoading: Boolean = true,
    val overview: StatsOverview? = null,
    val streakDetails: StreakDetails? = null,
    val calendarStats: CalendarStats? = null,
    val errorMessage: String? = null
)

class StatsViewModel(
    private val statsRepository: StatsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StatsUiState())
    val uiState: StateFlow<StatsUiState> = _uiState.asStateFlow()

    init {
        loadStats()
    }

    fun loadStats() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            try {
                val overviewDeferred = async { statsRepository.fetchOverview() }
                val streakDeferred = async { statsRepository.fetchStreak() }
                val calendarDeferred = async { statsRepository.fetchCalendar() }

                val overviewRes = overviewDeferred.await()
                val streakRes = streakDeferred.await()
                val calendarRes = calendarDeferred.await()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    overview = overviewRes.getOrNull() ?: _uiState.value.overview,
                    streakDetails = streakRes.getOrNull() ?: _uiState.value.streakDetails,
                    calendarStats = calendarRes.getOrNull() ?: _uiState.value.calendarStats,
                    errorMessage = if (overviewRes.isFailure && _uiState.value.overview == null) "Failed to load statistics" else null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Failed to load stats"
                )
            }
        }
    }
}
