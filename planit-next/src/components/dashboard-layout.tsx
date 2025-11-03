'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Header = () => {
  const [notificationCount] = useState(1);
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
        Plan-it
      </Link>
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="text-xl cursor-pointer">🔔</span>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </div>
        <button
          className="theme-toggle"
          onClick={() => document.body.classList.toggle('dark')}
          title="Toggle Theme"
        >
          🌙
        </button>
        <span className="text-xl">👤</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/tasks', icon: '📋', label: 'Tasks' },
    { href: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="bg-white w-64 min-h-screen shadow-sm">
      <nav className="py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-primary-600 border-l-4 border-primary-600 font-semibold'
                : ''
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}