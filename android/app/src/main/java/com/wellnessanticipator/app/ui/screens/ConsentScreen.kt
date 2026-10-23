package com.wellnessanticipator.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.models.ConsentRecord
import com.wellnessanticipator.app.data.models.ConsentUpdateRequest
import kotlinx.coroutines.launch

data class DomainUiInfo(
    val domainKey: String,
    val title: String,
    val description: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConsentScreen(
    onNavigateBack: () -> Unit
) {
    val domainList = listOf(
        DomainUiInfo(
            "CLINICAL_MEASUREMENTS",
            "Clinical Biometrics & Vitals",
            "Permits recording and storage of blood pressure, blood glucose, HbA1c, and weight."
        ),
        DomainUiInfo(
            "DEVICE_TELEMETRY",
            "Wearable & Device Telemetry",
            "Allows processing daily step counts, physical activity, and sleep consistency."
        ),
        DomainUiInfo(
            "USAGE_STATS",
            "Usage & Screen Time",
            "Tracks screen time and app check-in intervals for digital wellness nudges."
        ),
        DomainUiInfo(
            "RESEARCH_ANALYTICS",
            "Anonymized Preventive Research",
            "Enables participation in fully de-identified population health calibration."
        )
    )

    var consentsMap by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) }
    var isLoading by remember { mutableStateOf(true) }
    var updatingKey by remember { mutableStateOf<String?>(null) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val fetchConsents = {
        isLoading = true
        scope.launch {
            try {
                val res = ApiClient.service.getConsents()
                if (res.isSuccessful && res.body() != null) {
                    val map = res.body()!!.consents.associate { it.consentDomain to it.isGranted }
                    consentsMap = map
                }
            } catch (e: Exception) {
                statusMessage = "Failed to load consents: ${e.localizedMessage}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchConsents()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy & Consents", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
                    Text(
                        text = "Granular Consent Governance",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "You retain complete sovereignty over your health data. Grant or revoke processing consent per domain at any time.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    statusMessage?.let {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = it,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(12.dp),
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    domainList.forEach { domain ->
                        val isGranted = consentsMap[domain.domainKey] ?: false
                        val isUpdating = updatingKey == domain.domainKey

                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                                    Text(text = domain.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    Text(
                                        text = domain.description,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                    Text(
                                        text = if (isGranted) "Status: Granted (Active)" else "Status: Revoked (Inactive)",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (isGranted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }

                                Switch(
                                    checked = isGranted,
                                    enabled = !isUpdating,
                                    onCheckedChange = { checked ->
                                        updatingKey = domain.domainKey
                                        statusMessage = null
                                        scope.launch {
                                            try {
                                                val res = ApiClient.service.updateConsent(
                                                    ConsentUpdateRequest(domain.domainKey, checked)
                                                )
                                                if (res.isSuccessful) {
                                                    consentsMap = consentsMap.toMutableMap().apply {
                                                        put(domain.domainKey, checked)
                                                    }
                                                    statusMessage = "Updated consent for ${domain.title}."
                                                }
                                            } catch (e: Exception) {
                                                statusMessage = "Error updating consent: ${e.localizedMessage}"
                                            } finally {
                                                updatingKey = null
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
