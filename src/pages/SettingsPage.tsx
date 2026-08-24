import { useState, type FormEvent } from 'react';
import { Loader2, User, Palette, Bell, Sliders, LogOut, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InlineError } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Theme } from '@/types/database';

export function SettingsPage() {
  const { profile, settings, updateProfile, updateSettings, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study ?? '');
  const [threshold, setThreshold] = useState(settings?.completion_threshold ?? 70);
  const [notifications, setNotifications] = useState(settings?.notifications_enabled ?? false);
  const [theme, setTheme] = useState<Theme>(settings?.theme ?? 'light');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    const { error } = await updateProfile({
      name: name.trim(),
      occupation: occupation.trim() || null,
      year_of_study: yearOfStudy.trim() || null,
    });
    setSavingProfile(false);
    if (error) {
      setProfileError(error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }
  }

  async function handleSettingsSave() {
    setSettingsError(null);
    setSettingsSaved(false);
    setSavingSettings(true);
    const { error } = await updateSettings({
      completion_threshold: threshold,
      notifications_enabled: notifications,
      theme,
    });
    setSavingSettings(false);
    if (error) {
      setSettingsError(error);
    } else {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-stone-800 font-display mb-1">Settings</h1>
        <p className="text-stone-500">Manage your profile and preferences.</p>
      </div>

      {/* Profile section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center">
            <User size={18} className="text-sage-500" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700">Profile</h2>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="label">Name</label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="label">Email</label>
            <input
              id="settings-email"
              type="email"
              value={profile?.id ? '' : ''}
              defaultValue=""
              className="input bg-stone-50"
              placeholder={profile ? 'Email is managed by your account' : ''}
              disabled
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-occupation" className="label">Course / Occupation</label>
              <input
                id="settings-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="input"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div>
              <label htmlFor="settings-year" className="label">Year of Study</label>
              <input
                id="settings-year"
                type="text"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="input"
                placeholder="e.g. 2nd Year"
              />
            </div>
          </div>

          {profileError && <InlineError message={profileError} />}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Profile
                </>
              )}
            </button>
            {profileSaved && (
              <span className="text-sm text-sage-600 animate-fade-in">Saved!</span>
            )}
          </div>
        </form>
      </div>

      {/* Preferences section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-sand-50 flex items-center justify-center">
            <Sliders size={18} className="text-sand-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700">Preferences</h2>
        </div>

        {/* Completion threshold */}
        <div className="mb-6">
          <label htmlFor="threshold" className="label">
            Daily Completion Threshold
            <span className="text-stone-400 font-normal ml-1">— minimum % to count toward streaks</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              id="threshold"
              type="range"
              min={0}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="flex-1 accent-sage-500"
            />
            <span className="text-2xl font-bold text-stone-800 font-display min-w-[60px] text-center">
              {threshold}%
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            A day counts toward your streak when you complete at least {threshold}% of scheduled goals.
          </p>
        </div>

        {/* Theme */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={16} className="text-stone-400" />
            <span className="label mb-0">Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                theme === 'light'
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-cream-50 border border-stone-200" />
                <span className="text-sm font-medium text-stone-700">Light</span>
              </div>
              <p className="text-xs text-stone-400">Soft cream and sage tones</p>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                theme === 'dark'
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-stone-800" />
                <span className="text-sm font-medium text-stone-700">Dark</span>
              </div>
              <p className="text-xs text-stone-400">Coming soon</p>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50/50 border border-stone-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-700">Notification Preferences</p>
                <p className="text-xs text-stone-400">Enable reminders for your goals</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications(!notifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-sage-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2 px-3">
            Browser notifications will be requested when this feature is enabled. You can set reminder times on individual goals.
          </p>
        </div>

        {settingsError && <InlineError message={settingsError} />}

        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleSettingsSave} disabled={savingSettings} className="btn-primary">
            {savingSettings ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Preferences
              </>
            )}
          </button>
          {settingsSaved && (
            <span className="text-sm text-sage-600 animate-fade-in">Saved!</span>
          )}
        </div>
      </div>

      {/* Account section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700">Account</h2>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50/50 border border-stone-100">
          <div>
            <p className="text-sm font-medium text-stone-700">Log out</p>
            <p className="text-xs text-stone-400">Sign out of your DayMark account</p>
          </div>
          <button onClick={() => setConfirmLogout(true)} className="btn-danger">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need to log back in to access your goals and progress."
        confirmLabel="Log out"
        onConfirm={signOut}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
