import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { ActivityRecord, SleepRecord } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { Activity, Moon, Plus, Calendar } from 'lucide-react';

export const ActivitySleepEntryPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [activeForm, setActiveForm] = useState<'activity' | 'sleep'>('activity');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Activity Form
  const [actDate, setActDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState<string>('8500');
  const [activeMins, setActiveMins] = useState<string>('45');
  const [calories, setCalories] = useState<string>('380');

  // Sleep Form
  const [sleepDate, setSleepDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>(new Date(Date.now() - 8 * 3600000).toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [durationMins, setDurationMins] = useState<string>('480');
  const [deepMins, setDeepMins] = useState<string>('90');
  const [quality, setQuality] = useState<string>('4');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [actData, sleepData] = await Promise.all([api.getActivities(), api.getSleepRecords()]);
      setActivities(actData);
      setSleepRecords(sleepData);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await api.createActivity({
        recorded_date: actDate,
        step_count: parseInt(steps, 10) || 0,
        active_minutes: parseInt(activeMins, 10) || 0,
        active_calories_kcal: parseFloat(calories) || 0.0,
        source: 'MANUAL_ENTRY',
      });
      setSuccessMsg('Activity logged successfully.');
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError && err.errorCode === 'CONSENT_REQUIRED_OR_REVOKED') {
        setError('Cannot log activity: DEVICE_TELEMETRY consent is required. Enable it under the Consents tab.');
      } else {
        setError(err.message || 'Failed to log activity.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError('Wake time must be strictly after bedtime onset.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSleep({
        sleep_date: sleepDate,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: parseInt(durationMins, 10) || 480,
        deep_minutes: deepMins ? parseInt(deepMins, 10) : undefined,
        quality_rating: parseInt(quality, 10) || 4,
        source: 'MANUAL_ENTRY',
      });
      setSuccessMsg('Sleep session logged successfully.');
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError && err.errorCode === 'CONSENT_REQUIRED_OR_REVOKED') {
        setError('Cannot log sleep: DEVICE_TELEMETRY consent is required. Enable it under the Consents tab.');
      } else {
        setError(err.message || 'Failed to log sleep.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Activity & Sleep Telemetry</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record manual physical activity and sleep architecture or sync with native device sensors
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      {/* Form Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveForm('activity')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeForm === 'activity'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Physical Activity Form</span>
        </button>
        <button
          onClick={() => setActiveForm('sleep')}
          className={`flex items-center space-x-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeForm === 'sleep'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>Sleep Session Form</span>
        </button>
      </div>

      {/* Activity Entry Form */}
      {activeForm === 'activity' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Log Daily Activity</span>
          </h2>

          <form onSubmit={handleActivitySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Activity</label>
                <input
                  type="date"
                  required
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Step Count</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="150000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Active Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={activeMins}
                  onChange={(e) => setActiveMins(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Active Calories Burned (kcal)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Activity...' : 'Record Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sleep Entry Form */}
      {activeForm === 'sleep' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Log Sleep Session</span>
          </h2>

          <form onSubmit={handleSleepSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sleep Wake-up Date</label>
                <input
                  type="date"
                  required
                  value={sleepDate}
                  onChange={(e) => setSleepDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bedtime Onset</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Wake-up Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total Asleep (Minutes)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="1440"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deep Sleep Minutes (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={deepMins}
                  onChange={(e) => setDeepMins(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subjective Quality (1-5)</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="5">5 - Excellent Rest</option>
                  <option value="4">4 - Good Rest</option>
                  <option value="3">3 - Fair Rest</option>
                  <option value="2">2 - Poor Rest</option>
                  <option value="1">1 - Highly Disrupted</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Sleep Session...' : 'Record Sleep Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Tables */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Recent {activeForm === 'activity' ? 'Activity Records' : 'Sleep Sessions'}
        </h3>

        {isLoading ? (
          <LoadingSpinner message="Loading records..." />
        ) : activeForm === 'activity' ? (
          activities.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              No daily activity records logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Daily Steps</th>
                    <th className="pb-3">Active Minutes</th>
                    <th className="pb-3">Calories</th>
                    <th className="pb-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{a.recorded_date}</td>
                      <td className="py-3 font-mono font-bold text-emerald-600">{a.step_count.toLocaleString()}</td>
                      <td className="py-3 text-slate-600">{a.active_minutes} mins</td>
                      <td className="py-3 text-slate-600">{a.active_calories_kcal} kcal</td>
                      <td className="py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {a.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : sleepRecords.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No sleep sessions logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Deep Sleep</th>
                  <th className="pb-3">Quality</th>
                  <th className="pb-3">Bedtime - Wake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sleepRecords.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">{s.sleep_date}</td>
                    <td className="py-3 font-mono font-bold text-indigo-600">
                      {Math.floor(s.duration_minutes / 60)}h {s.duration_minutes % 60}m
                    </td>
                    <td className="py-3 text-slate-600">{s.deep_minutes ? `${s.deep_minutes}m` : '—'}</td>
                    <td className="py-3 text-slate-700 font-medium">{s.quality_rating || 4}/5</td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {s.start_time.slice(11, 16)} - {s.end_time.slice(11, 16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
