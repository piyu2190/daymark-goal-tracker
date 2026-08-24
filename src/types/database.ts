export type Frequency = 'daily' | 'weekdays' | 'weekly' | 'custom' | 'one_time';

export type Theme = 'light' | 'dark';

export interface Profile {
  id: string;
  name: string;
  occupation: string | null;
  year_of_study: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  goal_id: string;
  date: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: Theme;
  completion_threshold: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalWithCategory extends Goal {
  category?: Category | null;
}

export interface DayProgress {
  date: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface GoalStats {
  goalId: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  completedCount: number;
  missedCount: number;
  totalScheduled: number;
}
