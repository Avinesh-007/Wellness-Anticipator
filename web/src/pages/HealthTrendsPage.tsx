import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendsSummaryResponse, Measurement, ActivityRecord, SleepRecord, AnomalyAlert } from '../types/api';
import { TrendChart } from '../components/TrendChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import {
  TrendingUp,
  Heart,
  Activity,
  Moon,
  Droplet,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  PlusCircle,
} from 'lucide-react';

interface HealthTrendsPageProps {
  onNavigate?: (tab: string) => void;
}

export const HealthTrendsPage: React.FC<HealthTrendsPageProps> = ({ onNavigate }) => {
  const [windowDays, setWindowDays] = useState<number>(14);
  const [trends, setTrends] = useState<TrendsSummaryResponse | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrends = async () => {
    setIsLoading(true);
    try {
      const [trendsData, mData, aData, sData] = await Promise.all([
        api.getTrends(windowDays),
        api.getMeasurements(),
        api.getActivities(),
        api.getSleepRecords(),
      ]);
      setTrends(trendsData);
      setMeasurements(mData);
      setActivities(aData);
      setSleepRecords(sData);
    } catch (err) {
      console.error('Failed to load trends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [windowDays]);

  if (isLoading) {
    return <LoadingSpinner message="Calculating rolling EWMA baselines and statistical dispersions..." />;
  }

  // Format charts data chronologically
  const stepsChartData = activities
    .slice()
    .sort((a, b) => a.recorded_date.localeCompare(b.recorded_date))
    .slice(-windowDays)
    .map((a) => ({ date: a.recorded_date.slice(5), value: a.step_count }));

  const bpChartData = measurements
    .filter((m) => m.metric_type === 'BLOOD_PRESSURE')
    .slice()
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-windowDays)
    .map((m) => ({ date: m.measured_at.slice(5, 10), value: m.value_numeric }));

  const sleepChartData = sleepRecords
    .slice()
    .sort((a, b) => a.sleep_date.localeCompare(b.sleep_date))
    .slice(-windowDays)
    .map((s) => ({ date: s.sleep_date.slice(5), value: Math.round((s.duration_minutes / 60) * 10) / 10 }));

  const glucoseChartData = measurements
    .filter((m) => m.metric_type === 'FASTING_GLUCOSE')
    .slice()
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-windowDays)
    .map((m) => ({ date: m.measured_at.slice(5, 10), value: m.value_numeric }));

  const mapAlertSeverity = (sev: string): 'info' | 'warning' | 'error' => {
    if (sev === 'URGENT_CLINICAL') return 'error';
    if (sev === 'WARNING') return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span>Longitudinal Health Trends & Baselines</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous statistical trend analysis with exponentially weighted moving averages (EWMA)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setWindowDays(days)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  windowDays === days
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('records')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Reading</span>
            </button>
          )}
        </div>
      </div>

      {/* Anomaly Safety Escalations */}
      {trends?.anomalies && trends.anomalies.length > 0 && (
        <div className="space-y-2">
          {trends.anomalies.map((alert: AnomalyAlert, idx: number) => (
            <AlertBanner
              key={idx}
              type={mapAlertSeverity(alert.severity)}
              message={`${alert.metric_name} Alert: ${alert.message} (${alert.action_guidance})`}
            />
          ))}
        </div>
      )}

      {/* Metrics Baseline Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure Systolic */}
        {trends?.metrics?.systolic_bp && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Systolic BP</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                  trends.metrics.systolic_bp.data_quality_status === 'SUFFICIENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {trends.metrics.systolic_bp.data_quality_status === 'SUFFICIENT'
                  ? 'Baseline Set'
                  : 'Insufficient Data'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {trends.metrics.systolic_bp.ewma
                  ? Math.round(trends.metrics.systolic_bp.ewma)
                  : trends.metrics.systolic_bp.latest_value || 'None'}
                <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Coverage: {trends.metrics.systolic_bp.coverage_percentage}% ({trends.metrics.systolic_bp.sample_count}/
                {windowDays} days)
              </div>
            </div>
          </div>
        )}

        {/* Diastolic BP */}
        {trends?.metrics?.diastolic_bp && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Diastolic BP</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                  trends.metrics.diastolic_bp.data_quality_status === 'SUFFICIENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {trends.metrics.diastolic_bp.data_quality_status === 'SUFFICIENT'
                  ? 'Baseline Set'
                  : 'Insufficient Data'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {trends.metrics.diastolic_bp.ewma
                  ? Math.round(trends.metrics.diastolic_bp.ewma)
                  : trends.metrics.diastolic_bp.latest_value || 'None'}
                <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Coverage: {trends.metrics.diastolic_bp.coverage_percentage}% (
                {trends.metrics.diastolic_bp.sample_count}/{windowDays} days)
              </div>
            </div>
          </div>
        )}

        {/* Steps Baseline */}
        {trends?.metrics?.steps && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Daily Steps</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                  trends.metrics.steps.data_quality_status === 'SUFFICIENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {trends.metrics.steps.data_quality_status === 'SUFFICIENT' ? 'Baseline Set' : 'Insufficient Data'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {trends.metrics.steps.ewma
                  ? Math.round(trends.metrics.steps.ewma).toLocaleString()
                  : trends.metrics.steps.latest_value
                  ? Math.round(trends.metrics.steps.latest_value).toLocaleString()
                  : 'None'}
                <span className="text-xs font-normal text-slate-500 ml-1">steps/day</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Coverage: {trends.metrics.steps.coverage_percentage}% ({trends.metrics.steps.sample_count}/{windowDays}{' '}
                days)
              </div>
            </div>
          </div>
        )}

        {/* Sleep Duration Baseline */}
        {trends?.metrics?.sleep_duration && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Sleep Duration</span>
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                  trends.metrics.sleep_duration.data_quality_status === 'SUFFICIENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {trends.metrics.sleep_duration.data_quality_status === 'SUFFICIENT'
                  ? 'Baseline Set'
                  : 'Insufficient Data'}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {trends.metrics.sleep_duration.ewma
                  ? (trends.metrics.sleep_duration.ewma / 60).toFixed(1)
                  : trends.metrics.sleep_duration.latest_value
                  ? (trends.metrics.sleep_duration.latest_value / 60).toFixed(1)
                  : 'None'}
                <span className="text-xs font-normal text-slate-500 ml-1">hours</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Coverage: {trends.metrics.sleep_duration.coverage_percentage}% (
                {trends.metrics.sleep_duration.sample_count}/{windowDays} days)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Longitudinal Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Daily Physical Activity (Steps)</span>
          </h2>
          <TrendChart
            metricName="Daily Steps"
            unit="steps"
            strokeColor="#059669"
            data={stepsChartData}
            mean={trends?.metrics?.steps?.mean || undefined}
            ewma={trends?.metrics?.steps?.ewma || undefined}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Systolic Blood Pressure (mmHg)</span>
          </h2>
          <TrendChart
            metricName="Systolic Blood Pressure"
            unit="mmHg"
            strokeColor="#e11d48"
            data={bpChartData}
            mean={trends?.metrics?.systolic_bp?.mean || undefined}
            ewma={trends?.metrics?.systolic_bp?.ewma || undefined}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Moon className="w-4 h-4 text-indigo-600" />
            <span>Sleep Duration (Hours)</span>
          </h2>
          <TrendChart
            metricName="Nightly Duration"
            unit="hours"
            strokeColor="#4f46e5"
            data={sleepChartData}
            mean={trends?.metrics?.sleep_duration?.mean ? trends.metrics.sleep_duration.mean / 60 : undefined}
            ewma={trends?.metrics?.sleep_duration?.ewma ? trends.metrics.sleep_duration.ewma / 60 : undefined}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-cyan-600" />
            <span>Fasting Blood Glucose (mg/dL)</span>
          </h2>
          <TrendChart
            metricName="Fasting Plasma Glucose"
            unit="mg/dL"
            strokeColor="#0284c7"
            data={glucoseChartData}
          />
        </div>
      </div>

      {/* Strict Missing Data & Boundary Note */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          <span>Longitudinal Telemetry Data Integrity Principle</span>
        </div>
        <p>
          Missing calendar days are never imputed as zero. Baseline averages and exponentially weighted moving averages
          (EWMA) reflect only verified observation days. A minimum of 3 observations (&ge;30% coverage) is required
          before computing rolling trends.
        </p>
      </div>
    </div>
  );
};
