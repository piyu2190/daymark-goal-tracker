import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X, Check, Minus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import {
  getDayProgress,
  getCompletionMap,
  getScheduledGoalsForDate,
  isGoalCompletedOnDate,
} from '@/lib/goals';
import {
  MONTHS,
  DAYS_OF_WEEK,
  toDateStr,
  parseDateStr,
  getDaysInMonth,
  getFirstDayOfMonth,
  isToday,
  formatDate,
} from '@/lib/date';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Checkbox } from '@/components/ui/Checkbox';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import type { Goal } from '@/types/database';

export function CalendarPage() {
  const { settings } = useAuth();
  const { goals, categories, completions, loading, error, toggleCompletion, refetch } = useGoals();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const completionMap = useMemo(() => getCompletionMap(completions), [completions]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); }
  function prevYear() { setViewDate(new Date(year - 1, month, 1)); }
  function nextYear() { setViewDate(new Date(year + 1, month, 1)); }
  function goToday() { setViewDate(new Date()); }

  function getCellColor(date: Date): string {
    const progress = getDayProgress(goals, date, completionMap);
    if (progress.total === 0) return '';
    if (progress.percentage >= 100) return 'bg-sage-400 text-white';
    if (progress.percentage >= 50) return 'bg-sand-300 text-stone-700';
    if (progress.percentage > 0) return 'bg-clay-200 text-stone-700';
    return 'bg-stone-100 text-stone-400';
  }

  function getCellDot(date: Date): string {
    const progress = getDayProgress(goals, date, completionMap);
    if (progress.total === 0) return 'bg-stone-200';
    if (progress.percentage >= 100) return 'bg-sage-500';
    if (progress.percentage >= 50) return 'bg-sand-400';
    if (progress.percentage > 0) return 'bg-clay-300';
    return 'bg-stone-300';
  }

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800 font-display mb-1">Calendar</h1>
        <p className="text-stone-500">Track your progress across days, months, and years.</p>
      </div>

      {/* Calendar card */}
      <div className="card p-4 sm:p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={prevYear} className="btn-ghost p-2" aria-label="Previous year">
              <ChevronLeft size={16} className="opacity-50" />
              <ChevronLeft size={16} className="-ml-3 opacity-50" />
            </button>
            <button onClick={prevMonth} className="btn-ghost p-2" aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-stone-800 font-display min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="btn-ghost p-2" aria-label="Next month">
              <ChevronRight size={20} />
            </button>
            <button onClick={nextYear} className="btn-ghost p-2" aria-label="Next year">
              <ChevronRight size={16} className="opacity-50" />
              <ChevronRight size={16} className="-ml-3 opacity-50" />
            </button>
          </div>
          <button onClick={goToday} className="btn-secondary text-sm">
            <CalendarDays size={16} />
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-stone-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sage-500" />
            100% completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sand-400" />
            50–99%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-clay-300" />
            Below 50%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-200" />
            No activity
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-400 py-2">
              {day}
            </div>
          ))}

          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;

            const progress = getDayProgress(goals, date, completionMap);
            const hasActivity = progress.total > 0;
            const today = isToday(date);
            const selected = selectedDate && toDateStr(selectedDate) === toDateStr(date);

            return (
              <button
                key={toDateStr(date)}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center
                  transition-all duration-200 relative
                  ${hasActivity ? getCellColor(date) : 'bg-stone-50 hover:bg-stone-100 text-stone-400'}
                  ${today ? 'ring-2 ring-sage-400 ring-offset-1' : ''}
                  ${selected ? 'ring-2 ring-sage-500' : ''}
                `}
                aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]}, ${hasActivity ? `${progress.completed} of ${progress.total} completed` : 'no activity'}`}
              >
                <span className="text-sm font-medium">{date.getDate()}</span>
                {hasActivity && (
                  <span className="text-[10px] mt-0.5 hidden sm:block">
                    {progress.percentage}%
                  </span>
                )}
                {!hasActivity && (
                  <span className={`w-1.5 h-1.5 rounded-full ${getCellDot(date)} mt-1`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? formatDate(selectedDate) : ''}
        size="md"
      >
        {selectedDate && (
          <DayDetail
            date={selectedDate}
            goals={goals}
            categories={categories}
            completions={completions}
            onToggle={toggleCompletion}
          />
        )}
      </Modal>
    </div>
  );
}

function DayDetail({
  date,
  goals,
  categories,
  completions,
  onToggle,
}: {
  date: Date;
  goals: Goal[];
  categories: ReturnType<typeof useGoals>['categories'];
  completions: ReturnType<typeof useGoals>['completions'];
  onToggle: (goalId: string, dateStr: string) => Promise<{ error: string | null }>;
}) {
  const scheduled = getScheduledGoalsForDate(goals, date);
  const dateStr = toDateStr(date);
  const completionMap = getCompletionMap(completions);
  const completedSet = completionMap.get(dateStr) || new Set<string>();
  const completed = scheduled.filter((g) => completedSet.has(g.id)).length;
  const total = scheduled.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <ProgressRing percentage={percentage} size={80} strokeWidth={8} />
        <div>
          <p className="text-2xl font-bold text-stone-800 font-display">
            {completed} / {total} completed
          </p>
          <p className="text-sm text-stone-500">
            {total === 0 ? 'No goals scheduled' : percentage >= 100 ? 'Perfect day!' : `${percentage}% done`}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <p>No goals were scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scheduled.map((goal) => {
            const isCompleted = completedSet.has(goal.id);
            const cat = categories.find((c) => c.id === goal.category_id);
            return (
              <div
                key={goal.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-sage-50/50 border-sage-200/60'
                    : 'bg-white border-stone-200/60'
                }`}
              >
                <Checkbox
                  checked={isCompleted}
                  onChange={() => onToggle(goal.id, dateStr)}
                  ariaLabel={`Mark ${goal.name} as ${isCompleted ? 'incomplete' : 'complete'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-stone-700 ${isCompleted ? 'line-through text-stone-400' : ''}`}>
                    {goal.name}
                  </p>
                  {cat && (
                    <span
                      className="inline-flex items-center gap-1 text-xs mt-0.5"
                      style={{ color: cat.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  )}
                </div>
                {isCompleted ? (
                  <Check size={18} className="text-sage-500" />
                ) : (
                  <Minus size={18} className="text-stone-300" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
