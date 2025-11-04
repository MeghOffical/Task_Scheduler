'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const Header = () => {
  const [notificationCount] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string } | null>(null);
  const pathname = usePathname();

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        const data = await response.json();
        setUserInfo({ username: data.username, email: data.email });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Fetch user info
    fetchUserInfo();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center transition-colors">
      <Link href="/dashboard" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
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
          className="text-xl cursor-pointer hover:opacity-80 transition-opacity"
          onClick={toggleDarkMode}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        
        {/* Profile Menu */}
        <div className="relative profile-menu-container">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="text-xl cursor-pointer hover:opacity-80 transition-opacity"
            title="Profile Menu"
          >
            👤
          </button>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-xl">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {userInfo?.username || 'Loading...'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userInfo?.email || 'Loading...'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
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
    <aside className="bg-white dark:bg-gray-800 w-64 min-h-screen shadow-sm transition-colors">
      <nav className="py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 font-semibold'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  );
}