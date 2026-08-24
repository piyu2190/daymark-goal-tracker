import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  Clock,
  Bell,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import {
  calculateGoalStats,
  isGoalScheduledOnDate,
  getCompletionMap,
} from '@/lib/goals';
import {
  toDateStr,
  parseDateStr,
  formatTime,
  MONTHS,
  DAYS_OF_WEEK,
  getDaysInMonth,
  getFirstDayOfMonth,
  eachDayInRange,
} from '@/lib/date';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GoalForm, type GoalFormData } from '@/components/GoalForm';
import { Modal } from '@/components/ui/Modal';
import type { Goal } from '@/types/database';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Mon – Fri',
  weekly: 'Every Sunday',
  custom: 'Custom days',
  one_time: 'One-time',
};

interface GoalDetailProps {
  goalId: string;
  onBack: () => void;
}

export function GoalDetail({ goalId, onBack }: GoalDetailProps) {
  const { settings } = useAuth();
  const { goals, categories, completions, loading, error, updateGoal, deleteGoal, refetch } = useGoals();
  const [viewDate, setViewDate] = useState(new Date());
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);

  const stats = useMemo(() => {
    if (!goal) return null;
    return calculateGoalStats(goal, completions, new Date());
  }, [goal, completions]);

  const category = useMemo(
    () => categories.find((c) => c.id === goal?.category_id) ?? null,
    [categories, goal]
  );

  const completionSet = useMemo(() => {
    return new Set(
      completions
        .filter((c) => c.goal_id === goalId)
        .map((c) => c.date)
    );
  }, [completions, goalId]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

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

  if (!goal || !stats) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={onBack} className="btn-ghost mb-4">
          <ArrowLeft size={18} />
          Back
        </button>
        <ErrorMessage message="This goal could not be found." onRetry={onBack} />
      </div>
    );
  }

  async function handleUpdate(data: GoalFormData) {
    if (!goal) return { error: 'No goal selected' };
    const { error } = await updateGoal(goal.id, data);
    if (!error) setShowEdit(false);
    return { error };
  }

  async function handleDelete() {
    await deleteGoal(goalId);
    onBack();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <button onClick={onBack} className="btn-ghost mb-4">
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      {/* Goal header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-stone-800 font-display">{goal.name}</h1>
              {category && (
                <span
                  className="badge"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-stone-500 mb-3">{goal.description}</p>
            )}
            <div className="flex items-center gap-4 flex-wrap text-sm text-stone-400">
              <span className="flex items-center gap-1">
                <Target size={14} />
                {FREQ_LABELS[goal.frequency] || goal.frequency}
              </span>
              {goal.target_value && (
                <span className="flex items-center gap-1">
                  <Target size={14} />
                  {goal.target_value}
                </span>
              )}
              {goal.reminder_time && (
                <span className="flex items-center gap-1">
                  <Bell size={14} />
                  {formatTime(goal.reminder_time)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Started {parseDateStr(goal.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="btn-ghost p-2"
              aria-label="Edit goal"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete goal"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card p-4 flex flex-col items-center text-center">
          <ProgressRing percentage={stats.completionRate} size={72} strokeWidth={7} />
          <p className="text-xs text-stone-400 mt-2">Completion Rate</p>
        </div>
        <StatBox icon={<Flame size={20} />} label="Current Streak" value={`${stats.currentStreak}`} unit="days" color="clay" />
        <StatBox icon={<Trophy size={20} />} label="Longest Streak" value={`${stats.longestStreak}`} unit="days" color="sand" />
        <StatBox icon={<Target size={20} />} label="Completed" value={`${stats.completedCount}`} unit="times" color="sage" />
      </div>

      {/* Completed vs Missed */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-700 mb-4">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-50/50 border border-sage-100">
            <CheckCircle2 size={24} className="text-sage-500" />
            <div>
              <p className="text-2xl font-bold text-stone-800 font-display">{stats.completedCount}</p>
              <p className="text-sm text-stone-500">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-clay-50/50 border border-clay-100">
            <XCircle size={24} className="text-clay-400" />
            <div>
              <p className="text-2xl font-bold text-stone-800 font-display">{stats.missedCount}</p>
              <p className="text-sm text-stone-500">Missed</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-stone-500 mb-1">
            <span>Completion rate</span>
            <span className="font-semibold text-stone-700">{stats.completionRate}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* History calendar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-700">History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="btn-ghost p-1.5"
              aria-label="Previous month"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-sm font-medium text-stone-600 min-w-[100px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="btn-ghost p-1.5"
              aria-label="Next month"
            >
              <ArrowLeft size={16} className="rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-400 py-1">
              {day}
            </div>
          ))}
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;
            const dateStr = toDateStr(date);
            const scheduled = isGoalScheduledOnDate(goal, date);
            const completed = completionSet.has(dateStr);
            return (
              <div
                key={dateStr}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xs
                  ${!scheduled ? 'text-stone-300' : ''}
                  ${scheduled && completed ? 'bg-sage-400 text-white font-medium' : ''}
                  ${scheduled && !completed ? 'bg-clay-100 text-clay-400' : ''}
                `}
                title={scheduled ? `${completed ? 'Completed' : 'Missed'} — ${dateStr}` : 'Not scheduled'}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sage-400" />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-clay-100" />
            Missed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-stone-50 border border-stone-200" />
            Not scheduled
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Goal" size="lg">
        <GoalForm
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          categories={categories}
          initialGoal={goal}
          onCreateCategory={undefined}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete goal?"
        message={`This will permanently delete "${goal.name}" and all its completion history. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function StatBox({
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-stone-800 font-display mt-0.5">
        {value}
        <span className="text-sm font-normal text-stone-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
