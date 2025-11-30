"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/main-header';
import { validateEmail } from '@/lib/emailValidator';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setResult('Please provide your email and a brief message.');
      return;
    }

    // Validate email domain
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setResult(emailValidation.error || 'Invalid email');
      return;
    }

    setSubmitting(true);
    const subject = encodeURIComponent('Plan-It Contact: ' + (name || 'Anonymous'));
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    // mailto fallback
    window.location.href = `mailto:devsatplanit@gmail.com?subject=${subject}&body=${body}`;
    setSubmitting(false);
    setResult('Opening your email client...');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white">
      <MainHeader />

      <div className="px-6 py-12 flex flex-col items-center">
        <section className="max-w-3xl w-full bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-white/10">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">Contact Plan-It</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">We’re happy to help — please provide your contact details and a brief message describing your query or suggestion. For urgent issues, email <a className="underline text-blue-600 dark:text-blue-400" href="mailto:devsatplanit@gmail.com">devsatplanit@gmail.com</a>.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="flex gap-3 flex-wrap">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="flex-1 min-w-[12rem] px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-sm" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required className="flex-1 min-w-[12rem] px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-sm" />
          </div>

          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (how can we help?)" required rows={6} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-sm" />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:shadow">{submitting ? 'Sending...' : 'Send Message'}</button>
            <button type="button" onClick={() => { setName(''); setEmail(''); setMessage(''); setResult(null); }} className="px-4 py-2 border rounded-md">Reset</button>
            {result && <p className="text-sm text-gray-600 dark:text-gray-300">{result}</p>}
          </div>
        </form>

        <div className="mt-8 flex gap-3">
          <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md">Create an account</Link>
        </div>
      </section>
      </div>
    </main>
  );
}
