package com.wellnessanticipator.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.models.*
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
    var habitsList by remember { mutableStateOf<List<HabitResponse>>(emptyList()) }
    var adherenceSummary by remember { mutableStateOf<HabitAdherenceSummary?>(null) }
    var activePlan by remember { mutableStateOf<PreventivePlanResponse?>(null) }
    var todayWellbeing by remember { mutableStateOf<WellbeingCheckInResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var actionInProgress by remember { mutableStateOf<Int?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val refreshData = {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                // 1. Load Trends
                val trendsRes = ApiClient.service.getTrendsSummary(14)
                if (trendsRes.isSuccessful) trendsData = trendsRes.body()

                // 2. Load Habits
                val habitsRes = ApiClient.service.getHabits()
                if (habitsRes.isSuccessful) habitsList = habitsRes.body() ?: emptyList()

                // 3. Load Adherence
                val adhRes = ApiClient.service.getHabitAdherence()
                if (adhRes.isSuccessful) adherenceSummary = adhRes.body()

                // 4. Load Active Plan
                val planRes = ApiClient.service.getActivePlan()
                if (planRes.isSuccessful) activePlan = planRes.body()

                // 5. Load Today's Wellbeing
                val wbRes = ApiClient.service.getTodayWellbeing()
                if (wbRes.isSuccessful) todayWellbeing = wbRes.body()

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

    val toggleHabit: (HabitResponse) -> Unit = { habit ->
        actionInProgress = habit.id
        scope.launch {
            try {
                val newStatus = if (habit.completedToday) "SKIPPED" else "COMPLETED"
                ApiClient.service.logHabit(habit.id, HabitLogRequest(status = newStatus))
                val updatedHabits = ApiClient.service.getHabits()
                if (updatedHabits.isSuccessful) habitsList = updatedHabits.body() ?: emptyList()
                val updatedAdh = ApiClient.service.getHabitAdherence()
                if (updatedAdh.isSuccessful) adherenceSummary = updatedAdh.body()
            } catch (e: Exception) {
                // Ignore transient errors
            } finally {
                actionInProgress = null
            }
        }
    }

    val adoptPlanItem: (Int) -> Unit = { itemId ->
        actionInProgress = itemId
        scope.launch {
            try {
                ApiClient.service.adoptPlanItem(itemId, AdoptPlanItemRequest())
                refreshData()
            } catch (e: Exception) {
                // Ignore
            } finally {
                actionInProgress = null
            }
        }
    }

    val submitQuickWellbeing: (Int, String) -> Unit = { mood, stress ->
        scope.launch {
            try {
                val res = ApiClient.service.submitWellbeing(
                    WellbeingCheckInRequest(
                        moodScore = mood,
                        stressLevel = stress,
                        energyLevel = mood,
                        reflectionNotes = "Mobile quick check-in"
                    )
                )
                if (res.isSuccessful) todayWellbeing = res.body()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Wellness Anticipator", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text("Preventive Care & Daily Habits", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
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
                    // Today's Adherence Summary Banner
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Today's Preventive Action",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                adherenceSummary?.let { adh ->
                                    Surface(
                                        color = MaterialTheme.colorScheme.primary,
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            text = "${adh.completedTodayCount}/${adh.totalActiveHabits} Done",
                                            color = MaterialTheme.colorScheme.onPrimary,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            }

                            adherenceSummary?.let { adh ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = adh.supportiveFeedback,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "7-Day Consistency: ${adh.sevenDayConsistencyRate.toInt()}%",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                    Text(
                                        text = "30-Day: ${adh.thirtyDayConsistencyRate.toInt()}%",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                }
                            }
                        }
                    }

                    // Today's Habit Checklist Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Daily Habit Checklist",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669))
                            }
                            Spacer(modifier = Modifier.height(8.dp))

                            if (habitsList.isEmpty()) {
                                Text(
                                    text = "No active daily habits yet. Adopt evidence-based actions from your Preventive Plan below to begin building consistency.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else {
                                habitsList.forEach { habit ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            modifier = Modifier.weight(1f),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            IconButton(
                                                onClick = { toggleHabit(habit) },
                                                enabled = actionInProgress != habit.id
                                            ) {
                                                Icon(
                                                    if (habit.completedToday) Icons.Default.CheckCircle else Icons.Default.CheckCircleOutline,
                                                    contentDescription = null,
                                                    tint = if (habit.completedToday) Color(0xFF059669) else Color.Gray
                                                )
                                            }
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Column {
                                                Text(
                                                    text = habit.title,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    textDecoration = if (habit.completedToday) TextDecoration.LineThrough else TextDecoration.None,
                                                    color = if (habit.completedToday) Color.Gray else MaterialTheme.colorScheme.onSurface
                                                )
                                                Text(
                                                    text = habit.targetAction,
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        FilledTonalButton(
                                            onClick = { toggleHabit(habit) },
                                            enabled = actionInProgress != habit.id,
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                text = if (habit.completedToday) "Done" else "Mark",
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                                }
                            }
                        }
                    }

                    // Assessment Quick Launch Card
                    Card(
                        onClick = onNavigateToAssessment,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
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
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "ADA Clinical Score (0–10) & Calibrated ML Probability",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(Icons.Default.ArrowForward, contentDescription = null)
                        }
                    }

                    // Quick Wellbeing Check-in Section
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Today's Wellbeing Check-In",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "Subjective mood & stress reflection (non-diagnostic)",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            todayWellbeing?.let { wb ->
                                Surface(
                                    color = Color(0xFFFFF8E1),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "Logged: Mood ${wb.moodScore}/5",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF795548)
                                        )
                                        Text(
                                            text = "Stress: ${wb.stressLevel}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFF795548)
                                        )
                                    }
                                }
                            } ?: run {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    listOf(1 to "Low", 2 to "Fair", 3 to "Okay", 4 to "Good", 5 to "Great").forEach { (score, label) ->
                                        OutlinedButton(
                                            onClick = { submitQuickWellbeing(score, "LOW") },
                                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(text = label, fontSize = 10.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Personal Baseline Section (Solves N/A Defect)
                    Text(
                        text = "14-Day Longitudinal Baselines",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    trendsData?.let { trends ->
                        // Systolic BP Baseline
                        val sbp = trends.metrics.systolicBp
                        BaselineDetailCard(
                            metricTitle = "Systolic Blood Pressure",
                            status = sbp.dataQualityStatus,
                            sampleCount = sbp.sampleCount,
                            requiredCount = 3,
                            latestValue = sbp.latestValue?.let { "${it.toInt()} mmHg" },
                            ewmaValue = sbp.ewma?.let { "${it.toInt()} mmHg" },
                            notes = sbp.notes,
                            onLogClick = onNavigateToVitals
                        )

                        // Steps Baseline
                        val steps = trends.metrics.steps
                        BaselineDetailCard(
                            metricTitle = "Daily Step Count",
                            status = steps.dataQualityStatus,
                            sampleCount = steps.sampleCount,
                            requiredCount = 3,
                            latestValue = steps.latestValue?.let { "${it.toInt()} steps" },
                            ewmaValue = steps.ewma?.let { "${it.toInt()} steps/day" },
                            notes = steps.notes,
                            onLogClick = onNavigateToVitals
                        )

                        // Sleep Baseline
                        val sleep = trends.metrics.sleepDuration
                        BaselineDetailCard(
                            metricTitle = "Sleep Rest Duration",
                            status = sleep.dataQualityStatus,
                            sampleCount = sleep.sampleCount,
                            requiredCount = 3,
                            latestValue = sleep.latestValue?.let { String.format("%.1f hrs", it / 60.0) },
                            ewmaValue = sleep.ewma?.let { String.format("%.1f hrs/night", it / 60.0) },
                            notes = sleep.notes,
                            onLogClick = onNavigateToVitals
                        )
                    }

                    // Preventive Plan Highlights
                    activePlan?.let { plan ->
                        if (plan.items.isNotEmpty()) {
                            Text(
                                text = "Personalized Preventive Recommendations",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                            plan.items.take(3).forEach { item ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = item.category.replace('_', ' '),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = item.difficulty,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = Color.Gray
                                            )
                                        }
                                        Text(
                                            text = item.title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            modifier = Modifier.padding(top = 4.dp)
                                        )
                                        Text(
                                            text = item.targetAction,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        if (!item.isAdoptedIntoHabit) {
                                            Button(
                                                onClick = { adoptPlanItem(item.id) },
                                                enabled = actionInProgress != item.id,
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Adopt into Daily Habits", fontSize = 11.sp)
                                            }
                                        } else {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Active in Daily Habits", fontSize = 11.sp, color = Color(0xFF059669), fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(72.dp))
                }
            }
        }
    }
}

@Composable
fun BaselineDetailCard(
    metricTitle: String,
    status: String,
    sampleCount: Int,
    requiredCount: Int,
    latestValue: String?,
    ewmaValue: String?,
    notes: String,
    onLogClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = metricTitle, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                if (status == "SUFFICIENT") {
                    Surface(color = Color(0xFFE8F5E9), shape = RoundedCornerShape(6.dp)) {
                        Text(
                            text = "Baseline Active",
                            color = Color(0xFF2E7D32),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                } else {
                    Surface(color = Color(0xFFFFF3E0), shape = RoundedCornerShape(6.dp)) {
                        Text(
                            text = "$sampleCount/$requiredCount Logs",
                            color = Color(0xFFE65100),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            if (status == "SUFFICIENT") {
                Text(
                    text = ewmaValue ?: "Active",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Rolling 14-day EWMA personal baseline",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                latestValue?.let {
                    Text(
                        text = "Latest: $it",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                } ?: run {
                    Text(
                        text = "No readings logged yet",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    text = notes,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp)
                )

                Spacer(modifier = Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { (sampleCount.toFloat() / requiredCount.toFloat()).coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth(),
                )

                TextButton(
                    onClick = onLogClick,
                    contentPadding = PaddingValues(0.dp),
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("+ Log Reading", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
