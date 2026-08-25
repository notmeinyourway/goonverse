package com.goonverse.app.ui.people

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.domain.model.ActivityItem
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.ui.components.*
import com.goonverse.app.ui.theme.*
import java.io.File
import java.io.FileOutputStream

fun copyUriToTempFile(context: Context, uri: Uri): File? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri) ?: return null
        val tempFile = File.createTempFile("upload_", ".jpg", context.cacheDir)
        val outputStream = FileOutputStream(tempFile)
        inputStream.use { input ->
            outputStream.use { output ->
                input.copyTo(output)
            }
        }
        tempFile
    } catch (e: Exception) {
        null
    }
}

@Composable
fun PersonActivityItemCard(activity: ActivityItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = Shapes.medium,
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(PrimaryViolet.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = PrimaryVioletLight,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = activity.occurredAt.take(10) + " • " + (if (activity.occurredAt.length > 16) activity.occurredAt.substring(11, 16) else ""),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                if (!activity.notes.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = activity.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonDetailScreen(
    personId: String,
    viewModel: PeopleViewModel,
    imagesRepository: ImagesRepository,
    onBackClick: () -> Unit,
    onNavigateToAddActivity: (String?, String?) -> Unit,
    onPersonDeleted: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val person = uiState.selectedPerson
    val context = LocalContext.current

    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var selectedImageIdForViewer by remember { mutableStateOf<String?>(null) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val file = copyUriToTempFile(context, uri)
            if (file != null) {
                viewModel.uploadImageToPerson(personId, file, tags = null) {
                    // Upload finished
                }
            }
        }
    }

    LaunchedEffect(personId) {
        viewModel.loadPersonDetail(personId)
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = person?.name ?: "Person Details",
                onBackClick = onBackClick,
                actions = {
                    IconButton(onClick = { showEditDialog = true }) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit", tint = TextPrimary)
                    }
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed)
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
            if (uiState.isLoading && person == null) {
                Column(modifier = Modifier.padding(16.dp)) {
                    LoadingSkeleton(height = 100)
                    Spacer(modifier = Modifier.height(16.dp))
                    LoadingSkeleton(height = 150)
                }
            } else if (person == null) {
                EmptyState(
                    title = "Person Not Found",
                    description = "This person does not exist or was deleted.",
                    actionText = "Go Back",
                    onActionClick = onBackClick
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 40.dp)
                ) {
                    // Person Header Card
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            shape = Shapes.large,
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(BorderSubtle, BorderSubtle)))
                        ) {
                            Column(modifier = Modifier.padding(20.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(54.dp)
                                            .background(PrimaryViolet.copy(alpha = 0.2f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = person.name.take(1).uppercase(),
                                            style = MaterialTheme.typography.headlineMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryVioletLight
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(
                                            text = person.name,
                                            style = MaterialTheme.typography.headlineSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                        if (!person.notes.isNullOrEmpty()) {
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = person.notes,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = TextSecondary
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))
                                HorizontalDivider(color = BorderSubtle)
                                Spacer(modifier = Modifier.height(16.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceAround
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "${uiState.selectedPersonImages.size}",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryVioletLight
                                        )
                                        Text(text = "Images", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = "${uiState.selectedPersonActivities.size}",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = AccentCrimson
                                        )
                                        Text(text = "Activities", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    PrimaryButton(
                                        text = "+ Upload Image",
                                        onClick = { imagePickerLauncher.launch("image/*") },
                                        isLoading = uiState.isUploadingImage,
                                        modifier = Modifier.weight(1f),
                                        icon = Icons.Default.AddPhotoAlternate
                                    )
                                    SecondaryButton(
                                        text = "+ Activity",
                                        onClick = { onNavigateToAddActivity(person.id, null) },
                                        modifier = Modifier.weight(1f),
                                        icon = Icons.Default.Add
                                    )
                                }
                            }
                        }
                    }

                    // Images Gallery Section
                    item {
                        SectionHeader(
                            title = "Images (${uiState.selectedPersonImages.size})",
                            actionText = if (uiState.selectedPersonImages.isNotEmpty()) "+ Add" else null,
                            onActionClick = { imagePickerLauncher.launch("image/*") }
                        )
                    }

                    if (uiState.selectedPersonImages.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp),
                                shape = Shapes.medium,
                                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Image,
                                        contentDescription = null,
                                        tint = TextMuted,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No images associated with this person yet.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    } else {
                        item {
                            val chunked = uiState.selectedPersonImages.chunked(3)
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp)
                            ) {
                                for (row in chunked) {
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
                                                onClick = { selectedImageIdForViewer = img.id },
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

                    // Activity History Section
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        SectionHeader(
                            title = "Recent Activities (${uiState.selectedPersonActivities.size})",
                            actionText = if (uiState.selectedPersonActivities.isNotEmpty()) "+ Record" else null,
                            onActionClick = { onNavigateToAddActivity(person.id, null) }
                        )
                    }

                    if (uiState.selectedPersonActivities.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp),
                                shape = Shapes.medium,
                                colors = CardDefaults.cardColors(containerColor = SurfaceDark)
                            ) {
                                Text(
                                    text = "No activities recorded for this person yet.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMuted,
                                    modifier = Modifier.padding(16.dp)
                                )
                            }
                        }
                    } else {
                        items(uiState.selectedPersonActivities, key = { it.id }) { activity ->
                            Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                                PersonActivityItemCard(activity = activity)
                            }
                        }
                    }
                }
            }

            // Full-screen image viewer overlay
            if (selectedImageIdForViewer != null) {
                FullScreenImageViewer(
                    imageId = selectedImageIdForViewer!!,
                    imagesRepository = imagesRepository,
                    onDismiss = { selectedImageIdForViewer = null },
                    onDeleted = {
                        selectedImageIdForViewer = null
                        viewModel.loadPersonDetail(personId)
                    }
                )
            }
        }

        if (showEditDialog && person != null) {
            CreatePersonDialog(
                onDismiss = { showEditDialog = false },
                onConfirm = { name, notes ->
                    viewModel.updatePerson(person.id, name, notes) {
                        showEditDialog = false
                    }
                },
                initialName = person.name,
                initialNotes = person.notes,
                isEdit = true
            )
        }

        if (showDeleteDialog && person != null) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("Delete Person") },
                text = { Text("Are you sure you want to delete ${person.name}? All associated images and activity links will also be removed.") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showDeleteDialog = false
                            viewModel.deletePerson(person.id) {
                                onPersonDeleted()
                            }
                        }
                    ) {
                        Text("Delete", color = ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}
