package com.goonverse.app.ui.history

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.ActivityItem
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    viewModel: HistoryViewModel,
    onNavigateToAddActivity: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var activityToDelete by remember { mutableStateOf<ActivityItem?>(null) }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Activity History",
                actions = {
                    IconButton(onClick = { viewModel.loadHistory() }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddActivity,
                containerColor = PrimaryViolet,
                contentColor = Color.White,
                shape = Shapes.medium
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Activity")
            }
        },
        containerColor = BackgroundDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundDark)
        ) {
            // Filter by Person Row
            if (uiState.people.isNotEmpty()) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        FilterChip(
                            selected = uiState.selectedPersonFilter == null,
                            onClick = { viewModel.loadHistory(null) },
                            label = { Text("All People") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryViolet,
                                selectedLabelColor = Color.White,
                                containerColor = SurfaceDark,
                                labelColor = TextSecondary
                            )
                        )
                    }
                    items(uiState.people, key = { it.id }) { person ->
                        FilterChip(
                            selected = uiState.selectedPersonFilter == person.id,
                            onClick = { viewModel.loadHistory(person.id) },
                            label = { Text(person.name) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryViolet,
                                selectedLabelColor = Color.White,
                                containerColor = SurfaceDark,
                                labelColor = TextSecondary
                            )
                        )
                    }
                }
            }

            if (uiState.isLoading && uiState.activities.isEmpty()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    LoadingSkeleton(height = 80)
                    Spacer(modifier = Modifier.height(12.dp))
                    LoadingSkeleton(height = 80)
                    Spacer(modifier = Modifier.height(12.dp))
                    LoadingSkeleton(height = 80)
                }
            } else if (uiState.errorMessage != null && uiState.activities.isEmpty()) {
                ErrorCard(
                    message = uiState.errorMessage!!,
                    onRetry = { viewModel.loadHistory() },
                    modifier = Modifier.padding(16.dp)
                )
            } else if (uiState.activities.isEmpty()) {
                EmptyState(
                    title = "No Activities Recorded",
                    description = if (uiState.selectedPersonFilter != null) "No activities found for this person." else "Start tracking your activity by tapping the button below.",
                    icon = Icons.Default.History,
                    actionText = "+ Record First Activity",
                    onActionClick = onNavigateToAddActivity
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 88.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.activities, key = { it.id }) { activity ->
                        HistoryActivityRowCard(
                            activity = activity,
                            onDelete = { activityToDelete = activity }
                        )
                    }
                }
            }
        }

        if (activityToDelete != null) {
            AlertDialog(
                onDismissRequest = { activityToDelete = null },
                title = { Text("Delete Activity") },
                text = { Text("Are you sure you want to remove this activity record from your timeline?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            val id = activityToDelete!!.id
                            activityToDelete = null
                            viewModel.deleteActivity(id)
                        }
                    ) {
                        Text("Delete", color = ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { activityToDelete = null }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun HistoryActivityRowCard(
    activity: ActivityItem,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = Shapes.medium,
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(
                        if (activity.personName != null) PrimaryViolet.copy(alpha = 0.2f) else SurfaceVariantDark,
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (activity.personName != null) Icons.Default.Person else Icons.Default.Check,
                    contentDescription = null,
                    tint = if (activity.personName != null) PrimaryVioletLight else TextSecondary,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = activity.personName ?: "Solo Activity",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = formatDateTime(activity.occurredAt),
                    style = MaterialTheme.typography.bodySmall,
                    fontSize = 11.sp,
                    color = TextMuted
                )
                if (!activity.notes.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = activity.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }

            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "Delete",
                    tint = TextMuted
                )
            }
        }
    }
}

fun formatDateTime(isoString: String): String {
    return if (isoString.length >= 16) {
        val datePart = isoString.take(10)
        val timePart = isoString.substring(11, 16)
        "$datePart at $timePart UTC"
    } else {
        isoString
    }
}
