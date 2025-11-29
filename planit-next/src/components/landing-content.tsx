"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import faqsData from '@/app/faqs/faqs.json';
import MainHeader from './main-header';

export default function LandingContent() {
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);
  
  // THEME STATE
  const [isDark, setIsDark] = useState(false);


  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };


  useEffect(() => {
    try {
      const items = (faqsData || []).map((f: any) => ({ q: f.question, a: f.answer }));
      setFaqItems(items);
    } catch (e) {
      setFaqItems([
        { q: 'How do I sign up?', a: 'Click Sign Up in the header and follow the steps.' },
      ]);
    }
  }, []);

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-[#16191F] transition-colors duration-300 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Use shared header */}
      <MainHeader />

      {/* SECTION 1: Hero & Features */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pb-20">
        
        <div className="relative text-center max-w-5xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Built for productivity
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
            Transform How You <br className="hidden sm:block" />
            <span className="text-gray-900 dark:text-white">Work & Achieve</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto font-normal">
            The complete productivity platform with smart task management, Pomodoro technique, AI assistance, and powerful analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              Sign Up
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Smart Tasks"
            description="Create, organize, and prioritize tasks effortlessly with due dates and tags."
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Pomodoro Timer"
            description="Boost focus with 25-minute sprints and scheduled breaks."
            color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Analytics"
            description="Visualize productivity trends and track completion rates."
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="AI Assistant"
            description="Manage tasks with natural language powered by Google Gemini."
            color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="Priorities"
            description="Filter by Low, Medium, High urgency to stay on top of work."
            color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
            title="Customizable"
            description="Personalize themes, notification settings, and preferences."
            color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
          />
        </div>
      </section>

      {/* SECTION 3: How It Works */}
      <section className="bg-white dark:bg-[#11141A] border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              How Plan-It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <StepCard
              step="1"
              title="Sign Up Free"
              description="Create your account in seconds. No credit card needed."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />

            <StepCard
              step="2"
              title="Add Your Tasks"
              description="Use the AI assistant or create tasks manually with smart features."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />

            <StepCard
              step="3"
              title="Get Things Done"
              description="Track progress, use Pomodoro, and achieve your goals efficiently."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQs */}
      <section id="faqs" className="bg-white dark:bg-[#11141A] border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Quick answers to common questions.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion
              items={faqItems.length > 0 ? faqItems : [
                {
                  q: 'How do I sign up?',
                  a: 'Click the "Sign Up" button in the header, fill in your email and password, and confirm. No credit card required for the free tier.'
                },
                {
                   q: 'Is Plan-It free to use?',
                   a: 'Yes. We offer a free plan that includes core features like task creation, Pomodoro timer, and basic analytics.'
                },
              ]}
            />
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-[#11141A] border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 Plan-It</p>
          <div className="flex items-center gap-6">
            <Link href="/status" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Status</Link>
            <Link href="/docs" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Docs</Link>
            <Link href="/contact" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
            <a href="https://github.com/MeghOffical/Task_Scheduler" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.337-.012 2.415-.012 2.743 0 .268.18.58.688.481A10.019 10.019 0 0022 12.017C22 6.484 17.523 2 12 2z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Flat Feature Card (No gradient, tighter corners)
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="group relative glass-panel rounded-2xl p-7 shadow-lg border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Flat Step Card
interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ step, title, description, icon }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg font-bold mb-6 shadow-lg">
        {step}
      </div>
      <div className="glass-panel rounded-2xl p-7 shadow-lg border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300 hover:shadow-xl">
        <div className="inline-flex p-3 rounded-lg bg-gray-50 dark:bg-[#151922] text-blue-600 dark:text-blue-400 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

interface AccordionItem {
  q: string;
  a: string;
}

// Flat Accordion
function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  // FIXED: Changed to any[] to resolve the TypeScript strictness error
  const contentRefs = useRef<any[]>([]);
  const buttonRefs = useRef<any[]>([]);

  const focusButton = (index: number) => {
    const btn = buttonRefs.current[index];
    if (btn) btn.focus();
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="rounded-2xl border border-gray-200 dark:border-white/5 glass-panel shadow-lg overflow-hidden">
            <button
              ref={(el) => { buttonRefs.current[idx] = el; }}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              onKeyDown={(e) => {
                const key = e.key;
                if (key === 'ArrowDown') {
                  e.preventDefault();
                  focusButton((idx + 1) % items.length);
                } else if (key === 'ArrowUp') {
                  e.preventDefault();
                  focusButton((idx - 1 + items.length) % items.length);
                } else if (key === 'Home') {
                  e.preventDefault();
                  focusButton(0);
                } else if (key === 'End') {
                  e.preventDefault();
                  focusButton(items.length - 1);
                } else if (key === 'Enter' || key === ' ') {
                  e.preventDefault();
                  setOpenIndex(isOpen ? null : idx);
                }
              }}
              className={`w-full flex items-center justify-between px-5 sm:px-6 text-left transition-[padding] duration-200 ${
                isOpen ? 'pt-4 pb-3 sm:pt-5 sm:pb-3.5' : 'py-4 sm:py-5'
              }`}
              aria-expanded={isOpen}
              aria-controls={`faq-${idx}`}
            >
              <span className="font-medium text-gray-900 dark:text-white pr-6 text-base sm:text-lg leading-snug flex-1">
                {item.q}
              </span>
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gray-500' : 'rotate-0 text-gray-400'}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
              </svg>
            </button>

            <div
              id={`faq-${idx}`}
              className="px-5 sm:px-6 text-gray-600 dark:text-gray-400 transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isOpen && contentRefs.current[idx] ? `${contentRefs.current[idx].scrollHeight + 32}px` : '0px',
                paddingBottom: isOpen ? '1.5rem' : '0',
                paddingTop: isOpen ? '0.75rem' : '0',
                overflow: 'hidden'
              }}
            >
              <div
                ref={(el) => { contentRefs.current[idx] = el; }}
                className={`pb-2 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} transition-all duration-300 leading-relaxed text-base`}
              >
                {item.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}