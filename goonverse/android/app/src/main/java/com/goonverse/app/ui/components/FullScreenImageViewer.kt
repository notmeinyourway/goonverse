package com.goonverse.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.goonverse.app.domain.model.ImageAccess
import com.goonverse.app.domain.repository.ImagesRepository
import com.goonverse.app.ui.theme.BackgroundDark
import com.goonverse.app.ui.theme.ErrorRed
import kotlinx.coroutines.launch

@Composable
fun FullScreenImageViewer(
    imageId: String,
    imagesRepository: ImagesRepository,
    onDismiss: () -> Unit,
    onDeleted: () -> Unit
) {
    var imageAccess by remember { mutableStateOf<ImageAccess?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(imageId) {
        isLoading = true
        errorMessage = null
        val result = imagesRepository.getImageAccess(imageId)
        result.onSuccess {
            imageAccess = it
            isLoading = false
        }.onFailure {
            errorMessage = it.message ?: "Could not load image"
            isLoading = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark.copy(alpha = 0.96f))
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = MaterialTheme.colorScheme.primary
            )
        } else if (errorMessage != null) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(text = errorMessage!!, color = ErrorRed, style = MaterialTheme.typography.bodyLarge)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    coroutineScope.launch {
                        isLoading = true
                        errorMessage = null
                        imagesRepository.getImageAccess(imageId).onSuccess {
                            imageAccess = it
                            isLoading = false
                        }.onFailure {
                            errorMessage = it.message
                            isLoading = false
                        }
                    }
                }) {
                    Text("Retry")
                }
            }
        } else if (imageAccess != null) {
            AsyncImage(
                model = imageAccess!!.url,
                contentDescription = imageAccess!!.originalFilename,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Top actions
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onDismiss,
                colors = IconButtonDefaults.iconButtonColors(containerColor = Color.Black.copy(alpha = 0.5f))
            ) {
                Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }

            IconButton(
                onClick = { showDeleteConfirm = true },
                colors = IconButtonDefaults.iconButtonColors(containerColor = Color.Black.copy(alpha = 0.5f))
            ) {
                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete Image", tint = ErrorRed)
            }
        }

        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirm = false },
                title = { Text("Delete Image") },
                text = { Text("Are you sure you want to delete this image? This action cannot be undone.") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showDeleteConfirm = false
                            coroutineScope.launch {
                                imagesRepository.deleteImage(imageId)
                                onDeleted()
                            }
                        }
                    ) {
                        Text("Delete", color = ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}
