import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PreventiveRecommendation } from '../types/api';
import { RecommendationsCard } from '../components/RecommendationsCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { Sparkles, RefreshCw } from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<PreventiveRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecommendations();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load preventive recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Synthesizing personalized preventive wellness recommendations..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Personalized Preventive Goals
          </h1>
          <p className="text-gray-600 mt-1">
            Achievable lifestyle recommendations synthesized directly from your clinical risk profile and longitudinal activity baselines.
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Goals
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
        <p className="font-bold">Evidence-Informed Clinical Grounding:</p>
        <p>
          Recommendations adhere strictly to WHO Guidelines on Physical Activity & Sedentary Behavior (2020) and American Diabetes Association Standards of Care in Diabetes (2024). They prioritize incremental, sustainable adjustments rather than extreme interventions.
        </p>
      </div>

      <RecommendationsCard recommendations={recommendations} />
    </div>
  );
};
