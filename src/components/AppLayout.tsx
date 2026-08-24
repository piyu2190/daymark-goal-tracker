import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type Page = 'dashboard' | 'calendar' | 'progress' | 'settings';

interface AppLayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center">
          <CheckCircle2 className="text-white" size={22} />
        </div>
        <span className="text-xl font-bold text-stone-800 font-display">DayMark</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} className={active ? 'text-sage-600' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-stone-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 font-semibold text-sm">
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-700 truncate">{profile?.name ?? 'User'}</p>
            <p className="text-xs text-stone-400 truncate">{profile?.occupation || 'No occupation set'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-stone-200/60 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white shadow-xl animate-slide-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:bg-stone-100"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-white" size={18} />
            </div>
            <span className="font-bold text-stone-800 font-display">DayMark</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
