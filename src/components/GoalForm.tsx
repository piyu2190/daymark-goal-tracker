import { useState, type FormEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { Goal, Frequency, Category } from '@/types/database';
import { DAYS_OF_WEEK } from '@/lib/date';
import { InlineError } from '@/components/ui/ErrorMessage';

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
  categories: Category[];
  initialGoal?: Goal;
  onCreateCategory?: (name: string, color: string) => Promise<{ error: string | null; data?: Category }>;
}

export interface GoalFormData {
  name: string;
  description: string | null;
  category_id: string | null;
  frequency: Frequency;
  custom_days: number[] | null;
  target_value: string | null;
  reminder_time: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

const FREQUENCIES: { value: Frequency; label: string; desc: string }[] = [
  { value: 'daily', label: 'Daily', desc: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', desc: 'Mon – Fri' },
  { value: 'weekly', label: 'Weekly', desc: 'Every Sunday' },
  { value: 'custom', label: 'Custom', desc: 'Pick specific days' },
  { value: 'one_time', label: 'One-time', desc: 'Just once' },
];

const CATEGORY_COLORS = [
  '#6BBF8A', '#7BA7D9', '#E8A87C', '#C5A3D4', '#F2CC8F',
  '#81B29A', '#A8C5D8', '#9CBF9C', '#F4A4A4', '#B8C5D6',
];

export function GoalForm({ onSubmit, onCancel, categories, initialGoal, onCreateCategory }: GoalFormProps) {
  const [name, setName] = useState(initialGoal?.name ?? '');
  const [description, setDescription] = useState(initialGoal?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialGoal?.category_id ?? '');
  const [frequency, setFrequency] = useState<Frequency>(initialGoal?.frequency ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(initialGoal?.custom_days ?? []);
  const [targetValue, setTargetValue] = useState(initialGoal?.target_value ?? '');
  const [reminderTime, setReminderTime] = useState(initialGoal?.reminder_time ?? '');
  const [startDate, setStartDate] = useState(initialGoal?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initialGoal?.end_date ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New category state
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);

  async function handleCreateCategory() {
    if (!newCatName.trim() || !onCreateCategory) return;
    const { error, data } = await onCreateCategory(newCatName.trim(), newCatColor);
    if (error) {
      setError(error);
      return;
    }
    if (data) {
      setCategoryId(data.id);
      setShowCatInput(false);
      setNewCatName('');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a goal name.');
      return;
    }
    if (frequency === 'custom' && customDays.length === 0) {
      setError('Please select at least one day for custom frequency.');
      return;
    }

    setLoading(true);
    const { error } = await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      frequency,
      custom_days: frequency === 'custom' ? customDays : null,
      target_value: targetValue.trim() || null,
      reminder_time: reminderTime || null,
      start_date: startDate,
      end_date: endDate || null,
      is_active: true,
    });
    setLoading(false);

    if (error) setError(error);
  }

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="goal-name" className="label">Goal Name <span className="text-red-500">*</span></label>
        <input
          id="goal-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g. Study DSA for 1 hour"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="goal-desc" className="label">Description <span className="text-stone-400 font-normal">(optional)</span></label>
        <textarea
          id="goal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input resize-none"
          rows={2}
          placeholder="Add details about this goal"
        />
      </div>

      <div>
        <label htmlFor="goal-category" className="label">Category</label>
        {!showCatInput ? (
          <div className="flex gap-2">
            <select
              id="goal-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input flex-1"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {onCreateCategory && (
              <button
                type="button"
                onClick={() => setShowCatInput(true)}
                className="btn-secondary px-3"
                aria-label="Create new category"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="input"
              placeholder="Category name"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">Color:</span>
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    newCatColor === color ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreateCategory} className="btn-primary text-sm">Add category</button>
              <button type="button" onClick={() => setShowCatInput(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div>
        <span className="label">Frequency</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setFrequency(freq.value)}
              className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                frequency === freq.value
                  ? 'border-sage-400 bg-sage-50 text-sage-700'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              }`}
            >
              <div className="text-sm font-medium">{freq.label}</div>
              <div className="text-xs text-stone-400">{freq.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {frequency === 'custom' && (
        <div className="animate-fade-in">
          <span className="label">Repeat on</span>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-12 h-10 rounded-lg text-xs font-medium transition-all ${
                  customDays.includes(i)
                    ? 'bg-sage-500 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-target" className="label">Target / Duration <span className="text-stone-400 font-normal">(optional)</span></label>
          <input
            id="goal-target"
            type="text"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="input"
            placeholder="e.g. 30 minutes, 2L, 10 pages"
          />
        </div>
        <div>
          <label htmlFor="goal-reminder" className="label">Reminder Time <span className="text-stone-400 font-normal">(optional)</span></label>
          <input
            id="goal-reminder"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-start" className="label">Start Date</label>
          <input
            id="goal-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="goal-end" className="label">End Date <span className="text-stone-400 font-normal">(optional)</span></label>
          <input
            id="goal-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            min={startDate}
          />
        </div>
      </div>

      {error && <InlineError message={error} />}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {initialGoal ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            initialGoal ? 'Save Changes' : 'Create Goal'
          )}
        </button>
      </div>
    </form>
  );
}
