import React from 'react';
import { PreventiveRecommendation } from '../types/api';
import { CheckSquare, Activity, Utensils, Moon, Stethoscope } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: PreventiveRecommendation[];
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
        No active lifestyle recommendations generated. Complete your clinical profile or vitals entry to receive personalized goals.
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHYSICAL_ACTIVITY':
        return <Activity className="w-4 h-4 text-emerald-600" />;
      case 'NUTRITION':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'SLEEP':
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'CLINICAL_SCREENING':
      default:
        return <Stethoscope className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              {getCategoryIcon(rec.category)}
              <span>{rec.category.replace(/_/g, ' ')}</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {rec.difficulty}
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 mb-1.5">{rec.title}</h4>
          <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
            <strong>Target Action:</strong> {rec.target_action}
          </p>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">{rec.rationale}</p>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Basis: <strong>{rec.guideline_source}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
};
