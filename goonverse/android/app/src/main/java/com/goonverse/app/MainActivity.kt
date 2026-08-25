package com.goonverse.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.goonverse.app.ui.navigation.AppNavigation
import com.goonverse.app.ui.theme.BackgroundDark
import com.goonverse.app.ui.theme.GoonverseTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as GoonverseApp

        setContent {
            GoonverseTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BackgroundDark
                ) {
                    val navController = rememberNavController()
                    AppNavigation(
                        navController = navController,
                        authRepository = app.authRepository,
                        peopleRepository = app.peopleRepository,
                        imagesRepository = app.imagesRepository,
                        activitiesRepository = app.activitiesRepository,
                        statsRepository = app.statsRepository,
                        database = app.database
                    )
                }
            }
        }
    }
}
