package com.wellnessanticipator.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.models.TrendsSummaryResponse
import com.wellnessanticipator.app.data.storage.TokenManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToVitals: () -> Unit,
    onNavigateToAssessment: () -> Unit,
    onNavigateToConsent: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onLogout: () -> Unit
) {
    var trendsData by remember { mutableStateOf<TrendsSummaryResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val refreshData = {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                val res = ApiClient.service.getTrendsSummary(14)
                if (res.isSuccessful && res.body() != null) {
                    trendsData = res.body()
                } else {
                    errorMessage = "Failed to load trends: ${res.code()}"
                }
            } catch (e: Exception) {
                errorMessage = "Network error: ${e.localizedMessage ?: "Unable to connect"}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Wellness Anticipator", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                },
                actions = {
                    IconButton(onClick = onNavigateToProfile) {
                        Icon(Icons.Default.Person, contentDescription = "Profile")
                    }
                    IconButton(onClick = onNavigateToConsent) {
                        Icon(Icons.Default.Shield, contentDescription = "Consents")
                    }
                    IconButton(onClick = {
                        TokenManager.clearToken()
                        onLogout()
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToVitals,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Log Vitals") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Clinical Governance Notice
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Personal longitudinal baselines & statistical screening. Never used alone for clinical diagnosis.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Assessment Quick Launch Card
                    Card(
                        onClick = onNavigateToAssessment,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Type 2 Diabetes Screening",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "ADA Clinical Score (0–10) & Calibrated ML Probability",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                )
                            }
                            Icon(
                                Icons.Default.ArrowForward,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    // Metrics Baselines Header
                    Text(
                        text = "14-Day Longitudinal Baselines",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    trendsData?.let { trends ->
                        // Steps Baseline
                        val steps = trends.metrics.steps
                        MetricSummaryCard(
                            title = "Daily Step Count",
                            status = steps.dataQualityStatus,
                            coverage = steps.coveragePercentage,
                            ewma = steps.ewma?.toInt()?.toString() ?: "N/A",
                            unit = "steps/day",
                            trendDirection = steps.trendDirection
                        )

                        // Sleep Baseline
                        val sleep = trends.metrics.sleepDuration
                        MetricSummaryCard(
                            title = "Sleep Duration",
                            status = sleep.dataQualityStatus,
                            coverage = sleep.coveragePercentage,
                            ewma = sleep.ewma?.let { String.format("%.1f", it / 60.0) } ?: "N/A",
                            unit = "hours/night",
                            trendDirection = sleep.trendDirection
                        )

                        // Systolic BP Baseline
                        val sbp = trends.metrics.systolicBp
                        MetricSummaryCard(
                            title = "Systolic Blood Pressure",
                            status = sbp.dataQualityStatus,
                            coverage = sbp.coveragePercentage,
                            ewma = sbp.ewma?.let { String.format("%.0f", it) } ?: "N/A",
                            unit = "mmHg",
                            trendDirection = sbp.trendDirection
                        )

                        // Anomaly Alerts
                        if (trends.anomalies.isNotEmpty()) {
                            Text(
                                text = "Detected Wellness Anomalies",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                            trends.anomalies.forEach { alert ->
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (alert.severity == "URGENT_CLINICAL")
                                            Color(0xFFFFEBEE) else Color(0xFFFFF8E1)
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = alert.alertType,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color(0xFFB71C1C)
                                        )
                                        Text(
                                            text = alert.message,
                                            fontSize = 12.sp,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                        Text(
                                            text = "Guidance: ${alert.actionGuidance}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = Color(0xFF424242),
                                            modifier = Modifier.padding(top = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    } ?: run {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Text(
                                text = errorMessage ?: "No longitudinal data recorded yet. Use '+ Log Vitals' to submit your first observation.",
                                fontSize = 13.sp,
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(72.dp))
                }
            }
        }
    }
}

@Composable
fun MetricSummaryCard(
    title: String,
    status: String,
    coverage: Double,
    ewma: String,
    unit: String,
    trendDirection: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                SuggestionChip(
                    onClick = {},
                    label = {
                        Text(
                            text = if (status == "SUFFICIENT") "Coverage ${(coverage * 100).toInt()}%" else "Insufficient Data",
                            fontSize = 11.sp
                        )
                    }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = ewma,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = unit,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
            }
            Text(
                text = "EWMA Baseline Trend: $trendDirection",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
