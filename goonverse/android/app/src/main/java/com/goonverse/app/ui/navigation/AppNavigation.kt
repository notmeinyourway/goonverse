package com.goonverse.app.ui.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.goonverse.app.data.local.GoonverseDatabase
import com.goonverse.app.domain.repository.*
import com.goonverse.app.ui.activity.AddActivityScreen
import com.goonverse.app.ui.activity.AddActivityViewModel
import com.goonverse.app.ui.auth.AuthViewModel
import com.goonverse.app.ui.auth.LoginScreen
import com.goonverse.app.ui.auth.RegisterScreen
import com.goonverse.app.ui.components.FullScreenImageViewer
import com.goonverse.app.ui.history.HistoryScreen
import com.goonverse.app.ui.history.HistoryViewModel
import com.goonverse.app.ui.home.HomeScreen
import com.goonverse.app.ui.home.HomeViewModel
import com.goonverse.app.ui.people.PeopleScreen
import com.goonverse.app.ui.people.PeopleViewModel
import com.goonverse.app.ui.people.PersonDetailScreen
import com.goonverse.app.ui.settings.SettingsScreen
import com.goonverse.app.ui.settings.SettingsViewModel
import com.goonverse.app.ui.stats.StatsScreen
import com.goonverse.app.ui.stats.StatsViewModel
import com.goonverse.app.ui.theme.BackgroundDark

@Composable
fun AppNavigation(
    navController: NavHostController,
    authRepository: AuthRepository,
    peopleRepository: PeopleRepository,
    imagesRepository: ImagesRepository,
    activitiesRepository: ActivitiesRepository,
    statsRepository: StatsRepository,
    database: GoonverseDatabase
) {
    val isAuthenticated by authRepository.isAuthenticated.collectAsState(initial = authRepository.getCachedUser() != null)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isTopLevelRoute = currentRoute in listOf(
        Screen.Home.route,
        Screen.People.route,
        Screen.History.route,
        Screen.Stats.route,
        Screen.Settings.route
    )

    Scaffold(
        bottomBar = {
            if (isAuthenticated && isTopLevelRoute) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        },
        containerColor = BackgroundDark
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isAuthenticated) Screen.Home.route else Screen.Login.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Auth Flow
            composable(Screen.Login.route) {
                val authViewModel = remember { AuthViewModel(authRepository) }
                LoginScreen(
                    viewModel = authViewModel,
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Register.route) {
                val authViewModel = remember { AuthViewModel(authRepository) }
                RegisterScreen(
                    viewModel = authViewModel,
                    onNavigateToLogin = { navController.popBackStack() },
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // Main Tab Screens
            composable(Screen.Home.route) {
                val homeViewModel = remember { HomeViewModel(statsRepository, peopleRepository, imagesRepository) }
                HomeScreen(
                    viewModel = homeViewModel,
                    imagesRepository = imagesRepository,
                    onNavigateToAddActivity = { personId, imageId ->
                        navController.navigate(Screen.AddActivity.createRoute(personId, imageId))
                    },
                    onNavigateToPerson = { personId ->
                        navController.navigate(Screen.PersonDetail.createRoute(personId))
                    },
                    onNavigateToPeopleTab = {
                        navController.navigate(Screen.People.route)
                    },
                    onNavigateToImage = { imageId ->
                        navController.navigate(Screen.FullScreenImage.createRoute(imageId))
                    }
                )
            }

            composable(Screen.People.route) {
                val peopleViewModel = remember { PeopleViewModel(peopleRepository, imagesRepository, activitiesRepository) }
                PeopleScreen(
                    viewModel = peopleViewModel,
                    onNavigateToPersonDetail = { personId ->
                        navController.navigate(Screen.PersonDetail.createRoute(personId))
                    }
                )
            }

            composable(Screen.History.route) {
                val historyViewModel = remember { HistoryViewModel(activitiesRepository, peopleRepository) }
                HistoryScreen(
                    viewModel = historyViewModel,
                    onNavigateToAddActivity = {
                        navController.navigate(Screen.AddActivity.createRoute(null, null))
                    }
                )
            }

            composable(Screen.Stats.route) {
                val statsViewModel = remember { StatsViewModel(statsRepository) }
                StatsScreen(viewModel = statsViewModel)
            }

            composable(Screen.Settings.route) {
                val settingsViewModel = remember { SettingsViewModel(authRepository, database) }
                SettingsScreen(
                    viewModel = settingsViewModel,
                    onLoggedOut = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onNavigateToPrivacy = { navController.navigate(Screen.PrivacyPolicy.route) },
                    onNavigateToTerms = { navController.navigate(Screen.TermsOfService.route) },
                    onNavigateToContentPolicy = { navController.navigate(Screen.ContentPolicy.route) }
                )
            }

            // Detail & Action Flow
            composable(
                route = Screen.PersonDetail.route,
                arguments = listOf(navArgument("personId") { type = NavType.StringType })
            ) { backStackEntry ->
                val personId = backStackEntry.arguments?.getString("personId") ?: ""
                val peopleViewModel = remember { PeopleViewModel(peopleRepository, imagesRepository, activitiesRepository) }
                PersonDetailScreen(
                    personId = personId,
                    viewModel = peopleViewModel,
                    imagesRepository = imagesRepository,
                    onBackClick = { navController.popBackStack() },
                    onNavigateToAddActivity = { pId, imgId ->
                        navController.navigate(Screen.AddActivity.createRoute(pId, imgId))
                    },
                    onPersonDeleted = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.AddActivity.route,
                arguments = listOf(
                    navArgument("personId") {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    },
                    navArgument("imageId") {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { backStackEntry ->
                val personId = backStackEntry.arguments?.getString("personId")
                val imageId = backStackEntry.arguments?.getString("imageId")
                val addActivityViewModel = remember {
                    AddActivityViewModel(activitiesRepository, peopleRepository, imagesRepository)
                }
                AddActivityScreen(
                    personIdParam = personId,
                    imageIdParam = imageId,
                    viewModel = addActivityViewModel,
                    imagesRepository = imagesRepository,
                    onBackClick = { navController.popBackStack() },
                    onActivitySaved = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.FullScreenImage.route,
                arguments = listOf(navArgument("imageId") { type = NavType.StringType })
            ) { backStackEntry ->
                val imageId = backStackEntry.arguments?.getString("imageId") ?: ""
                FullScreenImageViewer(
                    imageId = imageId,
                    imagesRepository = imagesRepository,
                    onDismiss = { navController.popBackStack() },
                    onDeleted = { navController.popBackStack() }
                )
            }

            // Policy Screens
            composable(Screen.PrivacyPolicy.route) {
                com.goonverse.app.ui.screens.policies.PrivacyPolicyScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.TermsOfService.route) {
                com.goonverse.app.ui.screens.policies.TermsOfServiceScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.ContentPolicy.route) {
                com.goonverse.app.ui.screens.policies.ContentPolicyScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
