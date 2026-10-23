import React, { useState } from 'react';
import { VitalsEntryPage } from './VitalsEntryPage';
import { ActivitySleepEntryPage } from './ActivitySleepEntryPage';
import { Heart, Activity, Moon } from 'lucide-react';

export const RecordsPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'vitals' | 'activity'>('vitals');

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('vitals')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors ${
            subTab === 'vitals'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Clinical Vitals Entry (BP, Glucose, Weight)</span>
        </button>

        <button
          onClick={() => setSubTab('activity')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors ${
            subTab === 'activity'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity & Sleep Logging</span>
        </button>
      </div>

      {subTab === 'vitals' ? <VitalsEntryPage /> : <ActivitySleepEntryPage />}
    </div>
  );
};
