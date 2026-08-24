import { useMemo, useState } from 'react';
import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import {
  getCompletionMap,
  getDayProgress,
  calculateStreaks,
  calculateGoalStats,
  getMostConsistentGoal,
  getMostMissedGoal,
  getScheduledGoalsForDate,
} from '@/lib/goals';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  eachDayInRange,
  toDateStr,
  parseDateStr,
  formatDateShort,
} from '@/lib/date';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProgressRing } from '@/components/ui/ProgressRing';

type Period = 'week' | 'month' | 'year' | 'all';

export function ProgressPage() {
  const { settings } = useAuth();
  const { goals, categories, completions, loading, error, refetch } = useGoals();
  const [period, setPeriod] = useState<Period>('month');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periodStart = useMemo(() => {
    switch (period) {
      case 'week': return startOfWeek(today);
      case 'month': return startOfMonth(today);
      case 'year': return startOfYear(today);
      case 'all':
        const earliest = goals
          .map((g) => parseDateStr(g.start_date))
          .sort((a, b) => a.getTime() - b.getTime())[0];
        return earliest ?? today;
    }
  }, [period, goals]);

  const periodStats = useMemo(() => {
    const days = eachDayInRange(periodStart, today);
    const completionMap = getCompletionMap(completions);

    let totalScheduled = 0;
    let totalCompleted = 0;
    let daysTracked = 0;
    const dailyData: { date: Date; percentage: number; total: number; completed: number }[] = [];

    for (const day of days) {
      const progress = getDayProgress(goals, day, completionMap);
      if (progress.total > 0) {
        daysTracked++;
        totalScheduled += progress.total;
        totalCompleted += progress.completed;
      }
      dailyData.push({ date: day, percentage: progress.percentage, total: progress.total, completed: progress.completed });
    }

    const completionPercentage = totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;

    return {
      totalScheduled,
      totalCompleted,
      daysTracked,
      completionPercentage,
      dailyData,
    };
  }, [periodStart, goals, completions]);

  const streak = useMemo(
    () => calculateStreaks(goals, completions, settings?.completion_threshold ?? 70, today),
    [goals, completions, settings]
  );

  const mostConsistent = useMemo(
    () => getMostConsistentGoal(goals, completions, today),
    [goals, completions]
  );

  const mostMissed = useMemo(
    () => getMostMissedGoal(goals, completions, today),
    [goals, completions]
  );

  const totalActiveGoals = useMemo(
    () => goals.filter((g) => g.is_active).length,
    [goals]
  );

  const periodLabels: Record<Period, string> = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  const hasData = goals.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800 font-display mb-1">Progress</h1>
        <p className="text-stone-500">Your statistics and streaks over time.</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['week', 'month', 'year', 'all'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              period === p
                ? 'bg-sage-500 text-white'
                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-50 flex items-center justify-center mx-auto mb-4">
            <Activity size={32} className="text-stone-300" />
          </div>
          <h3 className="text-xl font-semibold text-stone-700 font-display mb-2">No data yet</h3>
          <p className="text-stone-500">Create some goals to start tracking your progress.</p>
        </div>
      ) : (
        <>
          {/* Main stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={<Flame size={20} />}
              label="Current Streak"
              value={`${streak.current}`}
              unit="days"
              color="clay"
            />
            <StatCard
              icon={<Trophy size={20} />}
              label="Longest Streak"
              value={`${streak.longest}`}
              unit="days"
              color="sand"
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Completed"
              value={`${periodStats.totalCompleted}`}
              unit="goals"
              color="sage"
            />
            <StatCard
              icon={<Calendar size={20} />}
              label="Days Tracked"
              value={`${periodStats.daysTracked}`}
              unit="days"
              color="sky"
            />
          </div>

          {/* Completion rate */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing
                percentage={periodStats.completionPercentage}
                size={120}
                sublabel={`${periodStats.totalCompleted}/${periodStats.totalScheduled}`}
              />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-stone-700 mb-1">
                  {periodLabels[period]} Completion
                </h2>
                <p className="text-3xl font-bold text-stone-800 font-display">
                  {periodStats.completionPercentage}%
                </p>
                <p className="text-stone-500 mt-1 text-sm">
                  {periodStats.totalCompleted} of {periodStats.totalScheduled} scheduled goals completed
                </p>
                <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
                  <div className="flex items-center gap-1.5 text-sm text-stone-500">
                    <Target size={16} className="text-sage-500" />
                    {totalActiveGoals} active goals
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily chart */}
          {period !== 'all' && periodStats.dailyData.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold text-stone-700 mb-4">Daily Breakdown</h2>
              <div className="flex items-end gap-1 sm:gap-2 h-40 overflow-x-auto pb-2">
                {periodStats.dailyData.map((day) => {
                  const height = day.total > 0 ? Math.max((day.percentage / 100) * 100, 4) : 2;
                  const color = day.percentage >= 100
                    ? 'bg-sage-400'
                    : day.percentage >= 50
                    ? 'bg-sand-300'
                    : day.percentage > 0
                    ? 'bg-clay-200'
                    : 'bg-stone-100';
                  return (
                    <div
                      key={toDateStr(day.date)}
                      className="flex-1 min-w-[24px] flex flex-col items-center justify-end gap-1"
                      title={`${formatDateShort(day.date)}: ${day.completed}/${day.total} (${day.percentage}%)`}
                    >
                      <span className="text-[10px] text-stone-400">{day.percentage}%</span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${color}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-stone-400">{day.date.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Most consistent / most missed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {mostConsistent && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={18} className="text-sage-500" />
                  <h3 className="font-semibold text-stone-700">Most Consistent</h3>
                </div>
                <p className="text-lg font-medium text-stone-800">{mostConsistent.goal.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage-400 rounded-full transition-all duration-500"
                      style={{ width: `${mostConsistent.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-sage-600">{mostConsistent.rate}%</span>
                </div>
                {(() => {
                  const cat = categories.find((c) => c.id === mostConsistent.goal.category_id);
                  return cat ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs mt-2"
                      style={{ color: cat.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  ) : null;
                })()}
              </div>
            )}

            {mostMissed && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={18} className="text-clay-400" />
                  <h3 className="font-semibold text-stone-700">Most Missed</h3>
                </div>
                <p className="text-lg font-medium text-stone-800">{mostMissed.goal.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-clay-300 rounded-full transition-all duration-500"
                      style={{ width: `${100 - mostMissed.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-clay-500">{100 - mostMissed.rate}% missed</span>
                </div>
                {(() => {
                  const cat = categories.find((c) => c.id === mostMissed.goal.category_id);
                  return cat ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs mt-2"
                      style={{ color: cat.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Per-goal stats */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-stone-700 mb-4">Goal Statistics</h2>
            <div className="space-y-3">
              {goals.map((goal) => {
                const stats = calculateGoalStats(goal, completions, today);
                const cat = categories.find((c) => c.id === goal.category_id);
                return (
                  <div key={goal.id} className="flex items-center gap-4 p-3 rounded-xl bg-cream-50/50 border border-stone-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-stone-700 truncate">{goal.name}</p>
                        {cat && (
                          <span
                            className="badge text-xs"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-clay-400" />
                          {stats.currentStreak}d streak
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy size={12} className="text-sand-400" />
                          {stats.longestStreak}d best
                        </span>
                        <span>{stats.completedCount} done</span>
                        <span>{stats.missedCount} missed</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-stone-800 font-display">{stats.completionRate}%</p>
                      <p className="text-xs text-stone-400">rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'clay' | 'sand' | 'sage' | 'sky';
}) {
  const colorClasses = {
    clay: 'bg-clay-50 text-clay-400',
    sand: 'bg-sand-50 text-sand-400',
    sage: 'bg-sage-50 text-sage-500',
    sky: 'bg-sky-50 text-sky-400',
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-800 font-display mt-0.5">
        {value}
        <span className="text-sm font-normal text-stone-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
