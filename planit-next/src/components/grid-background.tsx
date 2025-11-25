'use client';

interface GridBackgroundProps {
  children: React.ReactNode;
}

export default function GridBackground({ children }: GridBackgroundProps) {
  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-50 bg-blue-50 dark:bg-[#16191F] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}