package com.goonverse.app.ui.navigation

sealed class Screen(val route: String) {
    // Auth Routes
    object Login : Screen("login")
    object Register : Screen("register")

    // Main Tabs
    object Home : Screen("home")
    object People : Screen("people")
    object History : Screen("history")
    object Stats : Screen("stats")
    object Settings : Screen("settings")

    // Detail & Action Routes
    object PersonDetail : Screen("person_detail/{personId}") {
        fun createRoute(personId: String) = "person_detail/$personId"
    }
    object AddActivity : Screen("add_activity?personId={personId}&imageId={imageId}") {
        fun createRoute(personId: String? = null, imageId: String? = null): String {
            val p = personId ?: ""
            val img = imageId ?: ""
            return "add_activity?personId=$p&imageId=$img"
        }
    }
    object FullScreenImage : Screen("fullscreen_image/{imageId}") {
        fun createRoute(imageId: String) = "fullscreen_image/$imageId"
    }

    // Policy & Legal
    object PrivacyPolicy : Screen("privacy_policy")
    object TermsOfService : Screen("terms_of_service")
    object ContentPolicy : Screen("content_policy")
}
