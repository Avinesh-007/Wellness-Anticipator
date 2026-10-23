import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClinicalProfile } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ClinicalProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [biologicalSex, setBiologicalSex] = useState<string>('FEMALE');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [familyHistory, setFamilyHistory] = useState<boolean>(false);
  const [hypertension, setHypertension] = useState<boolean>(false);
  const [gestationalDiabetes, setGestationalDiabetes] = useState<boolean>(false);
  const [smokingStatus, setSmokingStatus] = useState<string>('NEVER');
  const [alcoholIntake, setAlcoholIntake] = useState<string>('NONE');

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfile();
      setProfile(data);
      if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
      if (data.biological_sex) setBiologicalSex(data.biological_sex);
      if (data.height_cm) setHeightCm(String(data.height_cm));
      setFamilyHistory(data.family_history_diabetes ?? false);
      setHypertension(data.personal_history_hypertension ?? false);
      setGestationalDiabetes(data.gestational_diabetes ?? false);
      if (data.smoking_status) setSmokingStatus(data.smoking_status);
      if (data.alcohol_intake) setAlcoholIntake(data.alcohol_intake);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload: Partial<ClinicalProfile> = {
      date_of_birth: dateOfBirth || null,
      biological_sex: biologicalSex,
      height_cm: heightCm ? Number(heightCm) : null,
      family_history_diabetes: familyHistory,
      personal_history_hypertension: hypertension,
      gestational_diabetes: gestationalDiabetes,
      smoking_status: smokingStatus,
      alcohol_intake: alcoholIntake,
    };

    try {
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setSuccessMsg('Clinical profile and baseline risk factors saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading clinical profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinical Profile & Demographics</h1>
        <p className="text-gray-600 mt-1">
          Maintain your personal health history and physical baseline used for personalized risk stratification.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Demographic & Anthropometric Baseline</h2>
            <p className="text-xs text-gray-500">Core personal factors required for normalized BMI and clinical scores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {profile?.age && (
                <span className="text-xs text-gray-500 mt-1 block">Calculated Age: {profile.age} years</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Biological Sex
              </label>
              <select
                value={biologicalSex}
                onChange={(e) => setBiologicalSex(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to state</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="50"
                max="250"
                step="0.5"
                placeholder="e.g. 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900">Clinical & Family History</h2>
            <p className="text-xs text-gray-500">Documented medical history referenced by validated screening questionnaires.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Family History of Diabetes</span>
                <p className="text-xs text-gray-500 mt-0.5">Parent, sibling, or child with diagnosed Type 2 diabetes.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={hypertension}
                onChange={(e) => setHypertension(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">History of Hypertension</span>
                <p className="text-xs text-gray-500 mt-0.5">Diagnosed high blood pressure or active antihypertensive medication.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={gestationalDiabetes}
                onChange={(e) => setGestationalDiabetes(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Gestational Diabetes</span>
                <p className="text-xs text-gray-500 mt-0.5">Ever diagnosed with elevated blood glucose during pregnancy.</p>
              </div>
            </label>
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h2 className="text-lg font-semibold text-gray-900">Behavioral Lifestyle Factors</h2>
            <p className="text-xs text-gray-500">Self-reported habits complementing longitudinal telemetry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="FORMER">Former Smoker (Quit &gt; 12 months ago)</option>
                <option value="CURRENT">Current Smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Alcohol Intake
              </label>
              <select
                value={alcoholIntake}
                onChange={(e) => setAlcoholIntake(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="NONE">None / Rarely</option>
                <option value="OCCASIONAL">Moderate / Occasional (1–7 drinks/week)</option>
                <option value="FREQUENT">Frequent (&gt; 7 drinks/week)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
