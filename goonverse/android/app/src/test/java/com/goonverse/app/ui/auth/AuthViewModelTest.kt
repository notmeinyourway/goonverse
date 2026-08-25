package com.goonverse.app.ui.auth

import com.goonverse.app.domain.model.User
import com.goonverse.app.domain.repository.AuthRepository
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
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private val fakeAuthRepository = object : AuthRepository {
        override val isAuthenticated: Flow<Boolean> = flowOf(false)

        override suspend fun register(email: String, username: String, password: String): Result<User> {
            return Result.success(
                User(
                    id = "test-user-id",
                    email = email,
                    username = username,
                    role = "USER",
                    ageVerified = true,
                    createdAt = "2026-08-25T00:00:00.000Z",
                    updatedAt = "2026-08-25T00:00:00.000Z"
                )
            )
        }

        override suspend fun login(identifier: String, password: String): Result<User> {
            return if (password == "validPassword123") {
                Result.success(
                    User(
                        id = "test-user-id",
                        email = "test@example.com",
                        username = "testuser",
                        role = "USER",
                        ageVerified = true,
                        createdAt = "2026-08-25T00:00:00.000Z",
                        updatedAt = "2026-08-25T00:00:00.000Z"
                    )
                )
            } else {
                Result.failure(Exception("Invalid credentials"))
            }
        }

        override suspend fun logout(): Result<Unit> = Result.success(Unit)
        override suspend fun getMe(): Result<User> = Result.failure(Exception("Not implemented"))
        override suspend fun updateUsername(username: String): Result<User> = Result.failure(Exception("Not implemented"))
        override suspend fun changePassword(current: String, new: String): Result<Unit> = Result.success(Unit)
        override suspend fun deleteAccount(): Result<Unit> = Result.success(Unit)
        override fun getCachedUser(): User? = null
    }

    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = AuthViewModel(fakeAuthRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun login_withEmptyCredentials_setsErrorMessage() {
        viewModel.login("", "") {}
        assertEquals("Please enter your email or username", viewModel.uiState.value.errorMessage)
    }

    @Test
    fun login_withValidCredentials_callsSuccessCallback() = runTest(testDispatcher) {
        var successCalled = false
        viewModel.login("testuser", "validPassword123") {
            successCalled = true
        }
        testDispatcher.scheduler.advanceUntilIdle()
        assertTrue(successCalled)
        assertNull(viewModel.uiState.value.errorMessage)
    }

    @Test
    fun register_without18PlusVerification_setsErrorMessage() {
        viewModel.register(
            email = "user@test.com",
            username = "validuser",
            password = "password123",
            confirmPassword = "password123",
            ageVerified = false,
            termsAccepted = true,
            privacyAccepted = true
        ) {}
        assertEquals("You must confirm that you are at least 18 years old", viewModel.uiState.value.errorMessage)
    }

    @Test
    fun register_withMismatchedPassword_setsErrorMessage() {
        viewModel.register(
            email = "user@test.com",
            username = "validuser",
            password = "password123",
            confirmPassword = "differentPassword",
            ageVerified = true,
            termsAccepted = true,
            privacyAccepted = true
        ) {}
        assertEquals("Passwords do not match", viewModel.uiState.value.errorMessage)
    }
}
