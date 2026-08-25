package com.goonverse.app.ui.people

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.goonverse.app.ui.components.GoonverseTextField
import com.goonverse.app.ui.components.PrimaryButton
import com.goonverse.app.ui.components.SecondaryButton
import com.goonverse.app.ui.theme.Shapes
import com.goonverse.app.ui.theme.SurfaceDark
import com.goonverse.app.ui.theme.TextPrimary

@Composable
fun CreatePersonDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, notes: String?) -> Unit,
    initialName: String = "",
    initialNotes: String? = null,
    isEdit: Boolean = false
) {
    var name by remember { mutableStateOf(initialName) }
    var notes by remember { mutableStateOf(initialNotes ?: "") }
    var nameError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceDark,
        shape = Shapes.large,
        title = {
            Text(
                text = if (isEdit) "Edit Person" else "New Person Entry",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                GoonverseTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        nameError = null
                    },
                    label = "Name",
                    placeholder = "e.g. Alice",
                    isError = nameError != null,
                    errorMessage = nameError
                )

                Spacer(modifier = Modifier.height(12.dp))

                GoonverseTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = "Notes (Optional)",
                    placeholder = "Preferences, private notes...",
                    singleLine = false,
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            PrimaryButton(
                text = if (isEdit) "Save Changes" else "Create Person",
                onClick = {
                    if (name.isBlank()) {
                        nameError = "Name cannot be empty"
                    } else {
                        onConfirm(name.trim(), notes.trim().ifEmpty { null })
                    }
                },
                modifier = Modifier.width(140.dp)
            )
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Cancel", color = TextPrimary)
            }
        }
    )
}
