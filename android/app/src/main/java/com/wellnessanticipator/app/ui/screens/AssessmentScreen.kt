package com.wellnessanticipator.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.models.DiabetesAssessmentResponse
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssessmentScreen(
    onNavigateBack: () -> Unit
) {
    var assessment by remember { mutableStateOf<DiabetesAssessmentResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val fetchAssessment = {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                val res = ApiClient.service.getDiabetesAssessment()
                if (res.isSuccessful && res.body() != null) {
                    assessment = res.body()
                } else {
                    errorMessage = "No baseline assessment found. Tap 'Evaluate Risk' below to compute your initial score."
                }
            } catch (e: Exception) {
                errorMessage = "Network error: ${e.localizedMessage ?: "Unable to connect"}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchAssessment()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Diabetes Risk Screening", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        isLoading = true
                        scope.launch {
                            try {
                                val runRes = ApiClient.service.runDiabetesAssessment()
                                if (runRes.isSuccessful && runRes.body() != null) {
                                    assessment = runRes.body()
                                    errorMessage = null
                                } else {
                                    errorMessage = "Assessment failed: ${runRes.code()}"
                                }
                            } catch (e: Exception) {
                                errorMessage = "Error: ${e.localizedMessage}"
                            } finally {
                                isLoading = false
                            }
                        }
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Re-evaluate")
                    }
                }
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
                    // Clinical Limitations Disclaimer (Required)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "Clinical Screening Notice",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "This assessment is a preventive screening tool combining the ADA 2024 questionnaire with a CDC BRFSS calibrated statistical model. It does not replace diagnostic HbA1c or oral glucose tolerance tests.",
                                fontSize = 11.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }

                    errorMessage?.let { msg ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = msg,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(12.dp),
                                fontSize = 13.sp
                            )
                        }

                        Button(
                            onClick = {
                                isLoading = true
                                scope.launch {
                                    try {
                                        val runRes = ApiClient.service.runDiabetesAssessment()
                                        if (runRes.isSuccessful && runRes.body() != null) {
                                            assessment = runRes.body()
                                            errorMessage = null
                                        }
                                    } catch (e: Exception) {
                                        errorMessage = "Failed: ${e.localizedMessage}"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Compute Initial Assessment")
                        }
                    }

                    assessment?.let { data ->
                        // Dual Risk Evaluation Cards:
                        // 1. ADA Clinical Score
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "ADA Clinical Questionnaire Score",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "${data.adaClinicalScore.points} / ${data.adaClinicalScore.maxPoints} pts",
                                        fontSize = 26.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (data.adaClinicalScore.points >= 5) Color(0xFFC62828) else Color(0xFF2E7D32)
                                    )
                                    SuggestionChip(
                                        onClick = {},
                                        label = {
                                            Text(
                                                text = if (data.adaClinicalScore.points >= 5) "HIGH CLINICAL RISK" else "LOW-TO-MODERATE",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        }
                                    )
                                }
                                Text(
                                    text = data.adaClinicalScore.clinicalGuidance,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }

                        // 2. Statistical Screening Model Probability
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Calibrated Statistical Screening Model",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val prob = (data.statisticalScreeningModel.calibratedScreeningProbability * 100)
                                    Text(
                                        text = String.format("%.1f%%", prob),
                                        fontSize = 26.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    SuggestionChip(
                                        onClick = {},
                                        label = {
                                            Text(
                                                text = data.statisticalScreeningModel.riskTier.replace("_", " "),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        }
                                    )
                                }
                                Text(
                                    text = "Architecture: ${data.statisticalScreeningModel.modelArchitecture} (${data.statisticalScreeningModel.modelVersion})",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                        }

                        // Safety Escalation Alerts (if any)
                        if (data.safetyEscalations.isNotEmpty()) {
                            Text(
                                text = "Safety Escalations",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFFC62828)
                            )
                            data.safetyEscalations.forEach { esc ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(modifier = Modifier.padding(12.dp)) {
                                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFC62828))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(esc.message, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFFC62828))
                                            Text(esc.guidance, fontSize = 12.sp, color = Color(0xFF424242), modifier = Modifier.padding(top = 2.dp))
                                        }
                                    }
                                }
                            }
                        }

                        // Contributing & Protective Factors
                        if (data.contributingFactors.isNotEmpty()) {
                            Text(
                                text = "Factor Attributions & Explanations",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            data.contributingFactors.forEach { factor ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(factor.featureName.replace("_", " "), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                            Text(
                                                text = factor.impact,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (factor.impact == "PROTECTIVE") Color(0xFF2E7D32) else Color(0xFFE65100)
                                            )
                                        }
                                        Text(
                                            text = factor.plainLanguageExplanation,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(top = 4.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}
