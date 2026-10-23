import React, { useState } from 'react';
import { ProfilePage } from './ProfilePage';
import { ConsentPage } from './ConsentPage';
import { ExportDeletePage } from './ExportDeletePage';
import { User, ShieldCheck, Download, Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'profile' | 'consent' | 'privacy'>('profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>Account, Profile & Privacy Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal clinical history, data consents, and GDPR Article 17/20 portability rights
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('profile')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors ${
            subTab === 'profile'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Clinical Profile & Medical History</span>
        </button>

        <button
          onClick={() => setSubTab('consent')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors ${
            subTab === 'consent'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Consent Preferences</span>
        </button>

        <button
          onClick={() => setSubTab('privacy')}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-bold border-b-2 transition-colors ${
            subTab === 'privacy'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>GDPR Portability & Deletion</span>
        </button>
      </div>

      {subTab === 'profile' && <ProfilePage />}
      {subTab === 'consent' && <ConsentPage />}
      {subTab === 'privacy' && <ExportDeletePage />}
    </div>
  );
};
