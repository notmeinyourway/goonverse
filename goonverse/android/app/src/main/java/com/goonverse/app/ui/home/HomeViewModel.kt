package com.goonverse.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.model.ImageItem
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.model.StatsOverview
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.domain.repository.PeopleRepository
import com.goonverse.app.domain.repository.StatsRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val stats: StatsOverview? = null,
    val recentPeople: List<Person> = emptyList(),
    val recentImages: List<ImageItem> = emptyList(),
    val errorMessage: String? = null
)

class HomeViewModel(
    private val statsRepository: StatsRepository,
    private val peopleRepository: PeopleRepository,
    private val imagesRepository: ImagesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData(isRefresh: Boolean = false) {
        viewModelScope.launch {
            if (isRefresh) {
                _uiState.value = _uiState.value.copy(isRefreshing = true, errorMessage = null)
            } else {
                _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            }

            try {
                val statsDeferred = async { statsRepository.fetchOverview() }
                val peopleDeferred = async { peopleRepository.fetchPeople(page = 1, limit = 10) }
                val imagesDeferred = async { imagesRepository.fetchImages(page = 1, limit = 6) }

                val statsRes = statsDeferred.await()
                val peopleRes = peopleDeferred.await()
                val imagesRes = imagesDeferred.await()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isRefreshing = false,
                    stats = statsRes.getOrNull() ?: _uiState.value.stats,
                    recentPeople = peopleRes.getOrNull() ?: _uiState.value.recentPeople,
                    recentImages = imagesRes.getOrNull() ?: _uiState.value.recentImages,
                    errorMessage = if (statsRes.isFailure && _uiState.value.stats == null) "Could not refresh data" else null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isRefreshing = false,
                    errorMessage = e.message ?: "Failed to load dashboard"
                )
            }
        }
    }
}
