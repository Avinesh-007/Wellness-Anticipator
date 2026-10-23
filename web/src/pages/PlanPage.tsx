import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PreventivePlan, PlanItem } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  ClipboardList,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Activity,
  Heart,
  Moon,
  Droplet,
  Info,
} from 'lucide-react';

interface PlanPageProps {
  onNavigate?: (tab: string) => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({ onNavigate }) => {
  const [plan, setPlan] = useState<PreventivePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [adoptingId, setAdoptingId] = useState<number | null>(null);

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const data = await api.getActivePlan();
      setPlan(data);
    } catch (err) {
      console.error('Failed to load preventive plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const freshPlan = await api.regeneratePlan();
      setPlan(freshPlan);
    } catch (err) {
      console.error('Failed to regenerate plan:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAdoptItem = async (item: PlanItem) => {
    setAdoptingId(item.id);
    try {
      await api.adoptPlanItem(item.id, { schedule_time: 'Daily Routine' });
      await loadPlan();
    } catch (err) {
      console.error('Failed to adopt recommendation:', err);
    } finally {
      setAdoptingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Synthesizing personalized preventive guidelines..." />;
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    PHYSICAL_ACTIVITY: <Activity className="w-5 h-5 text-emerald-600" />,
    NUTRITION: <Droplet className="w-5 h-5 text-teal-600" />,
    SLEEP: <Moon className="w-5 h-5 text-indigo-600" />,
    CLINICAL_SCREENING: <ShieldCheck className="w-5 h-5 text-rose-600" />,
    STRESS_MANAGEMENT: <Heart className="w-5 h-5 text-purple-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Grounded Preventive Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {plan?.title || 'Personalized Preventive Action Plan'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Synthesized directly from your clinical profile, validated ADA risk score, and 14-day longitudinal trends. Grounded strictly in CDC, ADA, and WHO medical guidelines.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Regenerating...' : 'Refresh Plan'}</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('habits')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <span>View Daily Habits</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Items List */}
      <div className="space-y-4">
        {plan?.items.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {categoryIcons[item.category] || <ClipboardList className="w-5 h-5 text-slate-600" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Goal #{idx + 1} &bull; {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {item.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{item.title}</h3>

                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-xs font-semibold text-slate-700">Target Preventive Action:</div>
                    <p className="text-xs text-slate-900 font-medium mt-0.5">{item.target_action}</p>
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Physiological Rationale: </span>
                    {item.rationale}
                  </div>

                  <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span>Clinical Basis: {item.guideline_source}</span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                {item.is_adopted_into_habit ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Adopted as Daily Habit</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAdoptItem(item)}
                    disabled={adoptingId === item.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{adoptingId === item.id ? 'Adopting...' : 'Adopt as Daily Habit'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Disclaimer Notice */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Clinical Decision Support Disclaimer: </span>
          The preventive wellness recommendations above are generated from validated clinical consensus guidelines (ADA, WHO, AHA). They are intended to assist informed lifestyle choices and self-management. They do not constitute formal medical diagnosis, pharmacotherapy prescription, or personalized medical orders.
        </div>
      </div>
    </div>
  );
};
