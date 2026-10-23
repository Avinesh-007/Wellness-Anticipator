import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Habit, HabitAdherenceSummary, HabitCreateRequest } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  Sparkles,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  Filter,
  Flame,
  Award,
} from 'lucide-react';

interface HabitsPageProps {
  onNavigate?: (tab: string) => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [adherence, setAdherence] = useState<HabitAdherenceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // New Habit Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('PHYSICAL_ACTIVITY');
  const [newAction, setNewAction] = useState('');
  const [newSchedule, setNewSchedule] = useState('Morning');
  const [newDifficulty, setNewDifficulty] = useState('ACHIEVABLE');
  const [creatingHabit, setCreatingHabit] = useState(false);

  const loadHabitsData = async () => {
    setIsLoading(true);
    try {
      const [habitsData, adhData] = await Promise.all([
        api.getHabits(true), // include inactive
        api.getHabitAdherenceSummary(),
      ]);
      setHabits(habitsData);
      setAdherence(adhData);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabitsData();
  }, []);

  const handleToggleHabit = async (habit: Habit) => {
    setActionLoading(habit.id);
    try {
      const newStatus = habit.completed_today ? 'SKIPPED' : 'COMPLETED';
      await api.logHabit(habit.id, {
        status: newStatus,
        notes: newStatus === 'COMPLETED' ? 'Marked complete' : 'Marked skipped',
      });
      await loadHabitsData();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (habit: Habit) => {
    setActionLoading(habit.id);
    try {
      await api.updateHabit(habit.id, { is_active: !habit.is_active });
      await loadHabitsData();
    } catch (err) {
      console.error('Failed to update habit active status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    if (!window.confirm('Are you sure you want to delete this habit and its historical logs?')) return;
    setActionLoading(habitId);
    try {
      await api.deleteHabit(habitId);
      await loadHabitsData();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAction.trim()) return;

    setCreatingHabit(true);
    try {
      await api.createHabit({
        title: newTitle.trim(),
        category: newCategory,
        target_action: newAction.trim(),
        schedule_time: newSchedule,
        difficulty: newDifficulty,
        frequency: 'DAILY',
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewAction('');
      await loadHabitsData();
    } catch (err) {
      console.error('Failed to create habit:', err);
    } finally {
      setCreatingHabit(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading habit adherence analytics..." />;
  }

  const filteredHabits = habits.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    return h.category === selectedCategory;
  });

  const categories = ['ALL', 'PHYSICAL_ACTIVITY', 'NUTRITION', 'SLEEP', 'STRESS_MANAGEMENT', 'CLINICAL'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            <span>Daily Preventive Habit Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Building long-term behavioral consistency without guilt or rigid streak mechanics
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Habit</span>
        </button>
      </div>

      {/* Adherence Summary Bar */}
      {adherence && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <span className="text-xs font-semibold text-slate-500">Today's Completion</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {adherence.completed_today_count} / {adherence.total_active_habits}
                </span>
                <span className="text-xs font-semibold text-emerald-600">({adherence.today_completion_rate}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${adherence.today_completion_rate}%` }}
                />
              </div>
            </div>

            <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <span className="text-xs font-semibold text-slate-500">7-Day Consistency Rate</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{adherence.seven_day_consistency_rate}%</div>
              <div className="text-xs text-slate-500 mt-1">Short-term routine stability</div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${adherence.seven_day_consistency_rate}%` }}
                />
              </div>
            </div>

            <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <span className="text-xs font-semibold text-slate-500">30-Day Longitudinal Adherence</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{adherence.thirty_day_consistency_rate}%</div>
              <div className="text-xs text-slate-500 mt-1">Protective cardiovascular habit foundation</div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${adherence.thirty_day_consistency_rate}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-800 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Supportive Feedback</span>
              </span>
              <p className="text-xs text-slate-700 font-medium mt-1.5">{adherence.supportive_feedback}</p>
              {adherence.recovery_recommendation && (
                <div className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {adherence.recovery_recommendation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center">
          <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Habits' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No habits in this category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a new habit or adopt recommendations from your Preventive Plan.
            </p>
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <div
              key={habit.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                !habit.is_active
                  ? 'border-slate-200 opacity-60 bg-slate-50/70'
                  : habit.completed_today
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => handleToggleHabit(habit)}
                    disabled={!habit.is_active || actionLoading === habit.id}
                    className="mt-1 focus:outline-hidden"
                    title={habit.completed_today ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {habit.completed_today ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-7 h-7 text-slate-300 hover:text-emerald-500 transition-colors" />
                    )}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-base font-bold ${
                          habit.completed_today ? 'text-emerald-950 line-through' : 'text-slate-900'
                        }`}
                      >
                        {habit.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {habit.category.replace('_', ' ')}
                      </span>
                      {habit.schedule_time && (
                        <span className="text-xs font-medium text-slate-400">({habit.schedule_time})</span>
                      )}
                      {!habit.is_active && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md">
                          PAUSED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{habit.target_action}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span>7-Day Consistency: {habit.seven_day_consistency_pct}%</span>
                      </div>
                      <span>&bull;</span>
                      <span>Difficulty: {habit.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleHabit(habit)}
                    disabled={!habit.is_active || actionLoading === habit.id}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      habit.completed_today
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {actionLoading === habit.id ? 'Saving...' : habit.completed_today ? 'Completed' : 'Mark Done'}
                  </button>

                  <button
                    onClick={() => handleToggleActive(habit)}
                    className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
                    title={habit.is_active ? 'Pause habit' : 'Resume habit'}
                  >
                    {habit.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Add Custom Preventive Habit</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define a sustainable daily micro-behavior to track over time
            </p>

            <form onSubmit={handleCreateHabit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Habit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15-Minute Post-Lunch Brisk Walk"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="PHYSICAL_ACTIVITY">Physical Activity</option>
                    <option value="NUTRITION">Nutrition</option>
                    <option value="SLEEP">Sleep Hygiene</option>
                    <option value="STRESS_MANAGEMENT">Stress & Recovery</option>
                    <option value="CLINICAL">Clinical / Lab</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Scheduled Time / Anchor</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning, After Dinner, 13:00"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Actionable Micro-Step *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the exact, achievable micro-step you will complete..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Difficulty</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['EASY', 'ACHIEVABLE', 'MODERATE'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewDifficulty(d)}
                      className={`py-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                        newDifficulty === d
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingHabit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {creatingHabit ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
