package com.goonverse.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.goonverse.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val isRegisteredSuccess: Boolean = false
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val emailRegex = Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\$")

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(identifier: String, password: String, onSuccess: () -> Unit) {
        if (identifier.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your email or username")
            return
        }
        if (password.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your password")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.login(identifier, password)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onSuccess()
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = it.message ?: "Authentication failed. Please verify credentials."
                )
            }
        }
    }

    fun register(
        email: String,
        username: String,
        password: String,
        confirmPassword: String,
        ageVerified: Boolean,
        termsAccepted: Boolean,
        privacyAccepted: Boolean,
        onSuccess: () -> Unit
    ) {
        if (email.isBlank() || !emailRegex.matches(email.trim())) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email address")
            return
        }
        if (username.trim().length < 3) {
            _uiState.value = _uiState.value.copy(errorMessage = "Username must be at least 3 characters long")
            return
        }
        if (password.length < 8) {
            _uiState.value = _uiState.value.copy(errorMessage = "Password must be at least 8 characters long")
            return
        }
        if (password != confirmPassword) {
            _uiState.value = _uiState.value.copy(errorMessage = "Passwords do not match")
            return
        }
        if (!ageVerified) {
            _uiState.value = _uiState.value.copy(errorMessage = "You must confirm that you are at least 18 years old")
            return
        }
        if (!termsAccepted) {
            _uiState.value = _uiState.value.copy(errorMessage = "You must agree to the Terms of Service")
            return
        }
        if (!privacyAccepted) {
            _uiState.value = _uiState.value.copy(errorMessage = "You must agree to the Privacy Policy")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = authRepository.register(email, username, password)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, isRegisteredSuccess = true)
                onSuccess()
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = it.message ?: "Registration failed"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
