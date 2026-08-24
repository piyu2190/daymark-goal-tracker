/*
# DayMark — Core Schema

## Overview
Creates the complete data model for DayMark, a personal daily progress and goal-tracking platform.
Each user's data is fully isolated via Row Level Security (RLS) policies scoped to auth.uid().

## New Tables
1. `profiles` — Extended user information (name, occupation, year of study). One row per auth user.
   - `id` (uuid, PK, FK to auth.users)
   - `name` (text, not null) — display name used throughout the app
   - `occupation` (text, nullable) — course or occupation
   - `year_of_study` (text, nullable) — year of study (optional)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

2. `categories` — Goal categories. Each user has default categories seeded on signup and can create custom ones.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, default auth.uid())
   - `name` (text, not null)
   - `color` (text, not null) — hex color for visual identification
   - `is_default` (boolean, default false) — marks seeded categories
   - `created_at` (timestamptz)

3. `goals` — User goals (recurring or one-time).
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, default auth.uid())
   - `name` (text, not null)
   - `description` (text, nullable)
   - `category_id` (uuid, FK to categories, nullable)
   - `frequency` (text, not null) — 'daily', 'weekdays', 'weekly', 'custom', 'one_time'
   - `custom_days` (integer[], nullable) — days of week (0=Sun..6=Sat) for 'custom' frequency
   - `target_value` (text, nullable) — e.g. "30 minutes", "2L", "10 pages"
   - `reminder_time` (time, nullable) — optional reminder time
   - `start_date` (date, not null) — when the goal becomes active
   - `end_date` (date, nullable) — optional end date (null = ongoing)
   - `is_active` (boolean, default true)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

4. `completions` — Records when a user completes a goal on a specific date. One per goal per date.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, default auth.uid())
   - `goal_id` (uuid, FK to goals, ON DELETE CASCADE)
   - `date` (date, not null) — the date the goal was completed
   - `created_at` (timestamptz)
   - Unique constraint on (goal_id, date) — prevents duplicate completions for the same date

5. `user_settings` — Per-user application settings.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, default auth.uid(), unique)
   - `theme` (text, default 'light') — 'light' or 'dark'
   - `completion_threshold` (integer, default 70) — percentage threshold for streak counting
   - `notifications_enabled` (boolean, default false)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

## Security
- RLS enabled on ALL tables.
- All policies scoped TO authenticated with auth.uid() ownership checks.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- user_id columns default to auth.uid() so inserts that omit user_id still pass WITH CHECK.

## Indexes
- completions(user_id, date) — for fast daily progress queries
- completions(goal_id, date) — for fast goal history queries
- goals(user_id) — for fast user goal listing
- categories(user_id) — for fast category listing
- profiles(id) — primary key lookup

## Important Notes
1. All user_id columns have DEFAULT auth.uid() so frontend inserts omitting user_id work correctly.
2. completions has a unique constraint on (goal_id, date) to prevent double-marking.
3. goals.end_date is nullable — null means the goal is ongoing indefinitely.
4. custom_days is an integer array used only when frequency = 'custom'.
5. The profiles table uses auth.users.id as its primary key (1:1 relationship).
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  occupation text,
  year_of_study text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8BAE92',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekly', 'custom', 'one_time')),
  custom_days integer[],
  target_value text,
  reminder_time time,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id, is_active);

-- Completions table
CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, date)
);
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_completions" ON completions;
CREATE POLICY "select_own_completions" ON completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_completions" ON completions;
CREATE POLICY "insert_own_completions" ON completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_completions" ON completions;
CREATE POLICY "update_own_completions" ON completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_completions" ON completions;
CREATE POLICY "delete_own_completions" ON completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_completions_goal_date ON completions(goal_id, date);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  completion_threshold integer NOT NULL DEFAULT 70 CHECK (completion_threshold >= 0 AND completion_threshold <= 100),
  notifications_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
