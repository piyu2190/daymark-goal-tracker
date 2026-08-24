import type { Goal, Completion, DayProgress, StreakInfo, GoalStats } from '@/types/database';
import { toDateStr, parseDateStr, eachDayInRange, isFuture, addDays } from './date';

export function isGoalScheduledOnDate(goal: Goal, date: Date): boolean {
  const dateStr = toDateStr(date);
  const startDate = parseDateStr(goal.start_date);
  startDate.setHours(0, 0, 0, 0);
  if (date < startDate) return false;

  if (goal.end_date) {
    const endDate = parseDateStr(goal.end_date);
    endDate.setHours(0, 0, 0, 0);
    if (date > endDate) return false;
  }

  if (!goal.is_active) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return false;
  }

  const dayOfWeek = date.getDay();

  switch (goal.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return dayOfWeek === 0;
    case 'custom':
      if (!goal.custom_days || goal.custom_days.length === 0) return false;
      return goal.custom_days.includes(dayOfWeek);
    case 'one_time':
      return toDateStr(date) === goal.start_date;
    default:
      return false;
  }
}

export function getScheduledGoalsForDate(goals: Goal[], date: Date): Goal[] {
  return goals.filter((g) => isGoalScheduledOnDate(g, date));
}

export function getCompletionMap(completions: Completion[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!map.has(c.date)) map.set(c.date, new Set());
    map.get(c.date)!.add(c.goal_id);
  }
  return map;
}

export function isGoalCompletedOnDate(
  goalId: string,
  date: Date,
  completionMap: Map<string, Set<string>>
): boolean {
  const dateStr = toDateStr(date);
  const set = completionMap.get(dateStr);
  return set ? set.has(goalId) : false;
}

