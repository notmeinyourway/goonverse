package com.goonverse.app.ui.people

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.model.ActivityItem
import com.goonverse.app.domain.model.ImageItem
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.repository.ActivitiesRepository
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.domain.repository.PeopleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

data class PeopleUiState(
    val isLoading: Boolean = false,
    val people: List<Person> = emptyList(),
    val searchQuery: String = "",
    val errorMessage: String? = null,
    val selectedPerson: Person? = null,
    val selectedPersonImages: List<ImageItem> = emptyList(),
    val selectedPersonActivities: List<ActivityItem> = emptyList(),
    val isUploadingImage: Boolean = false
)

class PeopleViewModel(
    private val peopleRepository: PeopleRepository,
    private val imagesRepository: ImagesRepository,
    private val activitiesRepository: ActivitiesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PeopleUiState())
    val uiState: StateFlow<PeopleUiState> = _uiState.asStateFlow()

    init {
        loadPeople()
    }

    fun loadPeople(query: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, searchQuery = query ?: "")
            val result = peopleRepository.fetchPeople(page = 1, limit = 100, query = query)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, people = it)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun createPerson(name: String, notes: String?, onComplete: () -> Unit) {
        if (name.isBlank()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = peopleRepository.createPerson(name, notes)
            result.onSuccess {
                loadPeople()
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun updatePerson(id: String, name: String?, notes: String?, onComplete: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = peopleRepository.updatePerson(id, name, notes)
            result.onSuccess {
                loadPersonDetail(id)
                loadPeople()
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun deletePerson(id: String, onComplete: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = peopleRepository.deletePerson(id)
            result.onSuccess {
                loadPeople()
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun loadPersonDetail(personId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val personRes = peopleRepository.getPerson(personId)
            val imagesRes = imagesRepository.fetchImages(page = 1, limit = 50, personId = personId)
            val activitiesRes = activitiesRepository.fetchActivities(page = 1, limit = 20, personId = personId)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                selectedPerson = personRes.getOrNull(),
                selectedPersonImages = imagesRes.getOrNull() ?: emptyList(),
                selectedPersonActivities = activitiesRes.getOrNull() ?: emptyList(),
                errorMessage = personRes.exceptionOrNull()?.message
            )
        }
    }

    fun uploadImageToPerson(personId: String, file: File, tags: List<String>?, onComplete: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUploadingImage = true)
            val result = imagesRepository.uploadImage(file, personId, tags)
            result.onSuccess {
                loadPersonDetail(personId)
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isUploadingImage = false, errorMessage = it.message)
            }
        }
    }
}
