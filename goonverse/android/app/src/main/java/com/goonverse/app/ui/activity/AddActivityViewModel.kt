package com.goonverse.app.ui.activity

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.model.ImageItem
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.repository.ActivitiesRepository
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.domain.repository.PeopleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class AddActivityUiState(
    val isLoading: Boolean = false,
    val people: List<Person> = emptyList(),
    val availableImages: List<ImageItem> = emptyList(),
    val selectedPersonId: String? = null,
    val selectedImageId: String? = null,
    val occurredAtIso: String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }.format(Date()),
    val notes: String = "",
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

class AddActivityViewModel(
    private val activitiesRepository: ActivitiesRepository,
    private val peopleRepository: PeopleRepository,
    private val imagesRepository: ImagesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddActivityUiState())
    val uiState: StateFlow<AddActivityUiState> = _uiState.asStateFlow()

    fun initialize(initialPersonId: String?, initialImageId: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val peopleRes = peopleRepository.fetchPeople(page = 1, limit = 100)
            val imagesRes = imagesRepository.fetchImages(page = 1, limit = 100, personId = initialPersonId?.ifEmpty { null })

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                people = peopleRes.getOrNull() ?: emptyList(),
                availableImages = imagesRes.getOrNull() ?: emptyList(),
                selectedPersonId = initialPersonId?.ifEmpty { null },
                selectedImageId = initialImageId?.ifEmpty { null }
            )
        }
    }

    fun onPersonSelected(personId: String?) {
        _uiState.value = _uiState.value.copy(selectedPersonId = personId, selectedImageId = null)
        viewModelScope.launch {
            val imagesRes = imagesRepository.fetchImages(page = 1, limit = 100, personId = personId)
            _uiState.value = _uiState.value.copy(
                availableImages = imagesRes.getOrNull() ?: emptyList()
            )
        }
    }

    fun onImageSelected(imageId: String?) {
        _uiState.value = _uiState.value.copy(selectedImageId = imageId)
    }

    fun onNotesChanged(notes: String) {
        _uiState.value = _uiState.value.copy(notes = notes)
    }

    fun saveActivity(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = activitiesRepository.createActivity(
                personId = _uiState.value.selectedPersonId,
                imageId = _uiState.value.selectedImageId,
                occurredAt = _uiState.value.occurredAtIso,
                notes = _uiState.value.notes.ifBlank { null }
            )

            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
                onSuccess()
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = it.message ?: "Failed to record activity"
                )
            }
        }
    }
}
