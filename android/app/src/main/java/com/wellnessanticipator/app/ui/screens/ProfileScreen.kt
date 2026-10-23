package com.wellnessanticipator.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellnessanticipator.app.data.api.ApiClient
import com.wellnessanticipator.app.data.models.ClinicalProfile
import com.wellnessanticipator.app.data.models.ProfileUpdateRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit
) {
    var profile by remember { mutableStateOf<ClinicalProfile?>(null) }
    var heightCm by remember { mutableStateOf("170") }
    var biologicalSex by remember { mutableStateOf("FEMALE") }
    var familyHistory by remember { mutableStateOf(false) }
    var hypertension by remember { mutableStateOf(false) }
    var gestationalDiabetes by remember { mutableStateOf(false) }
    var smokingStatus by remember { mutableStateOf("NEVER") }
    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val fetchProfile = {
        isLoading = true
        scope.launch {
            try {
                val res = ApiClient.service.getProfile()
                if (res.isSuccessful && res.body() != null) {
                    val p = res.body()!!
                    profile = p
                    p.heightCm?.let { heightCm = it.toString() }
                    p.biologicalSex?.let { biologicalSex = it }
                    familyHistory = p.familyHistoryDiabetes
                    hypertension = p.personalHistoryHypertension
                    gestationalDiabetes = p.gestationalDiabetes
                    p.smokingStatus?.let { smokingStatus = it }
                }
            } catch (e: Exception) {
                message = "Error loading profile: ${e.localizedMessage}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchProfile()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clinical Profile & History", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
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
                    message?.let {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = it,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(12.dp),
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    Text("Anthropometric Baseline", fontWeight = FontWeight.Bold, fontSize = 15.sp)

                    OutlinedTextField(
                        value = heightCm,
                        onValueChange = { heightCm = it },
                        label = { Text("Height (cm)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Text("Biological Sex", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = biologicalSex == "FEMALE",
                            onClick = { biologicalSex = "FEMALE" },
                            label = { Text("Female") }
                        )
                        FilterChip(
                            selected = biologicalSex == "MALE",
                            onClick = { biologicalSex = "MALE" },
                            label = { Text("Male") }
                        )
                        FilterChip(
                            selected = biologicalSex == "OTHER",
                            onClick = { biologicalSex = "OTHER" },
                            label = { Text("Other") }
                        )
                    }

                    Divider()

                    Text("Documented Medical History", fontWeight = FontWeight.Bold, fontSize = 15.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Family History of Diabetes", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                            Text("Parent or sibling with Type 2 Diabetes", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Checkbox(checked = familyHistory, onCheckedChange = { familyHistory = it })
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Personal History of Hypertension", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                            Text("Diagnosed high blood pressure or taking medication", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Checkbox(checked = hypertension, onCheckedChange = { hypertension = it })
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Gestational Diabetes", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                            Text("Diagnosed during pregnancy", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Checkbox(checked = gestationalDiabetes, onCheckedChange = { gestationalDiabetes = it })
                    }

                    Divider()

                    Text("Smoking History", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = smokingStatus == "NEVER",
                            onClick = { smokingStatus = "NEVER" },
                            label = { Text("Never") }
                        )
                        FilterChip(
                            selected = smokingStatus == "FORMER",
                            onClick = { smokingStatus = "FORMER" },
                            label = { Text("Former") }
                        )
                        FilterChip(
                            selected = smokingStatus == "CURRENT",
                            onClick = { smokingStatus = "CURRENT" },
                            label = { Text("Current") }
                        )
                    }

                    Button(
                        onClick = {
                            val h = heightCm.toDoubleOrNull()
                            isSaving = true
                            message = null
                            scope.launch {
                                try {
                                    val req = ProfileUpdateRequest(
                                        heightCm = h,
                                        biologicalSex = biologicalSex,
                                        familyHistoryDiabetes = familyHistory,
                                        personalHistoryHypertension = hypertension,
                                        gestationalDiabetes = gestationalDiabetes,
                                        smokingStatus = smokingStatus
                                    )
                                    val res = ApiClient.service.updateProfile(req)
                                    if (res.isSuccessful) {
                                        message = "Clinical profile saved successfully."
                                    } else {
                                        message = "Failed to save: ${res.code()}"
                                    }
                                } catch (e: Exception) {
                                    message = "Network error: ${e.localizedMessage}"
                                } finally {
                                    isSaving = false
                                }
                            }
                        },
                        enabled = !isSaving,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                color = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Save Clinical Profile", fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}
