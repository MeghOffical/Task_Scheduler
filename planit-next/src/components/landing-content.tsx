"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import MainHeader from '@/components/main-header';
import faqsData from '@/app/faqs/faqs.json';

export default function LandingContent() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);

  const testimonials = [
    {
      quote: "Plan-It has completely transformed how I manage my daily tasks. The AI assistant is a game-changer!",
      author: "Sarah Johnson",
      role: "Product Manager",
      avatar: "SJ"
    },
    {
      quote: "The Pomodoro timer integration is brilliant. I'm 3x more productive than before.",
      author: "Michael Chen",
      role: "Software Developer",
      avatar: "MC"
    },
    {
      quote: "Finally, a task manager that understands natural language. Creating tasks feels effortless.",
      author: "Emily Rodriguez",
      role: "Entrepreneur",
      avatar: "ER"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    // Load FAQ items from JSON (client-side safe - JSON is static)
    try {
      const items = (faqsData || []).map((f: any) => ({ q: f.question, a: f.answer }));
      setFaqItems(items);
    } catch (e) {
      // fallback: basic inline items
      setFaqItems([
        { q: 'How do I sign up?', a: 'Click Sign Up in the header and follow the steps.' },
      ]);
    }
  }, []);

  // Dark mode is handled by the shared MainHeader component.

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Use shared header */}
      <MainHeader />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative text-center max-w-5xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Built for productivity and focus
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            Transform How You
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Work & Achieve
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto font-light">
            The complete productivity platform with smart task management, Pomodoro technique, AI assistance, and powerful analytics—all in one beautiful interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Sign Up
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-5 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-white/10 border-2 border-gray-300 dark:border-white/20 rounded-2xl hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="Smart Task Management"
            description="Create, organize, and prioritize tasks effortlessly. Set due dates, add descriptions, and track progress with an intuitive interface."
            color="from-blue-500 to-cyan-500"
          />

          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Pomodoro Timer"
            description="Boost focus with the Pomodoro technique. Work in 25-minute sprints with scheduled breaks to maintain peak productivity."
            color="from-indigo-500 to-purple-500"
          />

          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Detailed Analytics"
            description="Visualize your productivity with comprehensive dashboards. Track completion rates, time spent, and identify improvement areas."
            color="from-purple-500 to-pink-500"
          />

          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="AI Assistant"
            description="Intelligent chatbot powered by Google Gemini. Create and manage tasks with natural language—just ask and it's done."
            color="from-pink-500 to-rose-500"
          />

          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="Priority System"
            description="Organize with smart priorities and status tags. Filter by Low, Medium, High urgency and track from Pending to Completed."
            color="from-orange-500 to-amber-500"
          />

          <FeatureCard
            icon={
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
            title="Fully Customizable"
            description="Personalize your workspace with custom themes, Pomodoro durations, notification settings, and display preferences."
            color="from-teal-500 to-emerald-500"
          />
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border-t border-blue-100 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-2xl border border-gray-100 dark:border-white/10">
              <div className="absolute top-8 left-8 text-blue-600 dark:text-blue-400 opacity-50">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <div className="relative pt-8">
                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed italic">
                  {testimonials[activeTestimonial].quote}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonials[activeTestimonial].author}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonials[activeTestimonial].role}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonial
                        ? 'bg-blue-600 w-8'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How Plan-It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 z-0" style={{ transform: 'translateY(-50%)' }}></div>
            
            <StepCard
              step="1"
              title="Sign Up Free"
              description="Create your account in seconds. No credit card needed."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />

            <StepCard
              step="2"
              title="Add Your Tasks"
              description="Use the AI assistant or create tasks manually with smart features."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />

            <StepCard
              step="3"
              title="Get Things Done"
              description="Track progress, use Pomodoro, and achieve your goals efficiently."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Quick answers to common questions so you can get started faster.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion
              items={[
                {
                  q: 'How do I sign up?',
                  a: 'Click the "Sign Up" button in the header, fill in your email and password, and confirm. No credit card required for the free tier.'
                },
                {
                  q: 'Is Plan-It free to use?',
                  a: 'Yes. We offer a free plan that includes core features like task creation, Pomodoro timer, and basic analytics. Paid plans add advanced collaboration and integrations.'
                },
                {
                  q: 'What is the Pomodoro timer?',
                  a: 'The Pomodoro timer helps you work in focused intervals (default 25 minutes) followed by short breaks. It improves focus and reduces burnout.'
                },
                {
                  q: 'Can I collaborate with a team?',
                  a: 'Yes. Plan-It supports team workspaces, task assignments, and shared projects to help teams stay aligned.'
                },
                {
                  q: 'How is my data protected?',
                  a: 'We follow standard security practices. For production deployments ensure HTTPS and secure storage of environment secrets.'
                },
                {
                  q: 'Where can I get help?',
                  a: "Visit the Docs page, contact support through the Contact page, or open an issue in the project's GitHub repository."
                }
              ]}
            />
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Plan-It</p>
          <div className="flex items-center gap-6">
            <Link href="/status" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Status</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Docs</Link>
            <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</Link>
            <a href="https://github.com/MeghOffical/Task_Scheduler" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.337-.012 2.415-.012 2.743 0 .268.18.58.688.481A10.019 10.019 0 0022 12.017C22 6.484 17.523 2 12 2z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/50 hover:-translate-y-1">
      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${color} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ step, title, description, icon }: StepCardProps) {
  return (
    <div className="relative z-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-6 shadow-lg">
        {step}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all duration-300">
        <div className="inline-flex p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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

function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusButton = (index: number) => {
    const btn = buttonRefs.current[index];
    if (btn) btn.focus();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm">
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
              className="w-full flex items-center justify-between p-6 text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-${idx}`}
            >
              <span className="font-semibold text-gray-900 dark:text-white">{item.q}</span>
              <svg
                className={`w-5 h-5 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 scale-110 text-blue-600' : 'rotate-0 scale-100 text-gray-500 dark:text-gray-300'}`}
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
              className="px-6 pb-6 text-gray-600 dark:text-gray-300 transition-all duration-500 ease-out"
              style={{
                maxHeight: isOpen && contentRefs.current[idx] ? `${contentRefs.current[idx]!.scrollHeight}px` : '0px',
                overflow: 'hidden'
              }}
            >
              <div
                ref={(el) => { contentRefs.current[idx] = el; }}
                className={`pt-2 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ease-out`}
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