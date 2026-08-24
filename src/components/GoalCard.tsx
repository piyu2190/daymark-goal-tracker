import { useState } from 'react';
import { Pencil, Trash2, Target, Bell } from 'lucide-react';
import type { Goal, Category, Completion } from '@/types/database';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isGoalCompletedOnDate, getCompletionMap } from '@/lib/goals';
import { toDateStr, formatTime, parseDateStr } from '@/lib/date';

interface GoalCardProps {
  goal: Goal;
  category: Category | null;
  completions: Completion[];
  date: Date;
  onToggleComplete: (goalId: string, date: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onClick?: (goal: Goal) => void;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
  custom: 'Custom',
  one_time: 'One-time',
};

export function GoalCard({
  goal,
  category,
  completions,
  date,
  onToggleComplete,
  onEdit,
  onDelete,
  onClick,
}: GoalCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const completionMap = getCompletionMap(completions);
  const completed = isGoalCompletedOnDate(goal.id, date, completionMap);
  const dateStr = toDateStr(date);
  const isPast = parseDateStr(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <>
      <div
        className={`card card-hover p-4 group transition-all ${completed ? 'bg-sage-50/50 border-sage-200/60' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <Checkbox
              checked={completed}
              onChange={() => onToggleComplete(goal.id, dateStr)}
              ariaLabel={`Mark "${goal.name}" as ${completed ? 'incomplete' : 'complete'}`}
            />
          </div>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onClick?.(goal)}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(goal) : undefined}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium text-stone-800 ${completed ? 'line-through text-stone-400' : ''}`}>
                {goal.name}
              </h3>
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
              <p className="text-sm text-stone-500 mt-1 line-clamp-2">{goal.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                {FREQ_LABELS[goal.frequency] || goal.frequency}
              </span>
              {goal.target_value && (
                <span className="flex items-center gap-1">
                  <Target size={12} />
                  {goal.target_value}
                </span>
              )}
              {goal.reminder_time && (
                <span className="flex items-center gap-1">
                  <Bell size={12} />
                  {formatTime(goal.reminder_time)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
              className="p-2 rounded-lg text-stone-400 hover:text-sage-600 hover:bg-sage-50 transition-colors"
              aria-label={`Edit ${goal.name}`}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
              className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`Delete ${goal.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete goal?"
        message={`This will permanently delete "${goal.name}" and all its completion history. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => onDelete(goal.id)}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
