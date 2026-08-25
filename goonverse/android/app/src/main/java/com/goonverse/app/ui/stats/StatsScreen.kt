package com.goonverse.app.ui.stats

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.StreakMilestone
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatsScreen(
    viewModel: StatsViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Statistics & Streaks",
                actions = {
                    IconButton(onClick = { viewModel.loadStats() }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                }
            )
        },
        containerColor = BackgroundDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundDark)
        ) {
            if (uiState.isLoading && uiState.overview == null) {
                Column(modifier = Modifier.padding(16.dp)) {
                    LoadingSkeleton(height = 100)
                    Spacer(modifier = Modifier.height(14.dp))
                    LoadingSkeleton(height = 120)
                    Spacer(modifier = Modifier.height(14.dp))
                    LoadingSkeleton(height = 160)
                }
            } else if (uiState.errorMessage != null && uiState.overview == null) {
                ErrorCard(
                    message = uiState.errorMessage!!,
                    onRetry = { viewModel.loadStats() },
                    modifier = Modifier.padding(16.dp)
                )
            } else {
                val overview = uiState.overview
                val streak = uiState.streakDetails
                val calendar = uiState.calendarStats

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // Streaks summary card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = Shapes.large,
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        border = CardDefaults.outlinedCardBorder().copy(
                            brush = Brush.horizontalGradient(
                                listOf(PrimaryViolet.copy(alpha = 0.6f), AccentCrimson.copy(alpha = 0.6f))
                            )
                        )
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = AccentAmber,
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Streak Performance",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(text = "Current Streak", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    Text(
                                        text = "${streak?.currentStreak ?: overview?.currentStreak ?: 0} Days",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Black,
                                        color = AccentAmber
                                    )
                                }
                                Column {
                                    Text(text = "Longest Streak", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    Text(
                                        text = "${streak?.longestStreak ?: overview?.longestStreak ?: 0} Days",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Black,
                                        color = TextPrimary
                                    )
                                }
                                Column {
                                    Text(text = "Active Days", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    Text(
                                        text = "${streak?.totalActiveDays ?: overview?.totalActiveDays ?: 0}",
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Black,
                                        color = AccentEmerald
                                    )
                                }
                            }
                        }
                    }

                    // Activity Timeframes Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatCard(
                            title = "Today",
                            value = "${overview?.todayActivities ?: 0}",
                            icon = Icons.Default.Today,
                            accentColor = PrimaryVioletLight,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "This Week",
                            value = "${overview?.weeklyActivities ?: 0}",
                            icon = Icons.Default.DateRange,
                            accentColor = AccentAmber,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "This Month",
                            value = "${overview?.monthlyActivities ?: 0}",
                            icon = Icons.Default.CalendarMonth,
                            accentColor = AccentEmerald,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Vault Totals Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatCard(
                            title = "Total Activities",
                            value = "${overview?.totalActivities ?: 0}",
                            icon = Icons.Default.History,
                            accentColor = PrimaryViolet,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "People Vault",
                            value = "${overview?.totalPeople ?: 0}",
                            icon = Icons.Default.People,
                            accentColor = AccentCrimson,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "Saved Images",
                            value = "${overview?.totalImages ?: 0}",
                            icon = Icons.Default.PhotoLibrary,
                            accentColor = PrimaryVioletLight,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 90-day Calendar Heatmap
                    HeatmapCalendar(
                        activityCounts = calendar?.days ?: emptyMap(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Streak Milestones Section
                    if (streak != null && streak.milestones.isNotEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = Shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Streak Milestones",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )

                                for (milestone in streak.milestones) {
                                    MilestoneRow(milestone = milestone)
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
fun MilestoneRow(milestone: StreakMilestone) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(Shapes.small)
            .background(if (milestone.achieved) PrimaryViolet.copy(alpha = 0.12f) else SurfaceVariantDark)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (milestone.achieved) Icons.Default.EmojiEvents else Icons.Default.Lock,
                contentDescription = null,
                tint = if (milestone.achieved) AccentAmber else TextMuted,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "${milestone.target} Days • ${milestone.name}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (milestone.achieved) TextPrimary else TextSecondary
                )
            }
        }

        if (milestone.achieved) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(AccentEmerald.copy(alpha = 0.2f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "Achieved",
                    style = MaterialTheme.typography.labelSmall,
                    color = AccentEmerald,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Text(
                text = "Locked",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }
    }
}
