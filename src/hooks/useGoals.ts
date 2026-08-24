import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Goal, Completion, Category } from '@/types/database';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [goalsRes, catsRes, completionsRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('completions').select('*').eq('user_id', user.id),
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (catsRes.error) throw catsRes.error;
      if (completionsRes.error) throw completionsRes.error;

      setGoals((goalsRes.data as Goal[]) || []);
      setCategories((catsRes.data as Category[]) || []);
      setCompletions((completionsRes.data as Completion[]) || []);
    } catch {
      setError('Could not load your data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createGoal = useCallback(async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user.id })
      .select()
      .single();
    if (error) return { error: 'Could not create goal.' };
    setGoals((prev) => [...prev, data as Goal]);
    return { error: null };
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { error: 'Could not update goal.' };
    setGoals((prev) => prev.map((g) => (g.id === id ? (data as Goal) : g)));
    return { error: null };
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) return { error: 'Could not delete goal.' };
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setCompletions((prev) => prev.filter((c) => c.goal_id !== id));
    return { error: null };
  }, [user]);

  const toggleCompletion = useCallback(async (goalId: string, date: string) => {
    if (!user) return { error: 'Not authenticated' };
    const existing = completions.find((c) => c.goal_id === goalId && c.date === date);
    if (existing) {
      const { error } = await supabase.from('completions').delete().eq('id', existing.id);
      if (error) return { error: 'Could not update completion.' };
      setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data, error } = await supabase
        .from('completions')
        .insert({ goal_id: goalId, date, user_id: user.id })
        .select()
        .single();
      if (error) return { error: 'Could not mark goal as complete.' };
      setCompletions((prev) => [...prev, data as Completion]);
    }
    return { error: null };
  }, [user, completions]);

  const createCategory = useCallback(async (name: string, color: string) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, user_id: user.id, is_default: false })
      .select()
      .single();
    if (error) return { error: 'Could not create category.' };
    setCategories((prev) => [...prev, data as Category]);
    return { error: null, data: data as Category };
  }, [user]);

  return {
    goals,
    categories,
    completions,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleCompletion,
    createCategory,
    refetch: fetchAll,
  };
}
