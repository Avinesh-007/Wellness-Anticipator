import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendsSummaryResponse, Measurement, ActivityRecord, DiabetesAssessmentResponse } from '../types/api';
import { TrendChart } from '../components/TrendChart';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import {
  Heart,
  Activity,
  Moon,
  Droplet,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [trends, setTrends] = useState<TrendsSummaryResponse | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [assessment, setAssessment] = useState<DiabetesAssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [trendsData, measurementsData, activitiesData] = await Promise.all([
          api.getTrends(14),
          api.getMeasurements(),
          api.getActivities(),
        ]);
        setTrends(trendsData);
        setMeasurements(measurementsData);
        setActivities(activitiesData);

        // Try loading existing assessment (non-blocking if not run yet)
        try {
          const assessData = await api.getDiabetesAssessment();
          setAssessment(assessData);
        } catch {
          // Assessment not yet performed
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard health data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Calculating personal baselines and longitudinal trends..." />;
  }

  // Latest clinical measurements
  const latestBP = measurements.find((m) => m.metric_type === 'BLOOD_PRESSURE');
  const latestGlucose = measurements.find((m) => m.metric_type === 'FASTING_GLUCOSE');
  const latestWeight = measurements.find((m) => m.metric_type === 'WEIGHT');

  // Chart data formatting (sorted chronologically)
  const stepsChartData = activities
    .slice()
    .sort((a, b) => a.recorded_date.localeCompare(b.recorded_date))
    .slice(-14)
    .map((a) => ({ date: a.recorded_date.slice(5), value: a.step_count }));

  const bpChartData = measurements
    .filter((m) => m.metric_type === 'BLOOD_PRESSURE')
    .slice()
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-14)
    .map((m) => ({ date: m.measured_at.slice(5, 10), value: m.value_numeric }));

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Personal Wellness Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous longitudinal trend analysis & evidence-informed preventive insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('vitals')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            + Log Vitals
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Review Screening
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Active Anomaly Alerts (if any) */}
      {trends?.anomalies && trends.anomalies.length > 0 && (
        <div className="space-y-3">
          {trends.anomalies.map((anom, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start space-x-3 shadow-sm ${
                anom.severity === 'URGENT_CLINICAL'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-current" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{anom.alert_type.replace(/_/g, ' ')}</h4>
                <p className="text-xs font-medium mt-0.5">{anom.message}</p>
                <p className="text-[11px] mt-1 text-slate-600">{anom.action_guidance}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Pressure Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blood Pressure</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {latestBP ? `${latestBP.value_numeric}/${latestBP.secondary_numeric}` : '—'}
            <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {latestBP ? `Measured on ${latestBP.measured_at.slice(0, 10)}` : 'No readings logged'}
          </div>
        </div>

        {/* Fasting Glucose Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fasting Glucose</span>
            <Droplet className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {latestGlucose ? latestGlucose.value_numeric : '—'}
            <span className="text-xs font-normal text-slate-400 ml-1">{latestGlucose?.unit || 'mg/dL'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {latestGlucose ? `Measured on ${latestGlucose.measured_at.slice(0, 10)}` : 'No readings logged'}
          </div>
        </div>

        {/* 14d Daily Steps EWMA Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Daily Steps (14d)</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {trends?.metrics?.steps?.ewma !== null && trends?.metrics?.steps?.ewma !== undefined
              ? Math.round(trends.metrics.steps.ewma)
              : '—'}
            <span className="text-xs font-normal text-slate-400 ml-1">EWMA</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {trends?.metrics?.steps?.data_quality_status === 'SUFFICIENT'
              ? `${trends.metrics.steps.sample_count}/14 days logged (${trends.metrics.steps.trend_direction})`
              : 'Insufficient telemetry'}
          </div>
        </div>

        {/* 14d Sleep Duration EWMA Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sleep Duration (14d)</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {trends?.metrics?.sleep_duration?.ewma !== null && trends?.metrics?.sleep_duration?.ewma !== undefined
              ? `${(trends.metrics.sleep_duration.ewma / 60).toFixed(1)}h`
              : '—'}
            <span className="text-xs font-normal text-slate-400 ml-1">avg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {trends?.metrics?.sleep_duration?.data_quality_status === 'SUFFICIENT'
              ? `${trends.metrics.sleep_duration.sample_count}/14 sessions logged`
              : 'Insufficient data'}
          </div>
        </div>
      </div>

      {/* Longitudinal Charts with EWMA Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <TrendChart
            data={stepsChartData}
            metricName="Daily Physical Activity (Steps)"
            unit="steps"
            ewma={trends?.metrics?.steps?.ewma ? Math.round(trends.metrics.steps.ewma) : null}
            mean={trends?.metrics?.steps?.mean ? Math.round(trends.metrics.steps.mean) : null}
            strokeColor="#10b981"
          />
        </div>
        <div>
          <TrendChart
            data={bpChartData}
            metricName="Systolic Blood Pressure"
            unit="mmHg"
            ewma={trends?.metrics?.systolic_bp?.ewma ? Math.round(trends.metrics.systolic_bp.ewma) : null}
            mean={trends?.metrics?.systolic_bp?.mean ? Math.round(trends.metrics.systolic_bp.mean) : null}
            strokeColor="#f43f5e"
          />
        </div>
      </div>

      {/* Diabetes Screening Snapshot Preview */}
      {assessment ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type 2 Diabetes Screening</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {assessment.ada_clinical_score.risk_category.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 mt-1">
              ADA Score: {assessment.ada_clinical_score.points}/10 pts • Survey Screening Probability:{' '}
              {(assessment.statistical_screening_model.calibrated_screening_probability * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {assessment.ada_clinical_score.clinical_guidance}
            </p>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>View Full Breakdown</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complete Your Preventive Diabetes Screening</h3>
            <p className="text-xs text-slate-500 mt-1">
              Run the validated ADA risk assessment and calibrated CDC BRFSS model to understand your metabolic risk factors.
            </p>
          </div>
          <button
            onClick={() => onNavigate('assessment')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Start Screening
          </button>
        </div>
      )}

      {/* Ethical & Telemetric Boundaries Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3 text-slate-500 text-xs">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Clinical Boundary Notice:</strong> Wellness Anticipator tracks personal lifestyle baselines and provides evidence-informed population screening. Telemetry (steps, sleep, screen time) is never used in isolation to diagnose chronic disease. Always consult a licensed physician for clinical diagnosis.
        </p>
      </div>
    </div>
  );
};
