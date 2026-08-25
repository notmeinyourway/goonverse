package com.goonverse.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.ui.theme.*

sealed class BottomNavItem(val route: String, val title: String, val icon: ImageVector) {
    object Home : BottomNavItem(Screen.Home.route, "Home", Icons.Default.Home)
    object People : BottomNavItem(Screen.People.route, "People", Icons.Default.People)
    object History : BottomNavItem(Screen.History.route, "History", Icons.Default.History)
    object Stats : BottomNavItem(Screen.Stats.route, "Stats", Icons.Default.BarChart)
    object Settings : BottomNavItem(Screen.Settings.route, "Settings", Icons.Default.Settings)
}

@Composable
fun BottomNavBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.People,
        BottomNavItem.History,
        BottomNavItem.Stats,
        BottomNavItem.Settings
    )

    NavigationBar(
        containerColor = SurfaceDark,
        tonalElevation = 8.dp
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (currentRoute != item.route) {
                        onNavigate(item.route)
                    }
                },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title,
                        tint = if (selected) PrimaryVioletLight else TextMuted
                    )
                },
                label = {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        color = if (selected) PrimaryVioletLight else TextMuted
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = PrimaryViolet.copy(alpha = 0.2f),
                    selectedIconColor = PrimaryVioletLight,
                    unselectedIconColor = TextMuted
                )
            )
        }
    }
}
