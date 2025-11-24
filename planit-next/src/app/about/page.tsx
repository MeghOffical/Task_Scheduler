"use client";

import React from "react";
import Link from 'next/link';
import MainHeader from '@/components/main-header';

const AboutUs = () => {

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white">
      <MainHeader />

      <div className="px-6 py-12 flex flex-col items-center">
        <section className="max-w-3xl w-full bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-white/10">
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center">About Plan-It</h1>
        <p className="text-lg mb-8 text-center text-gray-700 dark:text-gray-300">
          <strong>Plan-It</strong> is a modern productivity platform that helps individuals and teams organize, prioritize, and complete work efficiently. We combine intelligent automation, intuitive design, and proven productivity techniques to help users achieve measurable outcomes.
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To empower people to focus on what matters by providing tools that reduce friction, increase clarity, and surface actionable insights about work.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Key Features</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Fast natural-language task creation (AI assistant)</li>
            <li>Integrated Pomodoro timer for focus sessions</li>
            <li>Detailed analytics and productivity insights</li>
            <li>Priority and status management with easy filtering</li>
            <li>Custom themes and personalization</li>
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Our Story</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Plan-It started as a small experiment to blend simple task management with smart automation. Over time, it evolved into a full productivity platform used by individuals and teams who value clarity and results.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Future Vision</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We plan to introduce deeper integrations, intelligent suggestions based on behavior, and richer team collaboration features. We welcome feedback to help prioritize the roadmap.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Contact the Plan-It Team</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Have questions or suggestions? We'd love to hear from you — visit our <Link href="/contact" className="text-blue-600 dark:text-blue-400 underline">Contact page</Link> to get in touch.</p>

          {/* single link kept above; no duplicate CTA */}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105">Get Started</Link>
        </div>
      </section>
      </div>
    </main>
  );
};

export default AboutUs;
