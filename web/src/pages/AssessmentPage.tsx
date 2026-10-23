import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';
import { DiabetesAssessmentResponse } from '../types/api';
import { RiskScoreCard } from '../components/RiskScoreCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';

export const AssessmentPage: React.FC = () => {
  const [assessment, setAssessment] = useState<DiabetesAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simulation / Override Form State
  const [age, setAge] = useState<number>(45);
  const [biologicalSex, setBiologicalSex] = useState<string>('FEMALE');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [physicallyActive, setPhysicallyActive] = useState<boolean>(true);
  const [familyHistory, setFamilyHistory] = useState<boolean>(false);
  const [hypertension, setHypertension] = useState<boolean>(false);
  const [gestationalDiabetes, setGestationalDiabetes] = useState<boolean>(false);
  const [smokingStatus, setSmokingStatus] = useState<string>('NEVER');

  const fetchCurrentAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDiabetesAssessment();
      setAssessment(data);
      // Pre-fill simulation form with returned baseline inputs
      if (data.input_summary) {
        setAge(data.input_summary.age || 45);
        if (data.input_summary.biological_sex) {
          setBiologicalSex(data.input_summary.biological_sex);
        }
        setHeightCm(data.input_summary.height_cm || 170);
        setWeightKg(data.input_summary.weight_kg || 75);
        setPhysicallyActive(data.input_summary.physically_active);
        setFamilyHistory(data.input_summary.family_history_diabetes);
        setHypertension(data.input_summary.personal_history_hypertension);
        setGestationalDiabetes(data.input_summary.gestational_diabetes);
        setSmokingStatus(data.input_summary.smoking_status || 'NEVER');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        // No assessment computed yet; prompt user to run initial one
        setError('No previous assessment found. Use the interactive evaluation below to compute your baseline.');
      } else {
        setError(err.message || 'Failed to load diabetes assessment.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAssessment();
  }, []);

  const handleRunAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setError(null);
    setSuccessMsg(null);

    const overrides = {
      age: Number(age),
      biological_sex: biologicalSex,
      height_cm: Number(heightCm),
      weight_kg: Number(weightKg),
      physically_active: physicallyActive,
      family_history_diabetes: familyHistory,
      personal_history_hypertension: hypertension,
      gestational_diabetes: gestationalDiabetes,
      smoking_status: smokingStatus,
    };

    try {
      const result = await api.runDiabetesAssessment(overrides);
      setAssessment(result);
      setSuccessMsg('Screening assessment re-evaluated successfully using current parameters.');
    } catch (err: any) {
      setError(err.message || 'Failed to re-evaluate assessment.');
    } finally {
      setEvaluating(false);
    }
  };

  const calculatedBmi = (weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1);

  if (loading) {
    return <LoadingSpinner message="Retrieving calibrated diabetes screening assessment..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Type 2 Diabetes Screening & ADA Risk</h1>
        <p className="text-gray-600 mt-1">
          Dual evaluation combining the clinical American Diabetes Association (ADA) 0–10 score and a calibrated statistical population model.
        </p>
      </div>

      {error && <AlertBanner type="warning" message={error} onClose={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      {/* Primary Assessment Results */}
      {assessment ? (
        <RiskScoreCard assessment={assessment} />
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-blue-900">
          <p className="font-semibold">Ready to generate your first Type 2 Diabetes preventive screening?</p>
          <p className="text-sm text-blue-700 mt-1">Review your risk factors in the interactive simulation below and click "Evaluate Risk".</p>
        </div>
      )}

      {/* Interactive Simulation & Overrides Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Interactive Risk Factors & What-If Simulation</h2>
            <p className="text-xs text-gray-500">
              Modify clinical parameters to observe how lifestyle and biometric changes influence screening risk tiers.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Simulated BMI: </span>
            <span className="text-sm font-bold text-indigo-700">{calculatedBmi} kg/m²</span>
          </div>
        </div>

        <form onSubmit={handleRunAssessment} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Age (years)
              </label>
              <input
                type="number"
                min="18"
                max="120"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Biological Sex */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Biological Sex
              </label>
              <select
                value={biologicalSex}
                onChange={(e) => setBiologicalSex(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="MALE">Male (ADA +1 point)</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to specify</option>
              </select>
            </div>

            {/* Smoking Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Smoking Status
              </label>
              <select
                value={smokingStatus}
                onChange={(e) => setSmokingStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="NEVER">Never Smoked</option>
                <option value="FORMER">Former Smoker</option>
                <option value="CURRENT">Current Smoker</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="250"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Physical Activity */}
            <div className="flex items-center pt-6">
              <label className="relative flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={physicallyActive}
                  onChange={(e) => setPhysicallyActive(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">Physically Active</span>
                  <p className="text-xs text-gray-500">Engages in 150+ min moderate activity/week or recent 14d steps &ge; 7,000</p>
                </div>
              </label>
            </div>
          </div>

          {/* Clinical Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Family History</span>
                <p className="text-xs text-gray-500">Parent or sibling diagnosed with Type 2 Diabetes (+1 ADA pt)</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={hypertension}
                onChange={(e) => setHypertension(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Hypertension</span>
                <p className="text-xs text-gray-500">Ever diagnosed with high BP or taking medication (+1 ADA pt)</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={gestationalDiabetes}
                onChange={(e) => setGestationalDiabetes(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Gestational Diabetes</span>
                <p className="text-xs text-gray-500">Ever diagnosed during pregnancy (+1 ADA pt)</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={evaluating}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Running Calibrated Inference...
                </>
              ) : (
                'Evaluate Risk & ADA Score'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Clinical Governance & Methodological Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-xs text-gray-600 space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Methodology & Clinical Governance</h3>
        <p>
          <strong>Deterministic Clinical Score:</strong> Based directly on the American Diabetes Association (ADA) 2024 validated risk assessment scoring rules (0 to 10 points). Individuals with 5 or more points are at increased risk of prediabetes or undiagnosed diabetes and are recommended for clinical diagnostic testing (Fasting Blood Glucose or HbA1c).
        </p>
        <p>
          <strong>Statistical Screening Model:</strong> Trained on the CDC BRFSS epidemiological screening cohort using calibrated logistic regression with 5-fold cross-validation Platt scaling. Predictive outputs reflect population-level screening risk tiers, not diagnostic confirmation.
        </p>
        <p>
          <strong>Telemetric Lifestyle Data:</strong> Daily steps and sleep metrics represent behavioral consistency and activity trends; they are never used as diagnostic determinants for disease.
        </p>
      </div>
    </div>
  );
};
