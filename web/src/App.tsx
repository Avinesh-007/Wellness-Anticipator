import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { PlanPage } from './pages/PlanPage';
import { HealthTrendsPage } from './pages/HealthTrendsPage';
import { WellbeingPage } from './pages/WellbeingPage';
import { RecordsPage } from './pages/RecordsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { SettingsPage } from './pages/SettingsPage';

const MainContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('today');
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
        {(activeTab === 'today' || activeTab === 'dashboard') && <TodayPage onNavigate={setActiveTab} />}
        {activeTab === 'habits' && <HabitsPage onNavigate={setActiveTab} />}
        {(activeTab === 'plan' || activeTab === 'recommendations') && <PlanPage onNavigate={setActiveTab} />}
        {activeTab === 'trends' && <HealthTrendsPage onNavigate={setActiveTab} />}
        {activeTab === 'wellbeing' && <WellbeingPage />}
        {(activeTab === 'records' || activeTab === 'vitals' || activeTab === 'activity') && <RecordsPage />}
        {activeTab === 'assessment' && <AssessmentPage />}
        {(activeTab === 'settings' || activeTab === 'profile' || activeTab === 'consent' || activeTab === 'export') && (
          <SettingsPage />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-500">
            Wellness Anticipator &bull; From Reactive Disease Treatment to Personalized Preventive Wellness
          </p>
          <p>
            Clinical Disclaimer: This platform provides evidence-informed lifestyle guidance and statistical screening based on CDC BRFSS and ADA models. It is not an FDA-cleared diagnostic device and should never replace qualified clinical judgment.
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
