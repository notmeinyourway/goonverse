package com.goonverse.app.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onLoggedOut: () -> Unit,
    onNavigateToPrivacy: () -> Unit = {},
    onNavigateToTerms: () -> Unit = {},
    onNavigateToContentPolicy: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val currentUser = uiState.user

    var showEditUsernameDialog by remember { mutableStateOf(false) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }
    var showClearCacheConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Settings & Vault Security"
            )
        },
        containerColor = BackgroundDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundDark)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = Shapes.large,
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .background(PrimaryViolet.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (currentUser?.username ?: "U").take(1).uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryVioletLight
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = currentUser?.username ?: "Vault Owner",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = currentUser?.email ?: "loading...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(AccentEmerald.copy(alpha = 0.15f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "18+ Verified",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontSize = 10.sp,
                                    color = AccentEmerald,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Role: ${currentUser?.role ?: "USER"}",
                                style = MaterialTheme.typography.bodySmall,
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        }
                    }
                }
            }

            if (uiState.successMessage != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = Shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(AccentEmerald, AccentEmerald)))
                ) {
                    Text(
                        text = uiState.successMessage!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = AccentEmerald,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            if (uiState.errorMessage != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = Shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(ErrorRed, ErrorRed)))
                ) {
                    Text(
                        text = uiState.errorMessage!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = ErrorRed,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            // Account Settings Section
            Text(
                text = "Account Settings",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
                modifier = Modifier.padding(start = 4.dp, top = 8.dp)
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = Shapes.medium,
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
            ) {
                Column {
                    SettingsRow(
                        icon = Icons.Default.Edit,
                        title = "Edit Username",
                        subtitle = "Change your display handle",
                        onClick = { showEditUsernameDialog = true }
                    )
                    HorizontalDivider(color = BorderSubtle)
                    SettingsRow(
                        icon = Icons.Default.Lock,
                        title = "Change Password",
                        subtitle = "Update vault authentication key",
                        onClick = { showChangePasswordDialog = true }
                    )
                }
            }

            // Storage & Security Section
            Text(
                text = "Storage & Privacy",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
                modifier = Modifier.padding(start = 4.dp, top = 8.dp)
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = Shapes.medium,
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
            ) {
                Column {
                    SettingsRow(
                        icon = Icons.Default.CleaningServices,
                        title = "Clear Local Cache",
                        subtitle = "Wipe cached offline thumbnails and database",
                        onClick = { showClearCacheConfirm = true }
                    )
                    HorizontalDivider(color = BorderSubtle)
                    SettingsRow(
                        icon = Icons.Default.Shield,
                        title = "Privacy Policy",
                        subtitle = "Zero-exposure storage & owner isolation terms",
                        onClick = onNavigateToPrivacy
                    )
                    HorizontalDivider(color = BorderSubtle)
                    SettingsRow(
                        icon = Icons.Default.Description,
                        title = "Terms of Service",
                        subtitle = "18+ user agreement and platform guidelines",
                        onClick = onNavigateToTerms
                    )
                    HorizontalDivider(color = BorderSubtle)
                    SettingsRow(
                        icon = Icons.Default.Warning,
                        title = "Content Policy",
                        subtitle = "Zero tolerance standards (18+ only, anti-CSAM, anti-NCII)",
                        onClick = onNavigateToContentPolicy
                    )
                }
            }

            // Danger Zone Section
            Text(
                text = "Session & Account",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextSecondary,
                modifier = Modifier.padding(start = 4.dp, top = 8.dp)
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = Shapes.medium,
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
            ) {
                Column {
                    SettingsRow(
                        icon = Icons.Default.Logout,
                        title = "Log Out",
                        subtitle = "Safely invalidate session and clear Keystore tokens",
                        tint = TextPrimary,
                        onClick = { showLogoutDialog = true }
                    )
                    HorizontalDivider(color = BorderSubtle)
                    SettingsRow(
                        icon = Icons.Default.DeleteForever,
                        title = "Delete Vault Account",
                        subtitle = "Permanently purge all data, people, and media",
                        tint = ErrorRed,
                        onClick = { showDeleteAccountDialog = true }
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }

        // Edit Username Dialog
        if (showEditUsernameDialog && currentUser != null) {
            var newUsername by remember(currentUser) { mutableStateOf(currentUser.username) }
            AlertDialog(
                onDismissRequest = { showEditUsernameDialog = false },
                containerColor = SurfaceDark,
                shape = Shapes.large,
                title = { Text("Edit Username", color = TextPrimary) },
                text = {
                    GoonverseTextField(
                        value = newUsername,
                        onValueChange = { newUsername = it },
                        label = "New Username"
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        showEditUsernameDialog = false
                        viewModel.updateUsername(newUsername)
                    }) {
                        Text("Save", color = PrimaryVioletLight)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showEditUsernameDialog = false }) {
                        Text("Cancel", color = TextSecondary)
                    }
                }
            )
        }

        // Change Password Dialog
        if (showChangePasswordDialog) {
            var currentPassword by remember { mutableStateOf("") }
            var newPassword by remember { mutableStateOf("") }
            AlertDialog(
                onDismissRequest = { showChangePasswordDialog = false },
                containerColor = SurfaceDark,
                shape = Shapes.large,
                title = { Text("Change Password", color = TextPrimary) },
                text = {
                    Column {
                        GoonverseTextField(
                            value = currentPassword,
                            onValueChange = { currentPassword = it },
                            label = "Current Password",
                            isPassword = true
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        GoonverseTextField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            label = "New Password (min 8 chars)",
                            isPassword = true
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        viewModel.changePassword(currentPassword, newPassword) {
                            showChangePasswordDialog = false
                        }
                    }) {
                        Text("Update Password", color = PrimaryVioletLight)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showChangePasswordDialog = false }) {
                        Text("Cancel", color = TextSecondary)
                    }
                }
            )
        }

        // Clear Cache Confirmation
        if (showClearCacheConfirm) {
            AlertDialog(
                onDismissRequest = { showClearCacheConfirm = false },
                title = { Text("Clear Local Cache") },
                text = { Text("This will remove all offline cached entries and image thumbnails. They will reload from the server when accessed.") },
                confirmButton = {
                    TextButton(onClick = {
                        showClearCacheConfirm = false
                        viewModel.clearLocalCache {}
                    }) {
                        Text("Clear", color = PrimaryVioletLight)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearCacheConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Logout Dialog
        if (showLogoutDialog) {
            AlertDialog(
                onDismissRequest = { showLogoutDialog = false },
                title = { Text("Log Out") },
                text = { Text("Are you sure you want to end your current session?") },
                confirmButton = {
                    TextButton(onClick = {
                        showLogoutDialog = false
                        viewModel.logout(onLoggedOut)
                    }) {
                        Text("Log Out", color = ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Delete Account Dialog
        if (showDeleteAccountDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteAccountDialog = false },
                title = { Text("Delete Account Permanently") },
                text = { Text("WARNING: This will permanently delete your account, all people, images from private storage, and activity logs. This cannot be undone.") },
                confirmButton = {
                    TextButton(onClick = {
                        showDeleteAccountDialog = false
                        viewModel.deleteAccount(onLoggedOut)
                    }) {
                        Text("Permanently Delete", color = ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteAccountDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun SettingsRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    tint: Color = PrimaryVioletLight
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(22.dp)
        )
        Spacer(modifier = Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = if (tint == ErrorRed) ErrorRed else TextPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = TextMuted,
            modifier = Modifier.size(20.dp)
        )
    }
}
