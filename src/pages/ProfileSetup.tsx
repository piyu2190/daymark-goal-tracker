import { useState, type FormEvent } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InlineError } from '@/components/ui/ErrorMessage';

export function ProfileSetup() {
  const { profile, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    const { error } = await updateProfile({
      name: name.trim(),
      occupation: occupation.trim() || null,
      year_of_study: yearOfStudy.trim() || null,
    });
    if (error) setError(error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-800 font-display mb-2">
            Let's set up your profile
          </h1>
          <p className="text-stone-500">
            Tell us a bit about yourself so we can personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label htmlFor="setup-name" className="label">Name <span className="text-red-500">*</span></label>
            <input
              id="setup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="setup-occupation" className="label">Course / Occupation</label>
            <input
              id="setup-occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="input"
              placeholder="e.g. Computer Science, Engineering, Marketing"
            />
          </div>

          <div>
            <label htmlFor="setup-year" className="label">Year of Study <span className="text-stone-400 font-normal">(optional)</span></label>
            <input
              id="setup-year"
              type="text"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="input"
              placeholder="e.g. 2nd Year, Final Year"
            />
          </div>

          {error && <InlineError message={error} />}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
