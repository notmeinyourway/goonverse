package com.goonverse.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.data.local.GoonverseDatabase
import com.goonverse.app.domain.model.User
import com.goonverse.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val successMessage: String? = null,
    val errorMessage: String? = null
)

class SettingsViewModel(
    private val authRepository: AuthRepository,
    private val database: GoonverseDatabase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadUserProfile()
    }

    fun loadUserProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.getMe()
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, user = it)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun updateUsername(newUsername: String) {
        if (newUsername.trim().length < 3) {
            _uiState.value = _uiState.value.copy(errorMessage = "Username must be at least 3 characters")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.updateUsername(newUsername)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    user = it,
                    successMessage = "Username updated successfully"
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun changePassword(current: String, new: String, onComplete: () -> Unit) {
        if (new.length < 8) {
            _uiState.value = _uiState.value.copy(errorMessage = "New password must be at least 8 characters")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.changePassword(current, new)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    successMessage = "Password changed successfully"
                )
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun clearLocalCache(onComplete: () -> Unit) {
        viewModelScope.launch {
            database.clearAllCache()
            _uiState.value = _uiState.value.copy(successMessage = "Local offline cache cleared")
            onComplete()
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onComplete()
        }
    }

    fun deleteAccount(onComplete: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = authRepository.deleteAccount()
            result.onSuccess {
                onComplete()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = it.message)
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }
}
