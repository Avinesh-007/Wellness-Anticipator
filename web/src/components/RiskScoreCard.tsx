import React from 'react';
import { DiabetesAssessmentResponse } from '../types/api';
import { AlertCircle, CheckCircle, ShieldAlert, FileText, Info } from 'lucide-react';

interface RiskScoreCardProps {
  assessment: DiabetesAssessmentResponse;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ assessment }) => {
  const {
    ada_clinical_score,
    statistical_screening_model,
    contributing_factors,
    safety_escalations,
    clinical_limitations_and_disclaimer,
  } = assessment;

  const isAdaHighRisk = ada_clinical_score.points >= 5;
  const modelPct = (statistical_screening_model.calibrated_screening_probability * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Critical Safety Escalation Banners */}
      {safety_escalations && safety_escalations.length > 0 && (
        <div className="space-y-3">
          {safety_escalations.map((esc, i) => (
            <div key={i} className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl shadow-sm text-rose-900">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm tracking-tight">{esc.message}</h4>
                  <p className="text-xs mt-1 text-rose-700 leading-relaxed">{esc.guidance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Dual Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Validated ADA Questionnaire */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-1 text-slate-400" />
                Validated Clinical Screener
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isAdaHighRisk
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {ada_clinical_score.risk_category.replace(/_/g, ' ')}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900">{ada_clinical_score.tool_name}</h3>
            <div className="my-4 flex items-baseline space-x-2">
              <span className="text-4xl font-black text-slate-900">{ada_clinical_score.points}</span>
              <span className="text-base text-slate-400 font-semibold">/ {ada_clinical_score.max_points} pts</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {ada_clinical_score.clinical_guidance}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
            <span>Threshold for lab screening is <strong>5 points</strong>. Validated by the ADA.</span>
          </div>
        </div>

        {/* Panel 2: Calibrated Survey ML Screening Model */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1 text-slate-400" />
                Calibrated Population Model
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {statistical_screening_model.risk_tier.replace(/_/g, ' ')}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900">CDC BRFSS Tabular Screening Model</h3>
            <div className="my-4 flex items-baseline space-x-2">
              <span className="text-4xl font-black text-emerald-600">{modelPct}%</span>
              <span className="text-xs text-slate-400 font-medium">calibrated screening probability</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {statistical_screening_model.intended_prediction_target}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
            <span>Architecture: {statistical_screening_model.model_architecture}</span>
          </div>
        </div>
      </div>

      {/* Contributing Factors & Protective Strengths */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Explainable Factor Attributions</h3>
        <p className="text-xs text-slate-500 mb-4">
          Transparent breakdown of individual indicators that increased or decreased your screening score.
        </p>

        <div className="space-y-3">
          {contributing_factors.map((factor, idx) => {
            const isRisk = factor.impact === 'POSITIVE_RISK';
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-colors ${
                  isRisk
                    ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                }`}
              >
                {isRisk ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{factor.feature_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isRisk ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isRisk ? 'Risk Elevator' : 'Protective Factor'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                    {factor.plain_language_explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Limitations & Ethical Boundaries */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Info className="w-4 h-4 text-slate-500" />
          <span>Clinical Scope & Boundaries</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {clinical_limitations_and_disclaimer.screening_nature}
        </p>
        <p className="text-[11px] leading-relaxed font-medium text-slate-700">
          {clinical_limitations_and_disclaimer.medical_escalation_guidance}
        </p>
      </div>
    </div>
  );
};
