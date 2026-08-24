import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserSettings } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) setProfile(data as Profile);
    else setProfile(null);
  }, []);

  const fetchSettings = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data) setSettings(data as UserSettings);
    else setSettings(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshSettings = useCallback(async () => {
    if (user) await fetchSettings(user.id);
  }, [user, fetchSettings]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([fetchProfile(session.user.id), fetchSettings(session.user.id)]).finally(() =>
          setLoading(false)
        );
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await Promise.all([fetchProfile(session.user.id), fetchSettings(session.user.id)]);
        } else {
          setProfile(null);
          setSettings(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchSettings]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: getAuthErrorMessage(error) };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
      });
      if (profileError) return { error: 'Could not create your profile. Please try again.' };

      await supabase.from('user_settings').insert({
        user_id: data.user.id,
      });

      await seedDefaultCategories(data.user.id);
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: getAuthErrorMessage(error) };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSettings(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) return { error: 'Could not update your profile.' };
    await fetchProfile(user.id);
    return { error: null };
  }, [user, fetchProfile]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase.from('user_settings').update(updates).eq('user_id', user.id);
    if (error) return { error: 'Could not update settings.' };
    await fetchSettings(user.id);
    return { error: null };
  }, [user, fetchSettings]);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    settings,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    refreshSettings,
    updateProfile,
    updateSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function getAuthErrorMessage(error: { message: string }): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please check your email and confirm your account.';
  }
  if (msg.includes('password')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

const DEFAULT_CATEGORIES = [
  { name: 'Health', color: '#6BBF8A' },
  { name: 'Study', color: '#7BA7D9' },
  { name: 'Fitness', color: '#E8A87C' },
  { name: 'Reading', color: '#C5A3D4' },
  { name: 'Personal', color: '#F2CC8F' },
  { name: 'Work', color: '#81B29A' },
  { name: 'Skills', color: '#A8C5D8' },
  { name: 'Finance', color: '#9CBF9C' },
  { name: 'Other', color: '#B0B0B0' },
];

async function seedDefaultCategories(userId: string) {
  const rows = DEFAULT_CATEGORIES.map((c) => ({
    user_id: userId,
    name: c.name,
    color: c.color,
    is_default: true,
  }));
  await supabase.from('categories').insert(rows);
}
