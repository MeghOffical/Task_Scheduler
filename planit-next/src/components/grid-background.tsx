'use client';

interface GridBackgroundProps {
  children: React.ReactNode;
}

export default function GridBackground({ children }: GridBackgroundProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#01041c] text-slate-900 dark:text-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}