"use client";

import React from "react";
import Link from 'next/link';
import MainHeader from '@/components/main-header';

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <MainHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-blue-600 dark:text-blue-400">
            About Plan-It
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transforming how people work by combining smart automation, intuitive design, and proven productivity techniques.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission & Vision Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mission Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Our Mission</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To empower people to focus on what matters by providing tools that reduce friction, increase clarity, and surface actionable insights about work.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Future Vision</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We plan to introduce deeper integrations, intelligent suggestions based on behavior, and richer team collaboration features. We welcome feedback to help prioritize the roadmap.
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-10 border border-gray-200 dark:border-slate-700 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">What is Plan-It?</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong>Plan-It</strong> is a modern productivity platform that helps individuals and teams organize, prioritize, and complete work efficiently. We combine intelligent automation, intuitive design, and proven productivity techniques to help users achieve measurable outcomes.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 border border-gray-200 dark:border-slate-700 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Our Story</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Plan-It started as a small experiment to blend simple task management with smart automation. Over time, it evolved into a full productivity platform used by individuals and teams who value clarity and results. We remain committed to listening to our users and continuously improving the experience.
          </p>
        </div>

        {/* CTA Section */}
        <section className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-12 text-center shadow-2xl border border-gray-200 dark:border-slate-700">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to boost your productivity?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">Join thousands of users who are already achieving their goals with Plan-It.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all hover:shadow-lg">
              Get Started Free
            </Link>
            <Link href="/contact" className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutUs;