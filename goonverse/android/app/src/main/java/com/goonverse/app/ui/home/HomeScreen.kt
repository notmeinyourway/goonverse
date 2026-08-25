package com.goonverse.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    imagesRepository: ImagesRepository,
    onNavigateToAddActivity: (String?, String?) -> Unit,
    onNavigateToPerson: (String) -> Unit,
    onNavigateToPeopleTab: () -> Unit,
    onNavigateToImage: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    val greeting = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when (hour) {
            in 5..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            in 17..21 -> "Good evening"
            else -> "Good night"
        }
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Goonverse",
                actions = {
                    IconButton(onClick = { viewModel.loadHomeData(isRefresh = true) }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = TextSecondary
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { onNavigateToAddActivity(null, null) },
                icon = { Icon(Icons.Default.Add, contentDescription = null, tint = Color.White) },
                text = { Text("Add Activity", fontWeight = FontWeight.Bold, color = Color.White) },
                containerColor = PrimaryViolet,
                contentColor = Color.White,
                shape = Shapes.medium
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
            if (uiState.isLoading && uiState.stats == null) {
                Column(modifier = Modifier.padding(16.dp)) {
                    LoadingSkeleton(height = 120)
                    Spacer(modifier = Modifier.height(16.dp))
                    LoadingSkeleton(height = 100)
                    Spacer(modifier = Modifier.height(16.dp))
                    LoadingSkeleton(height = 150)
                }
            } else if (uiState.errorMessage != null && uiState.stats == null) {
                ErrorCard(
                    message = uiState.errorMessage!!,
                    onRetry = { viewModel.loadHomeData() },
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(bottom = 80.dp)
                ) {
                    // Header Greeting & Streak Card
                    val stats = uiState.stats
                    val currentStreak = stats?.currentStreak ?: 0
                    val longestStreak = stats?.longestStreak ?: 0

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = greeting,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                        Text(
                            text = "Private Vault",
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Streak Banner
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = Shapes.large,
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = Brush.horizontalGradient(
                                    listOf(
                                        PrimaryViolet.copy(alpha = 0.5f),
                                        AccentCrimson.copy(alpha = 0.5f)
                                    )
                                )
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(20.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.LocalFireDepartment,
                                            contentDescription = null,
                                            tint = if (currentStreak > 0) AccentAmber else TextMuted,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "CURRENT STREAK",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = AccentAmber
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "$currentStreak ${if (currentStreak == 1) "Day" else "Days"}",
                                        style = MaterialTheme.typography.headlineLarge,
                                        fontWeight = FontWeight.Black,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Longest streak: $longestStreak days",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .size(56.dp)
                                        .background(
                                            Brush.linearGradient(listOf(PrimaryViolet, AccentCrimson)),
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(32.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Quick Statistics Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            StatCard(
                                title = "Today's Activity",
                                value = "${stats?.todayActivities ?: 0}",
                                icon = Icons.Default.Today,
                                accentColor = AccentEmerald,
                                modifier = Modifier.weight(1f)
                            )
                            StatCard(
                                title = "Total Activities",
                                value = "${stats?.totalActivities ?: 0}",
                                icon = Icons.Default.BarChart,
                                accentColor = PrimaryVioletLight,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Recent People Section
                    SectionHeader(
                        title = "Recent People",
                        actionText = "View All",
                        onActionClick = onNavigateToPeopleTab
                    )

                    if (uiState.recentPeople.isEmpty()) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = Shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                        ) {
                            Text(
                                text = "No people created yet. Add people to organize your vault.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMuted,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    } else {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.recentPeople, key = { it.id }) { person ->
                                PersonQuickCard(
                                    person = person,
                                    onClick = { onNavigateToPerson(person.id) }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Recent Images Section
                    SectionHeader(title = "Recent Images")

                    if (uiState.recentImages.isEmpty()) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = Shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                        ) {
                            Text(
                                text = "No images uploaded yet. Upload images via Person details.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMuted,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                        ) {
                            val chunkedImages = uiState.recentImages.chunked(3)
                            for (row in chunkedImages) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    for (img in row) {
                                        AppImageThumbnail(
                                            image = img,
                                            imagesRepository = imagesRepository,
                                            onClick = { onNavigateToImage(img.id) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                    if (row.size < 3) {
                                        for (i in 0 until (3 - row.size)) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PersonQuickCard(
    person: Person,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(130.dp)
            .clickable { onClick() },
        shape = Shapes.medium,
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(PrimaryViolet.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = person.name.take(1).uppercase(),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryVioletLight
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = person.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${person.imageCount} imgs • ${person.activityCount} acts",
                style = MaterialTheme.typography.bodySmall,
                fontSize = 10.sp,
                color = TextMuted
            )
        }
    }
}
