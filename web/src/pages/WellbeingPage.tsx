import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { WellbeingCheckIn, WellbeingTrendsSummary } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Smile,
  Sun,
  BatteryCharging,
  Moon,
  Info,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const WellbeingPage: React.FC = () => {
  const [trends, setTrends] = useState<WellbeingTrendsSummary | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<WellbeingCheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [mood, setMood] = useState<number>(4);
  const [stress, setStress] = useState<string>('LOW');
  const [energy, setEnergy] = useState<number>(4);
  const [sleepQuality, setSleepQuality] = useState<string>('GOOD');
  const [notes, setNotes] = useState<string>('');

  const loadWellbeingData = async () => {
    setIsLoading(true);
    try {
      const [trendsData, todayData] = await Promise.all([
        api.getWellbeingTrends(14),
        api.getTodayWellbeing(),
      ]);
      setTrends(trendsData);
      setTodayCheckin(todayData);
      if (todayData) {
        setMood(todayData.mood_score);
        setStress(todayData.stress_level);
        setEnergy(todayData.energy_level);
        setSleepQuality(todayData.sleep_perceived_quality || 'GOOD');
        setNotes(todayData.reflection_notes || '');
      }
    } catch (err) {
      console.error('Failed to load wellbeing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWellbeingData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const saved = await api.submitWellbeingCheckIn({
        mood_score: mood,
        stress_level: stress,
        energy_level: energy,
        sleep_perceived_quality: sleepQuality,
        reflection_notes: notes.trim() || undefined,
      });
      setTodayCheckin(saved);
      setSuccessMessage('Daily wellbeing reflection recorded successfully!');
      const updatedTrends = await api.getWellbeingTrends(14);
      setTrends(updatedTrends);
    } catch (err) {
      console.error('Failed to submit wellbeing check-in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading subjective wellbeing records..." />;
  }

  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Energized'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Smile className="w-6 h-6 text-amber-500" />
          <span>Subjective Wellbeing & Mindful Reflection</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Holistic lifestyle awareness: tracking perceived stress, energy balance, and daytime vitality
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 14-Day Wellbeing Summary Metrics */}
      {trends && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
              <span className="text-xs font-semibold text-slate-500">14-Day Check-In Coverage</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900">{trends.total_checkins}</span>
                <span className="text-xs text-slate-500">/ 14 days ({trends.coverage_percentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, trends.coverage_percentage)}%` }}
                />
              </div>
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
              <span className="text-xs font-semibold text-slate-500">Average Mood Score</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {trends.average_mood ? trends.average_mood.toFixed(1) : 'N/A'}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {trends.average_mood && trends.average_mood >= 4.0 ? 'Positive emotional balance' : 'Steady baseline'}
              </div>
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
              <span className="text-xs font-semibold text-slate-500">Average Daytime Vitality</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {trends.average_energy ? trends.average_energy.toFixed(1) : 'N/A'}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Sustained metabolic stamina</div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500">Predominant Stress Level</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {trends.predominant_stress_level || 'None Recorded'}
              </div>
              <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-500">
                <span>Low: {trends.stress_distribution.LOW || 0}</span>
                <span>&bull;</span>
                <span>Mod: {trends.stress_distribution.MODERATE || 0}</span>
                <span>&bull;</span>
                <span>High: {trends.stress_distribution.HIGH || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-In Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{todayCheckin ? "Update Today's Reflection" : "Record Today's Reflection"}</span>
            </h2>
            {todayCheckin && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                Logged Today
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mood Selector (1 to 5) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Overall Mood Perception (1-5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMood(val)}
                    className={`py-2.5 text-center rounded-xl border text-xs font-bold transition-all ${
                      mood === val
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{val}</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-90">{moodLabels[val - 1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Perceived Daily Stress</label>
              <div className="grid grid-cols-3 gap-2">
                {['LOW', 'MODERATE', 'HIGH'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setStress(lvl)}
                    className={`py-2 text-center rounded-xl border text-xs font-bold transition-all ${
                      stress === lvl
                        ? lvl === 'LOW'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : lvl === 'MODERATE'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level (1 to 5) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Energy & Vitality Level (1-5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEnergy(val)}
                    className={`py-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                      energy === val
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Rest Perception */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Perceived Sleep Quality
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSleepQuality(q)}
                    className={`py-1.5 text-center rounded-xl border text-xs font-semibold transition-all ${
                      sleepQuality === q
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mindful Reflection / Journal Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="What went well today? Any specific stressors or positive recovery routines?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? 'Saving Reflection...' : 'Save Daily Wellbeing Check-In'}
            </button>
          </form>
        </div>

        {/* Recent Check-Ins History List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Recent Reflections (14 Days)</span>
          </h2>

          {trends?.recent_checkins && trends.recent_checkins.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {trends.recent_checkins.map((chk) => (
                <div key={chk.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{chk.recorded_date}</span>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                        Mood: {chk.mood_score}/5
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                        Stress: {chk.stress_level}
                      </span>
                    </div>
                  </div>

                  {chk.reflection_notes && (
                    <p className="text-xs text-slate-600 mt-2 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{chk.reflection_notes}"
                    </p>
                  )}

                  <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                    <span>Energy: {chk.energy_level}/5</span>
                    <span>&bull;</span>
                    <span>Sleep: {chk.sleep_perceived_quality || 'Not specified'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No previous reflections recorded in this window.
            </div>
          )}
        </div>
      </div>

      {/* Clinical Disclaimer Boundary */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Clinical Boundary Notice: </span>
          {trends?.clinical_boundary_notice ||
            'Subjective mood and energy check-ins reflect lifestyle perception and self-reported wellness. They do not constitute a psychiatric screening or diagnostic assessment.'}
        </div>
      </div>
    </div>
  );
};
