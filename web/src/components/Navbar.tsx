import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Heart,
  ShieldCheck,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Flame,
  CheckSquare
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <TrendingUp className="w-4 h-4 mr-1.5" /> },
    { id: 'vitals', label: 'Vitals Entry', icon: <Heart className="w-4 h-4 mr-1.5" /> },
    { id: 'activity', label: 'Activity & Sleep', icon: <Activity className="w-4 h-4 mr-1.5" /> },
    { id: 'assessment', label: 'Diabetes Screening', icon: <Flame className="w-4 h-4 mr-1.5" /> },
    { id: 'recommendations', label: 'Wellness Goals', icon: <CheckSquare className="w-4 h-4 mr-1.5" /> },
    { id: 'profile', label: 'Profile & History', icon: <User className="w-4 h-4 mr-1.5" /> },
    { id: 'consent', label: 'Consents', icon: <ShieldCheck className="w-4 h-4 mr-1.5" /> },
    { id: 'export', label: 'Data & Privacy', icon: <Settings className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight">Wellness Anticipator</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Preventive
                </span>
              </div>
            </div>

            <nav className="hidden md:flex ml-8 space-x-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.full_name || 'User'}</div>
              <div className="text-xs text-slate-400 truncate max-w-[150px]">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 space-x-1 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-600 bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
