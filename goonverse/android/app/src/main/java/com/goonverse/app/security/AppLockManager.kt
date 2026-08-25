package com.goonverse.app.security

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppLockManager(private val sessionManager: EncryptedSessionManager) {

    private val _isLocked = MutableStateFlow(sessionManager.isAppLockEnabled())
    val isLocked: StateFlow<Boolean> = _isLocked.asStateFlow()

    private var backgroundTimestamp: Long = 0L

    fun onAppBackgrounded() {
        if (!sessionManager.isAppLockEnabled()) return
        backgroundTimestamp = System.currentTimeMillis()
    }

    fun onAppForegrounded() {
        if (!sessionManager.isAppLockEnabled()) return

        val timeoutSeconds = sessionManager.getAutoLockTimeoutSeconds()
        if (timeoutSeconds == -1) {
            // Never auto lock on backgrounding
            return
        }

        if (timeoutSeconds == 0) {
            _isLocked.value = true
            return
        }

        val elapsedSeconds = (System.currentTimeMillis() - backgroundTimestamp) / 1000
        if (elapsedSeconds >= timeoutSeconds) {
            _isLocked.value = true
        }
    }

    fun unlock(pin: String): Boolean {
        val valid = sessionManager.verifyAppLockPin(pin)
        if (valid) {
            _isLocked.value = false
        }
        return valid
    }

    fun unlockWithBiometrics() {
        if (sessionManager.isBiometricsEnabled()) {
            _isLocked.value = false
        }
    }

    fun lock() {
        if (sessionManager.isAppLockEnabled()) {
            _isLocked.value = true
        }
    }
}
