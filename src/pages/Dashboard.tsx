import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Flame, Sparkles, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import {
  getDayProgress,
  getCompletionMap,
  getScheduledGoalsForDate,
  calculateStreaks,
  getMostConsistentGoal,
  getMotivationMessage,
} from '@/lib/goals';
import { getGreeting, formatDate, todayStr } from '@/lib/date';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { GoalCard } from '@/components/GoalCard';
import { GoalForm, type GoalFormData } from '@/components/GoalForm';
import { Modal } from '@/components/ui/Modal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Goal, Frequency } from '@/types/database';

interface DashboardProps {
  onGoalClick?: (goal: Goal) => void;
}

export function Dashboard({ onGoalClick }: DashboardProps) {
  const { profile, settings } = useAuth();
  const { goals, categories, completions, loading, error, createGoal, updateGoal, deleteGoal, toggleCompletion, createCategory, refetch } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFreq, setFilterFreq] = useState<Frequency | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'incomplete'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date();
  const todayDateStr = todayStr();
  const completionMap = useMemo(() => getCompletionMap(completions), [completions]);

  const dayProgress = useMemo(
    () => getDayProgress(goals, today, completionMap),
    [goals, completionMap]
  );

  const streak = useMemo(
    () => calculateStreaks(goals, completions, settings?.completion_threshold ?? 70, today),
    [goals, completions, settings]
  );

  const mostConsistent = useMemo(
    () => getMostConsistentGoal(goals, completions, today),
    [goals, completions]
  );

  const motivation = useMemo(
    () => getMotivationMessage(dayProgress, streak.current, mostConsistent),
    [dayProgress, streak, mostConsistent]
  );

  const scheduledGoals = useMemo(
    () => getScheduledGoalsForDate(goals, today),
    [goals]
  );

  const filteredGoals = useMemo(() => {
    let result = scheduledGoals;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (filterCategory) {
      result = result.filter((g) => g.category_id === filterCategory);
    }

    if (filterFreq) {
      result = result.filter((g) => g.frequency === filterFreq);
    }

    if (filterStatus !== 'all') {
      const todaySet = completionMap.get(todayDateStr) || new Set<string>();
      if (filterStatus === 'completed') {
        result = result.filter((g) => todaySet.has(g.id));
      } else if (filterStatus === 'incomplete') {
        result = result.filter((g) => !todaySet.has(g.id));
      } else if (filterStatus === 'active') {
        result = result.filter((g) => g.is_active);
      }
    }

    return result;
  }, [scheduledGoals, search, filterCategory, filterFreq, filterStatus, completionMap, todayDateStr]);

  const hasGoals = goals.length > 0;
  const hasScheduledToday = scheduledGoals.length > 0;

  async function handleCreateGoal(data: GoalFormData) {
    const { error } = await createGoal(data);
    if (!error) setShowForm(false);
    return { error: error };
  }

  async function handleUpdateGoal(data: GoalFormData) {
    if (!editingGoal) return { error: 'No goal selected' };
    const { error } = await updateGoal(editingGoal.id, data);
    if (!error) {
      setEditingGoal(null);
      setShowForm(false);
    }
    return { error };
  }

  async function handleDeleteGoal(goalId: string) {
    await deleteGoal(goalId);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800 font-display">
          {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-stone-500 mt-1">{formatDate(today)}</p>
      </div>

      {/* Progress summary */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-white to-cream-50">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing
            percentage={dayProgress.percentage}
            size={140}
            sublabel={`${dayProgress.completed} / ${dayProgress.completed + (dayProgress.total - dayProgress.completed)} done`}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-stone-700 mb-1">Today's Progress</h2>
            <p className="text-3xl font-bold text-stone-800 font-display">
              {dayProgress.completed} / {dayProgress.total} completed
            </p>
            <p className="text-stone-500 mt-2 text-sm">{motivation}</p>

            <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Flame size={18} className="text-clay-400" />
                <span className="text-stone-600">
                  <span className="font-semibold">{streak.current}</span> day streak
                </span>
              </div>
              {streak.longest > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Sparkles size={16} className="text-sand-400" />
                  <span className="text-stone-600">
                    Best: <span className="font-semibold">{streak.longest}</span> days
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      {hasScheduledToday && (
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search goals..."
                aria-label="Search goals"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary px-3 ${showFilters ? 'bg-sage-50 border-sage-300 text-sage-700' : ''}`}
              aria-label="Toggle filters"
              aria-expanded={showFilters}
            >
              <Filter size={18} />
            </button>
            <button onClick={() => { setEditingGoal(null); setShowForm(true); }} className="btn-primary px-3 sm:px-4">
              <Plus size={18} />
              <span className="hidden sm:inline">New Goal</span>
            </button>
          </div>

          {showFilters && (
            <div className="card p-4 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="filter-cat" className="label">Category</label>
                <select
                  id="filter-cat"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-freq" className="label">Frequency</label>
                <select
                  id="filter-freq"
                  value={filterFreq}
                  onChange={(e) => setFilterFreq(e.target.value as Frequency | '')}
                  className="input"
                >
                  <option value="">All frequencies</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-status" className="label">Status</label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed' | 'incomplete')}
                  className="input"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed today</option>
                  <option value="incomplete">Incomplete today</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals list */}
      {!hasGoals ? (
        <EmptyState onCreate={() => { setEditingGoal(null); setShowForm(true); }} />
      ) : !hasScheduledToday ? (
        <NoGoalsToday onCreate={() => { setEditingGoal(null); setShowForm(true); }} />
      ) : filteredGoals.length === 0 ? (
        <div className="card p-8 text-center text-stone-500">
          <p>No goals match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              category={categories.find((c) => c.id === goal.category_id) ?? null}
              completions={completions}
              date={today}
              onToggleComplete={toggleCompletion}
              onEdit={(g) => { setEditingGoal(g); setShowForm(true); }}
              onDelete={handleDeleteGoal}
              onClick={onGoalClick}
            />
          ))}
        </div>
      )}

      {/* Goal form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingGoal(null); }}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
        size="lg"
      >
        <GoalForm
          onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
          onCancel={() => { setShowForm(false); setEditingGoal(null); }}
          categories={categories}
          initialGoal={editingGoal ?? undefined}
          onCreateCategory={createCategory}
        />
      </Modal>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sage-50 flex items-center justify-center mx-auto mb-4">
        <CalendarPlus size={32} className="text-sage-500" />
      </div>
      <h3 className="text-xl font-semibold text-stone-700 font-display mb-2">Start small.</h3>
      <p className="text-stone-500 mb-6 max-w-sm mx-auto">
        Create your first daily goal and begin building your progress.
      </p>
      <button onClick={onCreate} className="btn-primary mx-auto">
        <Plus size={18} />
        Create your first goal
      </button>
    </div>
  );
}

function NoGoalsToday({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sand-50 flex items-center justify-center mx-auto mb-4">
        <CalendarPlus size={32} className="text-sand-400" />
      </div>
      <h3 className="text-xl font-semibold text-stone-700 font-display mb-2">Nothing scheduled for today</h3>
      <p className="text-stone-500 mb-6 max-w-sm mx-auto">
        You have goals, but none are scheduled for today. Create a new daily goal to get started.
      </p>
      <button onClick={onCreate} className="btn-primary mx-auto">
        <Plus size={18} />
        New Goal
      </button>
    </div>
  );
}
