package com.wellnessanticipator.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.wellnessanticipator.app.data.storage.TokenManager
import com.wellnessanticipator.app.ui.screens.*

object Destinations {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val DASHBOARD = "dashboard"
    const val VITALS_ENTRY = "vitals_entry"
    const val ASSESSMENT = "assessment"
    const val CONSENT = "consent"
    const val PROFILE = "profile"
}

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController()
) {
    val startDestination = if (TokenManager.hasToken()) {
        Destinations.DASHBOARD
    } else {
        Destinations.LOGIN
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Destinations.LOGIN) {
            LoginScreen(
                onNavigateToRegister = {
                    navController.navigate(Destinations.REGISTER)
                },
                onLoginSuccess = {
                    navController.navigate(Destinations.DASHBOARD) {
                        popUpTo(Destinations.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Destinations.REGISTER) {
            RegisterScreen(
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onRegisterSuccess = {
                    navController.navigate(Destinations.DASHBOARD) {
                        popUpTo(Destinations.REGISTER) { inclusive = true }
                    }
                }
            )
        }

        composable(Destinations.DASHBOARD) {
            DashboardScreen(
                onNavigateToVitals = { navController.navigate(Destinations.VITALS_ENTRY) },
                onNavigateToAssessment = { navController.navigate(Destinations.ASSESSMENT) },
                onNavigateToConsent = { navController.navigate(Destinations.CONSENT) },
                onNavigateToProfile = { navController.navigate(Destinations.PROFILE) },
                onLogout = {
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.DASHBOARD) { inclusive = true }
                    }
                }
            )
        }

        composable(Destinations.VITALS_ENTRY) {
            VitalsEntryScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Destinations.ASSESSMENT) {
            AssessmentScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Destinations.CONSENT) {
            ConsentScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Destinations.PROFILE) {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
