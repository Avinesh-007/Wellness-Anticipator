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
import com.wellnessanticipator.app.data.models.MeasurementCreateRequest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VitalsEntryScreen(
    onNavigateBack: () -> Unit
) {
    val metricTypes = listOf(
        "BLOOD_PRESSURE" to "Blood Pressure (Systolic / Diastolic)",
        "FASTING_GLUCOSE" to "Fasting Blood Glucose",
        "WEIGHT" to "Body Weight",
        "HBA1C" to "Glycated Hemoglobin (HbA1c)"
    )

    var selectedTypeIndex by remember { mutableStateOf(0) }
    var val1 by remember { mutableStateOf("120") }
    var val2 by remember { mutableStateOf("80") }
    var unit by remember { mutableStateOf("mmHg") }
    var notes by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val onTypeSelected = { index: Int ->
        selectedTypeIndex = index
        when (index) {
            0 -> {
                unit = "mmHg"
                val1 = "120"
                val2 = "80"
            }
            1 -> {
                unit = "mg/dL"
                val1 = "95"
                val2 = ""
            }
            2 -> {
                unit = "kg"
                val1 = "72"
                val2 = ""
            }
            3 -> {
                unit = "%"
                val1 = "5.4"
                val2 = ""
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Manual Vitals Entry", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Missing Sensor Fallback Banner
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Manual Entry Mode: Use this form to record measurements when automatic sensor streaming is unavailable or when logging home clinical devices.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(12.dp)
                )
            }

            successMessage?.let { msg ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = msg, fontSize = 13.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
            }

            errorMessage?.let { err ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = err,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(12.dp),
                        fontSize = 13.sp
                    )
                }
            }

            Text("Measurement Type", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                metricTypes.forEachIndexed { index, pair ->
                    FilterChip(
                        selected = selectedTypeIndex == index,
                        onClick = { onTypeSelected(index) },
                        label = { Text(pair.second, fontSize = 13.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Numeric Value Inputs
            val isBP = selectedTypeIndex == 0
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = val1,
                    onValueChange = { val1 = it },
                    label = { Text(if (isBP) "Systolic ($unit)" else "Value ($unit)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f)
                )

                if (isBP) {
                    OutlinedTextField(
                        value = val2,
                        onValueChange = { val2 = it },
                        label = { Text("Diastolic ($unit)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Clinical Notes (Optional)") },
                placeholder = { Text("e.g. Taken before breakfast, sitting for 5 min") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )

            Button(
                onClick = {
                    val v1 = val1.toDoubleOrNull()
                    if (v1 == null) {
                        errorMessage = "Please enter a valid numeric value."
                        return@Button
                    }
                    val v2 = if (isBP) val2.toDoubleOrNull() else null
                    if (isBP && v2 == null) {
                        errorMessage = "Diastolic blood pressure is required."
                        return@Button
                    }

                    isLoading = true
                    errorMessage = null
                    successMessage = null

                    val currentIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date())
                    val req = MeasurementCreateRequest(
                        metricType = metricTypes[selectedTypeIndex].first,
                        valueNumeric = v1,
                        secondaryNumeric = v2,
                        unit = unit,
                        measuredAt = currentIso,
                        source = "MANUAL_ENTRY",
                        notes = notes.ifBlank { null }
                    )

                    scope.launch {
                        try {
                            val res = ApiClient.service.createMeasurement(req)
                            if (res.isSuccessful) {
                                successMessage = "Measurement logged successfully to canonical health schema."
                                notes = ""
                            } else {
                                errorMessage = "Failed to record observation: ${res.code()}"
                            }
                        } catch (e: Exception) {
                            errorMessage = "Network error: ${e.localizedMessage ?: "Unable to submit"}"
                        } finally {
                            isLoading = false
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Save Observation", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
