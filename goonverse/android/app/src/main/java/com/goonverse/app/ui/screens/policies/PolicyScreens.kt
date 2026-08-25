package com.goonverse.app.ui.screens.policies

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.goonverse.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacyPolicyScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy Policy") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark,
                    titleContentColor = TextPrimary,
                    navigationIconContentColor = TextPrimary
                )
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Goonverse Privacy Commitment",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = PrimaryViolet
            )

            Text(
                text = "Effective Date: August 2026\n\n" +
                        "1. Strict Private Storage: All images and activity logs recorded in Goonverse are stored in private, non-public Backblaze B2 encrypted cloud storage vaults. No public links are ever generated.\n\n" +
                        "2. Owner-Isolated Data: Content is accessible exclusively to your authenticated credentials through short-lived signed URLs. No social discovery, sharing feeds, or public profiles exist.\n\n" +
                        "3. Zero Advertising / Tracking: We do not sell user data, track off-platform behaviors, or utilize invasive advertising SDKs.\n\n" +
                        "4. Account Deletion: You may request complete account deletion at any time via Settings, which initiates permanent removal of your metadata and associated cloud storage objects.\n\n" +
                        "5. Audited Moderation: To ensure compliance with strict 18+ and legal standards, administrative personnel actions are logged in an immutable security audit trail.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.3
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TermsOfServiceScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Terms of Service") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark,
                    titleContentColor = TextPrimary,
                    navigationIconContentColor = TextPrimary
                )
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Terms & Conditions of Service",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = PrimaryViolet
            )

            Text(
                text = "1. Age Requirement (18+): You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account or use Goonverse. Underage access is strictly prohibited.\n\n" +
                        "2. Personal Private Use: Goonverse is provided solely for personal organization and habit tracking. You agree not to upload content you do not have the right to possess.\n\n" +
                        "3. Prohibited Misuse: You may not attempt to reverse engineer, disrupt, or exploit the platform infrastructure.\n\n" +
                        "4. Suspension & Termination: Accounts found in violation of our Content Policy or Terms will be subject to immediate suspension, session revocation, and data removal.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.3
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentPolicyScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Content Policy") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark,
                    titleContentColor = TextPrimary,
                    navigationIconContentColor = TextPrimary
                )
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = ErrorRed.copy(alpha = 0.15f)),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(ErrorRed))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Warning, contentDescription = "Alert", tint = ErrorRed)
                    Text(
                        text = "Zero Tolerance Policy: Immediate permanent termination and referral to law enforcement where required.",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = ErrorRed
                    )
                }
            }

            Text(
                text = "Strictly Prohibited Content:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Text(
                text = "• Minors / Child Sexual Abuse Material (CSAM): Absolute zero tolerance.\n\n" +
                        "• Non-Consensual Intimate Imagery (NCII): Uploading photos or depictions without consent is strictly prohibited.\n\n" +
                        "• Extreme Violence or Exploitative Material: Content depicting physical abuse, illegal harm, or exploitation is forbidden.\n\n" +
                        "• Copyright & Ownership Infringement: Only upload media you are authorized to possess.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.3
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
