'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LandingContent() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  return (
    <>
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-sky-500/40">
                <span>🪐</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-[0.25em] uppercase text-slate-400">Plan-it</span>
                <span className="text-xs text-slate-500">Focus-grade task orchestration</span>
              </div>
            </div>

            <nav className="flex items-center gap-3 text-sm font-medium">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="hidden sm:inline-flex items-center rounded-full border border-white/15 bg-white/0 px-4 py-1.5 text-slate-200 hover:bg-white/5 hover:border-white/25 transition-colors"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(56,189,248,0.45)] hover:brightness-110 transition-all"
              >
                Start free workspace
              </button>
            </nav>
          </div>
        </header>

        <div className="relative flex-1">
          {/* Hero lighting */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-sky-500/40 via-blue-500/20 to-indigo-500/40 blur-3xl" />
            <div className="absolute bottom-[-10rem] -left-40 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          </div>

          <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
              {/* Hero copy */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200/90 reveal-up">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Built for deep work, not busywork
                </div>

                <div className="space-y-4 reveal-up reveal-delay-1">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50">
                    Task orchestration
                    <span className="block bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                      for people who care about time.
                    </span>
                  </h1>
                  <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-slate-300">
                    Plan-it weaves tasks, focus rituals, and an intelligent AI copilot into one calm workspace. 
                    No clutter, no noisejust the next right thing, always within reach.
                  </p>
                </div>

                {/* Minimal hero actions for a calm surface */}
              </div>

              {/* Hero panel */}
              <div className="relative h-full">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/20 blur-2xl" />
                <div className="relative glass-elevated rounded-3xl p-5 sm:p-6 lg:p-7 tilt-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Today at a glance</p>
                      <p className="mt-1 text-sm text-slate-200">Thursday, 09:30 AM</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-emerald-300 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AI focus mode
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <TimelineItem
                      label="Deep work"
                      detail="Strategy review sprint"
                      time="09:45 - 11:15"
                      accent="from-sky-400 to-blue-500"
                    />
                    <TimelineItem
                      label="Priority block"
                      detail="Ship Q3 roadmap tasks"
                      time="11:30 - 13:00"
                      accent="from-indigo-400 to-violet-500"
                    />
                    <TimelineItem
                      label="Recovery"
                      detail="Walk + inbox zero sweep"
                      time="15:00 - 15:30"
                      accent="from-emerald-400 to-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FeaturePill title="AI that actually understands context" icon="🤖" />
                    <FeaturePill title="Undo, history, and safe experiments" icon="⏪" />
                    <FeaturePill title="Timeline aware reminders" icon="⏱️" />
                    <FeaturePill title="Calm notifications only" icon="🔔" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Secondary section */}
          <section className="relative border-t border-slate-800/60 bg-slate-950/60">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
              <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
                <div className="space-y-6">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Designed for how humans actually work</p>
                  <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-slate-50">
                    One canvas for tasks, time, and attention.
                  </h2>
                  <p className="max-w-xl text-sm sm:text-base text-slate-300">
                    Plan-it keeps your day legible. Tasks, focus blocks, and commitments live in one coherent rhythmguided by an AI that stays out of the way until you need it.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <MiniCard
                      title="Task system"
                      body="Status, priority, and context without the overhead of a project tool."
                    />
                    <MiniCard
                      title="Focus rituals"
                      body="Pomodoro, intention prompts, and gentle nudges to return to what matters."
                    />
                    <MiniCard
                      title="AI copilots"
                      body="Ask in plain language. Plan-it restructures your week, not just your to-do."
                    />
                  </div>
                </div>

                <div className="space-y-4 glass-elevated rounded-3xl p-5 sm:p-6 lg:p-7">
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-400">
                    What a day feels like
                  </p>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                    <p>
                      <span className="text-slate-400">08:12</span>  Plan-it rebuilds your day after a surprise meeting appears.
                    </p>
                    <p>
                      <span className="text-slate-400">11:03</span>  AI suggests moving a low-leverage task to next week.
                    </p>
                    <p>
                      <span className="text-slate-400">16:27</span>  You get a single calm summary of what truly needs attention tomorrow.
                    </p>
                  </div>
                  <div className="pt-2 text-xs text-slate-400">
                    No dopamine casino. No flashing badges. Just the minimum information you need, exactly when you need it.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-800/70 bg-slate-950/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-slate-500">
                Crafted for people who care about how they spend their time.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Ready when you are.</span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Auth modals */}
      {authMode && (
        <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </>
  );
}

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
}

function AuthModal({ mode, onClose }: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl px-4">
      <div className="relative glass-elevated rounded-3xl w-full max-w-md p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-200"
        >
          <span className="sr-only">Close</span>
          <span className="text-lg">&times;</span>
        </button>
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error || 'Invalid credentials');
      }

      if (result?.ok) {
        router.replace('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">Welcome back</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-1">Sign in to Plan-it</h2>
        <p className="text-xs text-slate-400">Enter your credentials to open your workspace.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/60 p-3">
            <div className="text-xs text-red-200 text-center">{error}</div>
          </div>
        )}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-slate-950 font-semibold shadow-[0_18px_35px_rgba(56,189,248,0.55)] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700/80 bg-slate-950/40 text-xs text-slate-200 hover:bg-slate-900/70 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profession: '',
    otherProfession: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(formData.password)) {
      setError('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const profession = formData.profession === 'Other' ? formData.otherProfession : formData.profession;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          profession,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">Create your workspace</p>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-1">Plan-it account</h2>
        <p className="text-xs text-slate-400">Sign up once. Your tasks, focus rituals, and AI copilot stay in sync everywhere.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <select
            id="profession"
            name="profession"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            value={formData.profession}
            onChange={handleChange}
          >
            <option value="">Select Profession</option>
            <option value="Student">Student</option>
            <option value="Working Professional">Working Professional</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Entrepreneur">Entrepreneur</option>
            <option value="Designer">Designer</option>
            <option value="Developer">Developer</option>
            <option value="Manager">Manager</option>
            <option value="Teacher">Teacher</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {formData.profession === 'Other' && (
          <div>
            <input
              id="otherProfession"
              name="otherProfession"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Specify your profession"
              value={formData.otherProfession}
              onChange={handleChange}
            />
          </div>
        )}
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/60 p-3">
            <div className="text-xs text-red-200 text-center">{error}</div>
          </div>
        )}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-slate-950 font-semibold shadow-[0_18px_35px_rgba(56,189,248,0.55)] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TimelineItemProps {
  readonly label: string;
  readonly detail: string;
  readonly time: string;
  readonly accent: string;
}

function TimelineItem({ label, detail, time, accent }: TimelineItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-900/60 px-3 py-2.5 border border-slate-800/80">
      <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${accent}`} />
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="text-xs text-slate-50">{detail}</p>
      </div>
      <p className="text-[11px] text-slate-400">{time}</p>
    </div>
  );
}

interface FeaturePillProps {
  readonly title: string;
  readonly icon: string;
}

function FeaturePill({ title, icon }: FeaturePillProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-900/70 px-3 py-2 border border-slate-700/80 text-[11px] text-slate-200">
      <span className="text-base">{icon}</span>
      <span className="leading-snug">{title}</span>
    </div>
  );
}

interface MiniCardProps {
  readonly title: string;
  readonly body: string;
}

function MiniCard({ title, body }: MiniCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
      <h3 className="text-xs font-semibold text-slate-50 mb-1.5">{title}</h3>
      <p className="text-[11px] text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
