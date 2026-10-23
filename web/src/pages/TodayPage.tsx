import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Habit,
  HabitAdherenceSummary,
  PreventivePlan,
  TrendsSummaryResponse,
  WellbeingCheckIn,
  Measurement,
} from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  CheckCircle2,
  Circle,
  PlusCircle,
  TrendingUp,
  Heart,
  Moon,
  Activity,
  Droplet,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Sun,
  Flame,
} from 'lucide-react';

interface TodayPageProps {
  onNavigate: (tab: string) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({ onNavigate }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [adherence, setAdherence] = useState<HabitAdherenceSummary | null>(null);
  const [plan, setPlan] = useState<PreventivePlan | null>(null);
  const [trends, setTrends] = useState<TrendsSummaryResponse | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [todayWellbeing, setTodayWellbeing] = useState<WellbeingCheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Quick Wellbeing check-in state
  const [quickMood, setQuickMood] = useState<number>(4);
  const [quickStress, setQuickStress] = useState<string>('LOW');
  const [submittingWellbeing, setSubmittingWellbeing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [habitsData, adhData, planData, trendsData, measurementsData, wellbeingData] = await Promise.all([
        api.getHabits(),
        api.getHabitAdherenceSummary(),
        api.getActivePlan(),
        api.getTrends(14),
        api.getMeasurements(),
        api.getTodayWellbeing(),
      ]);
      setHabits(habitsData);
      setAdherence(adhData);
      setPlan(planData);
      setTrends(trendsData);
      setMeasurements(measurementsData);
      setTodayWellbeing(wellbeingData);
    } catch (err) {
      console.error('Failed to load Today page data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleHabit = async (habit: Habit) => {
    setActionLoading(habit.id);
    try {
      const newStatus = habit.completed_today ? 'SKIPPED' : 'COMPLETED';
      await api.logHabit(habit.id, {
        status: newStatus,
        notes: newStatus === 'COMPLETED' ? 'Completed on Today screen' : 'Marked skipped',
      });
      // Refresh habits and adherence
      const [updatedHabits, updatedAdherence] = await Promise.all([
        api.getHabits(),
        api.getHabitAdherenceSummary(),
      ]);
      setHabits(updatedHabits);
      setAdherence(updatedAdherence);
    } catch (err) {
      console.error('Error toggling habit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdoptItem = async (itemId: number) => {
    try {
      await api.adoptPlanItem(itemId, { schedule_time: 'Daily Routine' });
      await loadData();
    } catch (err) {
      console.error('Failed to adopt plan recommendation:', err);
    }
  };

  const handleQuickWellbeingSubmit = async () => {
    setSubmittingWellbeing(true);
    try {
      const checkin = await api.submitWellbeingCheckIn({
        mood_score: quickMood,
        stress_level: quickStress,
        energy_level: quickMood,
        reflection_notes: 'Quick check-in logged from Today dashboard',
      });
      setTodayWellbeing(checkin);
    } catch (err) {
      console.error('Failed to submit wellbeing:', err);
    } finally {
      setSubmittingWellbeing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Assembling your personalized daily wellness routine..." />;
  }

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Recent measurements for baselines
  const latestBP = measurements.find((m) => m.metric_type === 'BLOOD_PRESSURE');
  const latestGlucose = measurements.find((m) => m.metric_type === 'FASTING_GLUCOSE');
  const latestWeight = measurements.find((m) => m.metric_type === 'WEIGHT');

  // Baseline data from trends engine
  const bpBaseline = trends?.metrics?.systolic_bp;
  const stepsBaseline = trends?.metrics?.steps;
  const sleepBaseline = trends?.metrics?.sleep_duration;

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Personalized Preventive Routine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Today's Preventive Action Plan</h1>
            <p className="text-emerald-100 text-sm mt-1">{todayDateStr} &bull; Sustainable Daily Consistency</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('records')}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Log Health Vitals</span>
            </button>
            <button
              onClick={() => onNavigate('plan')}
              className="px-4 py-2.5 bg-emerald-600/50 hover:bg-emerald-600/70 border border-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors"
            >
              View Full Plan
            </button>
          </div>
        </div>

        {/* Adherence Consistency Highlights Bar */}
        {adherence && (
          <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-emerald-200">Today's Progress</div>
              <div className="text-xl font-bold mt-0.5">
                {adherence.completed_today_count} / {adherence.total_active_habits}
              </div>
              <div className="text-[11px] text-emerald-200">{adherence.today_completion_rate}% completed</div>
            </div>
            <div>
              <div className="text-xs text-emerald-200">7-Day Consistency</div>
              <div className="text-xl font-bold mt-0.5">{adherence.seven_day_consistency_rate}%</div>
              <div className="text-[11px] text-emerald-200">Target: &ge; 70%</div>
            </div>
            <div>
              <div className="text-xs text-emerald-200">30-Day Adherence</div>
              <div className="text-xl font-bold mt-0.5">{adherence.thirty_day_consistency_rate}%</div>
              <div className="text-[11px] text-emerald-200">Long-term habit strength</div>
            </div>
            <div>
              <div className="text-xs text-emerald-200">Recovery Support</div>
              <div className="text-xs font-medium text-emerald-100 mt-1 line-clamp-2">
                {adherence.recovery_recommendation || 'Consistency builds one day at a time.'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Habit Checklist (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Today's Daily Habit Checklist</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Micro-actions that directly mitigate chronic cardiometabolic risks
                </p>
              </div>
              <button
                onClick={() => onNavigate('habits')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
              >
                <span>Manage Habits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">No active habits yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Adopt evidence-informed recommendations from your Preventive Plan to establish sustainable daily wellness routines.
                </p>
                <button
                  onClick={() => onNavigate('plan')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Explore Preventive Recommendations
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                      habit.completed_today
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <button
                        onClick={() => handleToggleHabit(habit)}
                        disabled={actionLoading === habit.id}
                        className="mt-0.5 text-emerald-600 focus:outline-hidden"
                        title={habit.completed_today ? 'Mark uncompleted' : 'Mark completed'}
                      >
                        {habit.completed_today ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500 transition-colors" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3
                            className={`text-sm font-bold ${
                              habit.completed_today ? 'text-emerald-950 line-through' : 'text-slate-900'
                            }`}
                          >
                            {habit.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md uppercase">
                            {habit.category.replace('_', ' ')}
                          </span>
                          {habit.schedule_time && (
                            <span className="text-[11px] text-slate-400 font-medium">{habit.schedule_time}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{habit.target_action}</p>
                        <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                          <span>7-Day Consistency: {habit.seven_day_consistency_pct}%</span>
                          <span>&bull;</span>
                          <span>Difficulty: {habit.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleHabit(habit)}
                      disabled={actionLoading === habit.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        habit.completed_today
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {actionLoading === habit.id ? 'Saving...' : habit.completed_today ? 'Done' : 'Mark Complete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vitals Baseline & Telemetry Defect-Resolution Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Personal Baseline Tracking (14-Day Window)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exponentially weighted averages & missing-observation progress (never imputed as zero)
                </p>
              </div>
              <button
                onClick={() => onNavigate('trends')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>Full Trends</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Blood Pressure Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Blood Pressure</span>
                  </span>
                  {bpBaseline?.data_quality_status === 'SUFFICIENT' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Baseline Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                      {bpBaseline?.sample_count || 0}/3 Logs
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold text-slate-900">
                    {latestBP ? `${latestBP.value_numeric}/${latestBP.secondary_numeric || 80}` : 'No Readings'}
                    <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {bpBaseline?.ewma
                      ? `EWMA: ${Math.round(bpBaseline.ewma)} mmHg (Stable)`
                      : bpBaseline?.notes || 'Log at least 3 days to establish personal EWMA baseline.'}
                  </div>
                </div>

                {bpBaseline?.data_quality_status !== 'SUFFICIENT' && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, ((bpBaseline?.sample_count || 0) / 3) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onNavigate('records')}
                      className="mt-2 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      + Log BP Reading
                    </button>
                  </div>
                )}
              </div>

              {/* Physical Activity (Steps) Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Daily Steps</span>
                  </span>
                  {stepsBaseline?.data_quality_status === 'SUFFICIENT' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Baseline Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                      {stepsBaseline?.sample_count || 0}/3 Logs
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold text-slate-900">
                    {stepsBaseline?.latest_value ? Math.round(stepsBaseline.latest_value).toLocaleString() : 'No Logs'}
                    <span className="text-xs font-normal text-slate-500 ml-1">steps</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stepsBaseline?.ewma
                      ? `14d EWMA: ${Math.round(stepsBaseline.ewma).toLocaleString()} steps`
                      : stepsBaseline?.notes || 'Log 3 days of step telemetry to compute moving average.'}
                  </div>
                </div>

                {stepsBaseline?.data_quality_status !== 'SUFFICIENT' && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, ((stepsBaseline?.sample_count || 0) / 3) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onNavigate('records')}
                      className="mt-2 w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      + Log Activity
                    </button>
                  </div>
                )}
              </div>

              {/* Sleep Duration Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Sleep Rest</span>
                  </span>
                  {sleepBaseline?.data_quality_status === 'SUFFICIENT' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Baseline Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                      {sleepBaseline?.sample_count || 0}/3 Logs
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold text-slate-900">
                    {sleepBaseline?.latest_value
                      ? `${(sleepBaseline.latest_value / 60).toFixed(1)} hrs`
                      : 'No Logs'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {sleepBaseline?.ewma
                      ? `14d EWMA: ${(sleepBaseline.ewma / 60).toFixed(1)} hrs`
                      : sleepBaseline?.notes || 'Record sleep to observe circadian regularity.'}
                  </div>
                </div>

                {sleepBaseline?.data_quality_status !== 'SUFFICIENT' && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, ((sleepBaseline?.sample_count || 0) / 3) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onNavigate('records')}
                      className="mt-2 w-full text-center text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      + Log Sleep
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Wellbeing Check-in + Plan Highlights (1 Col) */}
        <div className="space-y-6">
          {/* Quick Subjective Wellbeing Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Smile className="w-5 h-5 text-amber-500" />
              <span>Today's Wellbeing Check-In</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Subjective mood & stress perception (non-diagnostic reflection)
            </p>

            {todayWellbeing ? (
              <div className="mt-4 p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-900">Logged Today</div>
                  <span className="text-xs font-semibold text-amber-700">
                    Mood: {todayWellbeing.mood_score}/5 &bull; Stress: {todayWellbeing.stress_level}
                  </span>
                </div>
                {todayWellbeing.reflection_notes && (
                  <p className="text-xs text-amber-800 mt-2 italic">"{todayWellbeing.reflection_notes}"</p>
                )}
                <button
                  onClick={() => onNavigate('wellbeing')}
                  className="mt-3 text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
                >
                  <span>View 14-Day Wellbeing Trends</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">How is your mood today?</label>
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[
                      { score: 1, label: 'Low' },
                      { score: 2, label: 'Fair' },
                      { score: 3, label: 'Okay' },
                      { score: 4, label: 'Good' },
                      { score: 5, label: 'Great' },
                    ].map((m) => (
                      <button
                        key={m.score}
                        type="button"
                        onClick={() => setQuickMood(m.score)}
                        className={`py-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                          quickMood === m.score
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Perceived Stress Level</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['LOW', 'MODERATE', 'HIGH'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setQuickStress(lvl)}
                        className={`py-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                          quickStress === lvl
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleQuickWellbeingSubmit}
                  disabled={submittingWellbeing}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {submittingWellbeing ? 'Saving...' : 'Save Daily Check-In'}
                </button>
              </div>
            )}
          </div>

          {/* Active Plan Highlights Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Preventive Plan Focus</span>
              </h2>
              <button
                onClick={() => onNavigate('plan')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
              >
                <span>All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {plan && plan.items.length > 0 ? (
              <div className="space-y-3">
                {plan.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.difficulty}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-2">{item.title}</h3>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{item.target_action}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {item.guideline_source}
                      </span>
                      {!item.is_adopted_into_habit ? (
                        <button
                          onClick={() => handleAdoptItem(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          Adopt Habit
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Habit</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">Generating evidence-based plan...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
