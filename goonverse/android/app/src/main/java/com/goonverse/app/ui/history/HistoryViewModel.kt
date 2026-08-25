package com.goonverse.app.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.model.ActivityItem
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.repository.ActivitiesRepository
import com.goonverse.app.domain.repository.PeopleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HistoryUiState(
    val isLoading: Boolean = false,
    val activities: List<ActivityItem> = emptyList(),
    val people: List<Person> = emptyList(),
    val selectedPersonFilter: String? = null,
    val errorMessage: String? = null
)

class HistoryViewModel(
    private val activitiesRepository: ActivitiesRepository,
    private val peopleRepository: PeopleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        loadHistory()
    }

    fun loadHistory(personId: String? = _uiState.value.selectedPersonFilter) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, selectedPersonFilter = personId, errorMessage = null)
            val peopleRes = peopleRepository.fetchPeople(page = 1, limit = 100)
            val activitiesRes = activitiesRepository.fetchActivities(
                page = 1,
                limit = 100,
                personId = personId
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                people = peopleRes.getOrNull() ?: emptyList(),
                activities = activitiesRes.getOrNull() ?: emptyList(),
                errorMessage = activitiesRes.exceptionOrNull()?.message
            )
        }
    }

    fun deleteActivity(id: String) {
        viewModelScope.launch {
            activitiesRepository.deleteActivity(id)
            loadHistory()
        }
    }
}
