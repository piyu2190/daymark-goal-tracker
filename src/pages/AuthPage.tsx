import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InlineError } from '@/components/ui/ErrorMessage';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
    }

    const { error } = mode === 'signup'
      ? await signUp(email.trim(), password, name.trim())
      : await signIn(email.trim(), password);

    if (error) setError(error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream-50">
      {/* Left panel — branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700 flex flex-col justify-center items-center p-8 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-md text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="text-white" size={28} />
            </div>
            <span className="text-2xl font-bold text-white font-display">DayMark</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white font-display leading-tight mb-4">
            Welcome to DayMark
          </h1>
          <p className="text-lg text-sage-100 mb-8">
            Small actions. Visible progress.
          </p>

          <div className="space-y-4 text-sage-50">
            {[
              'Track daily goals and build lasting habits',
              'See your progress on a beautiful calendar',
              'Build streaks and stay motivated',
              'Your data, secured and synced across devices',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-white" size={14} />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-stone-800 font-display mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-stone-500">
              {mode === 'login'
                ? 'Log in to continue building your progress.'
                : 'Start your journey toward consistent daily progress.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="label">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="At least 6 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {error && <InlineError message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Log in' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-sage-600 font-medium hover:text-sage-700 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-sage-600 font-medium hover:text-sage-700 transition-colors"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
