import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { ProfileSetup } from '@/pages/ProfileSetup';
import { AppLayout, type Page } from '@/components/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { CalendarPage } from '@/pages/CalendarPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { GoalDetail } from '@/pages/GoalDetail';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import type { Goal } from '@/types/database';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  if (loading) {
    return <FullPageLoader message="Loading DayMark..." />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user && !profile) {
    return <ProfileSetup />;
  }

  if (selectedGoalId) {
    return (
      <AppLayout currentPage={page} onNavigate={setPage}>
        <GoalDetail goalId={selectedGoalId} onBack={() => setSelectedGoalId(null)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && (
        <Dashboard onGoalClick={(goal: Goal) => setSelectedGoalId(goal.id)} />
      )}
      {page === 'calendar' && <CalendarPage />}
      {page === 'progress' && <ProgressPage />}
      {page === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
