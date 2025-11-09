'use client';

interface GridBackgroundProps {
  children: React.ReactNode;
}

export default function GridBackground({ children }: GridBackgroundProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}