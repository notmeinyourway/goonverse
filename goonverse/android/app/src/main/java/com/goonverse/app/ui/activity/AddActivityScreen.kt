package com.goonverse.app.ui.activity

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.Person
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddActivityScreen(
    personIdParam: String?,
    imageIdParam: String?,
    viewModel: AddActivityViewModel,
    imagesRepository: ImagesRepository,
    onBackClick: () -> Unit,
    onActivitySaved: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    LaunchedEffect(personIdParam, imageIdParam) {
        viewModel.initialize(personIdParam, imageIdParam)
    }

    val displayDate = remember {
        SimpleDateFormat("EEE, MMM d, yyyy • h:mm a", Locale.getDefault()).format(Date())
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Record Activity",
                onBackClick = onBackClick
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Timestamp Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = Shapes.medium,
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.AccessTime,
                        contentDescription = null,
                        tint = PrimaryVioletLight,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Time of Activity",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted
                        )
                        Text(
                            text = displayDate,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                }
            }

            // Person Picker Section
            Column {
                Text(
                    text = "Select Person (Optional)",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        FilterChip(
                            selected = uiState.selectedPersonId == null,
                            onClick = { viewModel.onPersonSelected(null) },
                            label = { Text("None") },
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
                            selected = uiState.selectedPersonId == person.id,
                            onClick = { viewModel.onPersonSelected(person.id) },
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

            // Image Picker Section (if images available for person or general)
            if (uiState.availableImages.isNotEmpty()) {
                Column {
                    Text(
                        text = "Associated Image (Optional)",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(uiState.availableImages, key = { it.id }) { img ->
                            val isSelected = uiState.selectedImageId == img.id
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(Shapes.small)
                                    .border(
                                        width = if (isSelected) 3.dp else 1.dp,
                                        color = if (isSelected) PrimaryVioletLight else BorderSubtle,
                                        shape = Shapes.small
                                    )
                                    .clickable {
                                        if (isSelected) {
                                            viewModel.onImageSelected(null)
                                        } else {
                                            viewModel.onImageSelected(img.id)
                                        }
                                    }
                            ) {
                                AppImageThumbnail(
                                    image = img,
                                    imagesRepository = imagesRepository,
                                    onClick = {
                                        if (isSelected) viewModel.onImageSelected(null) else viewModel.onImageSelected(img.id)
                                    }
                                )
                                if (isSelected) {
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(4.dp)
                                            .size(18.dp)
                                            .background(PrimaryViolet, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Notes field
            GoonverseTextField(
                value = uiState.notes,
                onValueChange = { viewModel.onNotesChanged(it) },
                label = "Notes (Optional)",
                placeholder = "Add details, session notes, duration, tags...",
                singleLine = false,
                maxLines = 4
            )

            if (uiState.errorMessage != null) {
                Text(
                    text = uiState.errorMessage!!,
                    style = MaterialTheme.typography.bodySmall,
                    color = ErrorRed
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            PrimaryButton(
                text = "Save Activity",
                onClick = {
                    viewModel.saveActivity(onActivitySaved)
                },
                isLoading = uiState.isLoading,
                icon = Icons.Default.Check
            )
        }
    }
}
