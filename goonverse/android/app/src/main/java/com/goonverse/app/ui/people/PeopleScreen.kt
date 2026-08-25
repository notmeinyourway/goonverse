package com.goonverse.app.ui.people

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.Person
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PeopleScreen(
    viewModel: PeopleViewModel,
    onNavigateToPersonDetail: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "People",
                actions = {
                    IconButton(onClick = { viewModel.loadPeople(searchQuery.ifEmpty { null }) }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = PrimaryViolet,
                contentColor = Color.White,
                shape = Shapes.medium
            ) {
                Icon(imageVector = Icons.Default.PersonAdd, contentDescription = "Add Person")
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
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    viewModel.loadPeople(it.ifEmpty { null })
                },
                placeholder = { Text("Search people by name...", color = TextMuted, fontSize = 14.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary) },
                trailingIcon = if (searchQuery.isNotEmpty()) {
                    {
                        IconButton(onClick = {
                            searchQuery = ""
                            viewModel.loadPeople(null)
                        }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextSecondary)
                        }
                    }
                } else null,
                shape = Shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark,
                    focusedBorderColor = PrimaryViolet,
                    unfocusedBorderColor = BorderSubtle,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            if (uiState.isLoading && uiState.people.isEmpty()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    LoadingSkeleton(height = 70)
                    Spacer(modifier = Modifier.height(12.dp))
                    LoadingSkeleton(height = 70)
                    Spacer(modifier = Modifier.height(12.dp))
                    LoadingSkeleton(height = 70)
                }
            } else if (uiState.errorMessage != null && uiState.people.isEmpty()) {
                ErrorCard(
                    message = uiState.errorMessage!!,
                    onRetry = { viewModel.loadPeople() },
                    modifier = Modifier.padding(16.dp)
                )
            } else if (uiState.people.isEmpty()) {
                EmptyState(
                    title = "No People Found",
                    description = if (searchQuery.isNotEmpty()) "No results matching '$searchQuery'." else "You haven't added any people entries yet.",
                    icon = Icons.Default.PeopleOutline,
                    actionText = if (searchQuery.isEmpty()) "+ Add Person" else null,
                    onActionClick = { showCreateDialog = true }
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 88.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uiState.people, key = { it.id }) { person ->
                        PersonListItemCard(
                            person = person,
                            onClick = { onNavigateToPersonDetail(person.id) }
                        )
                    }
                }
            }
        }

        if (showCreateDialog) {
            CreatePersonDialog(
                onDismiss = { showCreateDialog = false },
                onConfirm = { name, notes ->
                    viewModel.createPerson(name, notes) {
                        showCreateDialog = false
                    }
                }
            )
        }
    }
}

@Composable
fun PersonListItemCard(
    person: Person,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
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
                    .size(48.dp)
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

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = person.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!person.notes.isNullOrEmpty()) {
                    Text(
                        text = person.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row {
                    Text(
                        text = "${person.imageCount} ${if (person.imageCount == 1) "image" else "images"}",
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = PrimaryVioletLight
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                    Text(
                        text = "${person.activityCount} ${if (person.activityCount == 1) "activity" else "activities"}",
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = TextMuted
            )
        }
    }
}
