'use client';

interface GridBackgroundProps {
  children: React.ReactNode;
}

export default function GridBackground({ children }: GridBackgroundProps) {
  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-50">
      {/* Light mode layered gradient; hidden in dark mode */}
      <div className="absolute inset-0 bg-light-brand-gradient dark:hidden" />
      <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none dark:hidden"
           style={{
             backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(63,86,107,0.4) 1px, transparent 0)',
             backgroundSize: '22px 22px'
           }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-200/40 to-primary-300/60 dark:hidden" />
      {/* Dark mode base background (original) */}
      <div className="absolute inset-0 hidden dark:block bg-[#01041c]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}