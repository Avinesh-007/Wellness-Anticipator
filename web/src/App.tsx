import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VitalsEntryPage } from './pages/VitalsEntryPage';
import { ActivitySleepEntryPage } from './pages/ActivitySleepEntryPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ConsentPage } from './pages/ConsentPage';
import { ExportDeletePage } from './pages/ExportDeletePage';

const MainContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'vitals' && <VitalsEntryPage />}
        {activeTab === 'activity' && <ActivitySleepEntryPage />}
        {activeTab === 'assessment' && <AssessmentPage />}
        {activeTab === 'recommendations' && <RecommendationsPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'consent' && <ConsentPage />}
        {activeTab === 'export' && <ExportDeletePage />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500">
            Wellness Anticipator &bull; Preventive Health Stratification & Longitudinal Telemetry
          </p>
          <p>
            Clinical Disclaimer: This software provides statistical screening and preventive lifestyle guidance based on CDC BRFSS and ADA models. It is not an FDA-cleared diagnostic device and should never replace qualified clinical judgment.
          </p>
          <p className="text-[11px] text-slate-300">
            Compliant with GDPR Articles 17 & 20 &bull; Argon2id Authentication &bull; Scoped Multi-Tenant Isolation
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