export function getDayProgress(
  goals: Goal[],
  date: Date,
  completionMap: Map<string, Set<string>>
): DayProgress {
  const scheduled = getScheduledGoalsForDate(goals, date);
  const total = scheduled.length;
  const dateStr = toDateStr(date);
  const completedSet = completionMap.get(dateStr) || new Set<string>();
  const completed = scheduled.filter((g) => completedSet.has(g.id)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { date: dateStr, total, completed, percentage };
}

export function calculateStreaks(
  goals: Goal[],
  completions: Completion[],
  threshold: number,
  upToDate: Date
): StreakInfo {
  const completionMap = getCompletionMap(completions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(upToDate);
  endDate.setHours(0, 0, 0, 0);

  const earliestGoal = goals
    .map((g) => parseDateStr(g.start_date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!earliestGoal) return { current: 0, longest: 0 };

  let earliest = new Date(earliestGoal);
  earliest.setHours(0, 0, 0, 0);
  if (earliest > endDate) return { current: 0, longest: 0 };

  const days = eachDayInRange(earliest, endDate);
  const qualifyingDays = days.filter((d) => {
    const progress = getDayProgress(goals, d, completionMap);
    return progress.total > 0 && progress.percentage >= threshold;
  });

  const qualifyingSet = new Set(qualifyingDays.map(toDateStr));

  let longest = 0;
  let currentRun = 0;
  for (const d of days) {
    if (qualifyingSet.has(toDateStr(d))) {
      currentRun++;
      if (currentRun > longest) longest = currentRun;
    } else {
      currentRun = 0;
    }
  }

  let current = 0;
  let checkDate = new Date(endDate);
  if (endDate.getTime() === today.getTime()) {
    const todayProgress = getDayProgress(goals, today, completionMap);
    if (todayProgress.total > 0 && todayProgress.percentage >= threshold) {
      current = 1;
      checkDate = addDays(checkDate, -1);
    } else if (todayProgress.total > 0 && todayProgress.percentage < threshold) {
      checkDate = addDays(checkDate, -1);
    }
  }

  while (true) {
    const dateStr = toDateStr(checkDate);
    if (qualifyingSet.has(dateStr)) {
      current++;
      checkDate = addDays(checkDate, -1);
    } else {
      const progress = getDayProgress(goals, checkDate, completionMap);
      if (progress.total === 0) {
        checkDate = addDays(checkDate, -1);
        if (checkDate < earliest) break;
        continue;
      }
      break;
    }
    if (checkDate < earliest) break;
  }

  return { current, longest };
}

export function calculateGoalStats(
  goal: Goal,
  completions: Completion[],
  upToDate: Date
): GoalStats {
  const completionSet = new Set(
    completions
      .filter((c) => c.goal_id === goal.id)
      .map((c) => c.date)
  );

  const startDate = parseDateStr(goal.start_date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(upToDate);
  endDate.setHours(0, 0, 0, 0);

  const days = eachDayInRange(startDate, endDate);
  const scheduledDays = days.filter((d) => isGoalScheduledOnDate(goal, d));
  const totalScheduled = scheduledDays.length;
  const completedCount = scheduledDays.filter((d) =>
    completionSet.has(toDateStr(d))
  ).length;
  const missedCount = totalScheduled - completedCount;
  const completionRate = totalScheduled > 0
    ? Math.round((completedCount / totalScheduled) * 100)
    : 0;

  let longestStreak = 0;
  let currentRun = 0;
  let currentStreak = 0;

  for (const d of scheduledDays) {
    if (completionSet.has(toDateStr(d))) {
      currentRun++;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else {
      currentRun = 0;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = new Date(endDate);

  if (endDate.getTime() === today.getTime()) {
    if (isGoalScheduledOnDate(goal, today) && completionSet.has(toDateStr(today))) {
      currentStreak = 1;
      checkDate = addDays(checkDate, -1);
    } else if (isGoalScheduledOnDate(goal, today) && !completionSet.has(toDateStr(today))) {
      checkDate = addDays(checkDate, -1);
    }
  }

  while (checkDate >= startDate) {
    if (isGoalScheduledOnDate(goal, checkDate)) {
      if (completionSet.has(toDateStr(checkDate))) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    } else {
      checkDate = addDays(checkDate, -1);
    }
  }

  return {
    goalId: goal.id,
    currentStreak,
    longestStreak,
    completionRate,
    completedCount,
    missedCount,
    totalScheduled,
  };
}

export function getMostConsistentGoal(
  goals: Goal[],
  completions: Completion[],
  upToDate: Date
): { goal: Goal; rate: number } | null {
  let best: { goal: Goal; rate: number } | null = null;
  for (const goal of goals) {
    const stats = calculateGoalStats(goal, completions, upToDate);
    if (stats.totalScheduled < 2) continue;
    if (!best || stats.completionRate > best.rate) {
      best = { goal, rate: stats.completionRate };
    }
  }
  return best;
}

export function getMostMissedGoal(
  goals: Goal[],
  completions: Completion[],
  upToDate: Date
): { goal: Goal; rate: number } | null {
  let worst: { goal: Goal; rate: number } | null = null;
  for (const goal of goals) {
    const stats = calculateGoalStats(goal, completions, upToDate);
    if (stats.totalScheduled < 2) continue;
    if (!worst || stats.completionRate < worst.rate) {
      worst = { goal, rate: stats.completionRate };
    }
  }
  return worst;
}

export function getMotivationMessage(
  dayProgress: DayProgress,
  streak: number,
  mostConsistent: { goal: Goal; rate: number } | null
): string {
  if (dayProgress.total === 0) return 'Start small — create your first goal to begin building your progress.';
  if (dayProgress.percentage === 100) return 'Perfect day! Every goal completed. Enjoy the momentum.';
  if (dayProgress.percentage >= 80) return `Great work — you've completed ${dayProgress.percentage}% of today's goals.`;
  if (dayProgress.percentage >= 50) return `Good progress — ${dayProgress.completed} of ${dayProgress.total} goals done. Keep going!`;
  if (dayProgress.percentage > 0) return `You've started — ${dayProgress.completed} goal${dayProgress.completed > 1 ? 's' : ''} done. One step at a time.`;
  if (streak >= 7) return `You're on a ${streak}-day streak. Don't break the chain!`;
  if (mostConsistent && mostConsistent.rate >= 80) {
    return `You're most consistent with your ${mostConsistent.goal.name.toLowerCase()} goals.`;
  }
  return 'A new day. Pick one goal and start your streak.';
}
