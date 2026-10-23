import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { Measurement } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { Heart, Trash2, Plus, Calendar, AlertCircle } from 'lucide-react';

export const VitalsEntryPage: React.FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [metricType, setMetricType] = useState<'BLOOD_PRESSURE' | 'FASTING_GLUCOSE' | 'WEIGHT' | 'HBA1C'>('BLOOD_PRESSURE');
  const [val1, setVal1] = useState<string>('120');
  const [val2, setVal2] = useState<string>('80'); // DBP for blood pressure
  const [unit, setUnit] = useState<string>('mmHg');
  const [measuredAt, setMeasuredAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update default units when metricType changes
  const handleMetricChange = (type: any) => {
    setMetricType(type);
    if (type === 'BLOOD_PRESSURE') {
      setUnit('mmHg');
      setVal1('120');
      setVal2('80');
    } else if (type === 'FASTING_GLUCOSE') {
      setUnit('mg/dL');
      setVal1('95');
      setVal2('');
    } else if (type === 'WEIGHT') {
      setUnit('kg');
      setVal1('72');
      setVal2('');
    } else if (type === 'HBA1C') {
      setUnit('%');
      setVal1('5.4');
      setVal2('');
    }
  };

  const loadMeasurements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMeasurements();
      setMeasurements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load measurements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const numericVal1 = parseFloat(val1);
    if (isNaN(numericVal1)) {
      setError('Please provide a valid numeric value.');
      return;
    }

    let secondaryNum: number | undefined = undefined;
    if (metricType === 'BLOOD_PRESSURE') {
      const numericVal2 = parseFloat(val2);
      if (isNaN(numericVal2)) {
        setError('Diastolic blood pressure is required.');
        return;
      }
      if (numericVal1 <= numericVal2) {
        setError('Systolic blood pressure must be strictly greater than diastolic.');
        return;
      }
      if (numericVal1 > 300 || numericVal1 < 40 || numericVal2 > 200 || numericVal2 < 30) {
        setError('Blood pressure readings are outside physiological bounds (40-300 / 30-200 mmHg).');
        return;
      }
      secondaryNum = numericVal2;
    }

    setIsSubmitting(true);
    try {
      await api.createMeasurement({
        metric_type: metricType,
        value_numeric: numericVal1,
        secondary_numeric: secondaryNum,
        unit: unit,
        measured_at: new Date(measuredAt).toISOString(),
        notes: notes.trim() || undefined,
      });

      setSuccessMsg(`Successfully logged ${metricType.replace(/_/g, ' ')} measurement.`);
      setNotes('');
      loadMeasurements();
    } catch (err: any) {
      if (err instanceof ApiError && err.errorCode === 'CONSENT_REQUIRED_OR_REVOKED') {
        setError('Cannot log vitals: CLINICAL_MEASUREMENTS consent has not been granted. Please enable consent in the Consents tab.');
      } else {
        setError(err.message || 'Failed to record measurement.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMeasurement(id);
      setMeasurements(measurements.filter((m) => m.id !== id));
      setSuccessMsg('Record deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete record.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Vitals & Measurements</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Log point-in-time clinical observations with rigorous schema validation and unit standardization
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      {/* Ingestion Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Manual Measurement Entry</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metric Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observation Type</label>
              <select
                value={metricType}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="BLOOD_PRESSURE">Blood Pressure (Systolic & Diastolic)</option>
                <option value="FASTING_GLUCOSE">Fasting Blood Glucose</option>
                <option value="WEIGHT">Body Weight</option>
                <option value="HBA1C">Glycated Hemoglobin (HbA1c)</option>
              </select>
            </div>

            {/* Measurement Timestamp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observation Time</label>
              <input
                type="datetime-local"
                required
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Dynamic Numeric Value Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {metricType === 'BLOOD_PRESSURE' ? 'Systolic Pressure (SBP)' : 'Numeric Reading'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={val1}
                onChange={(e) => setVal1(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {metricType === 'BLOOD_PRESSURE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Diastolic Pressure (DBP)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={val2}
                  onChange={(e) => setVal2(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {metricType === 'BLOOD_PRESSURE' && <option value="mmHg">mmHg</option>}
                {metricType === 'FASTING_GLUCOSE' && (
                  <>
                    <option value="mg/dL">mg/dL</option>
                    <option value="mmol/L">mmol/L</option>
                  </>
                )}
                {metricType === 'WEIGHT' && (
                  <>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </>
                )}
                {metricType === 'HBA1C' && <option value="%">%</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Clinical Context / Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., resting reading 30 mins after waking, before coffee"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Observation...' : 'Record Observation'}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Observations Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Historical Measurements & Provenance</h3>

        {isLoading ? (
          <LoadingSpinner message="Loading records..." />
        ) : measurements.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No clinical observations logged yet. Use the form above to record your first measurement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Observed Time</th>
                  <th className="pb-3">Source & Quality</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">
                      {m.metric_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900">
                      {m.metric_type === 'BLOOD_PRESSURE'
                        ? `${m.value_numeric}/${m.secondary_numeric} ${m.unit}`
                        : `${m.value_numeric} ${m.unit}`}
                    </td>
                    <td className="py-3 text-slate-500">
                      {m.measured_at.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="py-3">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mr-1.5">
                        {m.source}
                      </span>
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {m.quality_status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 italic max-w-xs truncate">
                      {m.notes || '—'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
