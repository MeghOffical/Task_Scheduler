'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setMessage('Password reset successfully! Redirecting to home...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-elevated rounded-3xl w-full max-w-md p-8 sm:p-9">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
              Invalid or expired link
            </h2>
            <p className="text-xs text-slate-400">
              Your password reset link is invalid or has expired. You can request a new one below.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl bg-red-900/20 border border-red-700/60 p-3">
              <div className="text-xs text-red-200 text-center">Invalid or missing reset token</div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-sky-400 hover:text-sky-300"
              >
                ← Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-elevated rounded-3xl w-full max-w-md p-8 sm:p-9">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
            Reset your password
          </h2>
          <p className="text-xs text-slate-400">
            Enter your new password below to secure your Plan-it account.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-700/60 p-3">
              <div className="text-xs text-red-200 text-center">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/60 p-3">
              <div className="text-xs text-emerald-200 text-center">{message}</div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-semibold shadow-[0_18px_35px_rgba(37,99,235,0.55)] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-xs font-medium text-sky-400 hover:text-sky-300"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-elevated rounded-3xl w-full max-w-md p-8 sm:p-9">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto"></div>
            <p className="mt-4 text-xs text-slate-400">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

