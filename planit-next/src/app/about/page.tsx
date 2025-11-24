'use client';

import React from "react";
import Link from 'next/link';

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white px-6 py-12 flex flex-col items-center">
      {/* Navigation Header */}
      <header className="w-full mb-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Plan-It</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart Task Management</p>
            </div>
          </Link>
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <section className="max-w-3xl w-full bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-white/10">
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center">About Plan-It</h1>
        <p className="text-lg mb-8 text-center text-gray-700 dark:text-gray-300">
          <strong>Plan-It</strong> is a modern productivity platform designed to help you organize, prioritize, and accomplish your goals with ease. Whether you're a student, professional, or part of a team, Plan-It brings clarity and focus to your daily workflow.
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To empower people everywhere to achieve more by making task management simple, smart, and enjoyable. We believe productivity should be stress-free and tailored to your unique needs.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Key Features</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Quick and intuitive task creation</li>
            <li>Pomodoro timer for focused work sessions</li>
            <li>Detailed analytics dashboard to track progress</li>
            <li>AI-powered task management with natural language</li>
            <li>Activity heatmap to track productivity</li>
            <li>Comprehensive analytics and insights</li>
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Our Story</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Plan-It began as a vision to simplify productivity for everyone. Our diverse team of developers, designers, and productivity enthusiasts came together to address the real struggles of managing tasks, deadlines, and work-life balance. Through collaboration and innovation, Plan-It has grown into a platform trusted by users worldwide for its reliability and user-centric features.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Future Vision</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Looking ahead, Plan-It will introduce smarter automation, personalized productivity insights, and seamless integration with your favorite tools. We are dedicated to listening to our community and evolving to meet the changing needs of modern work and life. Join us as we shape the future of productivity together!
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105"
          >
            Back to Home
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
