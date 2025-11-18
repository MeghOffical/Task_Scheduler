'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setMessage(data.message || 'Password reset link has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-12">
      {/* Modal Container - Same as login page */}
      <div className="glass-elevated rounded-3xl w-full max-w-md p-8 sm:p-9">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">Forgot your password?</h2>
          <p className="text-xs text-slate-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Input - Same styling as login page */}
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

          {/* Error Message - Same styling as login page */}
          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-700/60 p-3">
              <div className="text-xs text-red-200 text-center">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/60 p-3">
              <div className="text-xs text-emerald-200 text-center">{message}</div>
            </div>
          )}

          {/* Send Reset Link Button - Same styling as login button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-slate-950 font-semibold shadow-[0_18px_35px_rgba(56,189,248,0.55)] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </div>

          {/* Back to Login Link - Same styling as login page links */}
          <div className="text-center pt-4">
            <Link 
              href="/" 
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              ← Back to login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}