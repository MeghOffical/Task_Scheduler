'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BellIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  ChartBarIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
}

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen: boolean; setIsMobileMenuOpen: (open: boolean) => void }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string; points?: number } | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [missedTasks, setMissedTasks] = useState<Task[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [pointsToast, setPointsToast] = useState<{
    delta: number;
    message: string;
  } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPointsRef = useRef<number>(0);

  const showPointToast = useCallback(
    (message: string, delta: number) => {
      setPointsToast({
        delta,
        message,
      });

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => setPointsToast(null), 3500);
    },
    [setPointsToast]
  );

  useEffect(() => {
    if (typeof userInfo?.points === 'number') {
      latestPointsRef.current = userInfo.points;
    }
  }, [userInfo?.points]);

  // Expose a simple global helper so other client components (e.g. Tasks page)
  // can trigger a points toast without prop drilling. This attaches once on
  // mount and is safe in the browser.
  useEffect(() => {
    const globalToastHandler = (message: string, delta: number) => {
      showPointToast(message, delta);

      const currentPoints = latestPointsRef.current ?? 0;
      const nextPoints = Math.max(0, currentPoints + delta);
      latestPointsRef.current = nextPoints;

      setUserInfo(prev => (prev ? { ...prev, points: nextPoints } : prev));
      setLastPoints(nextPoints);
    };

    (window as any).showPointsToast = globalToastHandler;

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if ((window as any).showPointsToast) {
        delete (window as any).showPointsToast;
      }
    };
  }, [showPointToast]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        const data = await response.json();

        const nextPoints = data.points ?? 0;
        setUserInfo({ username: data.username, email: data.email, points: nextPoints });

        // Detect point changes (e.g. from task completion or penalties)
        setLastPoints((prev) => {
          if (prev === null || prev === nextPoints) return nextPoints;

          const delta = nextPoints - prev;
          if (delta !== 0) {
            showPointToast(
              delta > 0
                ? `You earned +${delta} points`
                : `You lost ${Math.abs(delta)} points`,
              delta
            );
          }

          return nextPoints;
        });

        // Automatic daily check-in on login / first load of the day
        try {
          const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const stored = localStorage.getItem('lastDailyCheckinDate');
          if (stored !== todayKey) {
            const res = await fetch('/api/points/daily-checkin', { method: 'POST' });
            const dcData = await res.json();

            if (res.ok) {
              localStorage.setItem('lastDailyCheckinDate', todayKey);

              // Update local points if API sends it
              setUserInfo(prev =>
                prev
                  ? {
                      ...prev,
                      points:
                        typeof dcData.points === 'number'
                          ? dcData.points
                          : prev.points,
                    }
                  : prev
              );

              (window as any).showPointsToast?.(
                'Daily login bonus! You earned +1 point.',
                1
              );
            }
          }
        } catch (e) {
          console.error('Auto daily check-in failed:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasks = await response.json();
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const pending: Task[] = [];
        const missed: Task[] = [];

        tasks.forEach((task: Task) => {
          if (dismissedNotifications.has(task.id)) return;
          
          let isMissed = false;
          if (task.dueDate && task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < now) {
              missed.push(task);
              isMissed = true;
            }
          }

          if (task.status === 'pending' && !isMissed) pending.push(task);
        });

        setPendingTasks(pending);
        setMissedTasks(missed);
        setNotificationCount(pending.length + missed.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'light' ? false : (savedTheme === 'dark' || !savedTheme);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);

    fetchUserInfo();
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (showNotifications && !target.closest('.notification-menu-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, showNotifications]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        // Clear custom auth token
        await fetch('/api/auth/logout', { method: 'POST' });
        
        // Also clear NextAuth session
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
        
        // Force redirect to home
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback: just clear cookies and redirect
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = '/';
      }
    }
  };

  const dismissNotification = (taskId: string) => {
    setDismissedNotifications(prev => new Set(prev).add(taskId));
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    setMissedTasks(prev => prev.filter(t => t.id !== taskId));
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    const allTaskIds = [...pendingTasks, ...missedTasks].map(t => t.id);

    setDismissedNotifications(prev => {
      const s = new Set(prev);
      allTaskIds.forEach(id => s.add(id));
      return s;
    });

    setPendingTasks([]);
    setMissedTasks([]);
    setNotificationCount(0);
  };

  return (
  <header className="w-full fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200 backdrop-blur flex justify-between items-center px-2 sm:px-6 py-2.5 sm:py-3 dark:bg-[#11141A]/95 dark:border-white/5">
      
      {/* Mobile Menu Button - Inside Header */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#151922] transition-colors mr-1"
        title="Toggle menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Logo - Show on all screens */}
      <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex-shrink-0">
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
            viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className="w-4 sm:w-5 h-4 sm:h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Z" />
          </svg>
        </div>
        <span className="uppercase tracking-[0.16em] text-xs sm:text-sm font-black text-blue-900 dark:text-white">Plan-It</span>
      </Link>


      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Points toast */}
        {pointsToast && (
          (() => {
            const delta = pointsToast.delta;
            const isPenalty = delta < 0;
            const themeClasses = delta < 0
              ? {
                  wrapper: 'border-rose-400/30 bg-rose-500/10 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
                  dot: 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.55)]',
                  subtext: 'text-rose-100/80',
                }
              : delta === 1
                ? {
                    wrapper: 'border-amber-300/30 bg-amber-500/10 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
                    dot: 'bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
                    subtext: 'text-amber-100/80',
                  }
                : {
                    wrapper: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
                    dot: 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
                    subtext: 'text-emerald-100/80',
                  };

            return (
              <div className={`fixed top-6 right-6 z-50 flex max-w-xs items-start gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm backdrop-blur-lg ${themeClasses.wrapper}`}>
                <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${themeClasses.dot}`} />
                <div>
                  <p className="font-semibold leading-snug">
                    {pointsToast.message}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${themeClasses.subtext}`}>
                    {isPenalty ? 'Keep an eye on upcoming deadlines.' : 'Nice! Your points were updated.'}
                  </p>
                </div>
              </div>
            );
          })()
        )}

        {/* Notifications */}
        <div className="relative notification-menu-container">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="relative flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100"
          >
            <BellIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-medium text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Drop-down */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-xl bg-[#11141A] border border-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-white/5 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex justify-between items-center flex-1">
                  <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8B929D]">
                    <BellIcon className="w-3 sm:w-4 h-3 sm:h-4 text-[#3B82F6]" />
                    Notifications
                  </h3>

                  {(pendingTasks.length > 0 || missedTasks.length > 0) && (
                    <button onClick={clearAllNotifications}
                      className="text-[10px] sm:text-[11px] text-[#8B929D] hover:text-red-400 px-2 py-1 rounded transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Missed Tasks */}
              {missedTasks.length > 0 && (
                <div className="border-b border-white/5 px-3 sm:px-4 py-2.5 sm:py-3">
                  <h4 className="flex items-center gap-2 text-xs font-medium text-red-400">
                    <ExclamationTriangleIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                    Missed Tasks ({missedTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {missedTasks.map((task) => (
                      <div key={task.id}
                        className="relative rounded-lg bg-[#151922] px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-[#E6E9EF]">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                          <XMarkIcon className="w-3 h-3" />
                        </button>

                        <p className="text-[12px] sm:text-[13px] font-medium text-[#E6E9EF] pr-4">{task.title}</p>
                        {task.dueDate && (
                          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#8B929D]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                  <h4 className="flex items-center gap-2 text-xs font-medium text-[#E6E9EF]">
                    <ClockIcon className="w-3 sm:w-4 h-3 sm:h-4 text-slate-500" />
                    Pending Tasks ({pendingTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {pendingTasks.map((task) => (
                      <div key={task.id}
                        className="relative rounded-lg bg-[#151922] px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-[#E6E9EF]">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                          <XMarkIcon className="w-3 h-3" />
                        </button>

                        <p className="text-[12px] sm:text-[13px] font-medium text-[#E6E9EF] pr-4">{task.title}</p>
                        {task.dueDate && (
                          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#8B929D]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingTasks.length === 0 && missedTasks.length === 0 && (
                <div className="px-3 sm:px-4 py-4 sm:py-6 text-center text-[11px] sm:text-[12px] text-[#8B929D]">No notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Dark / Light Mode Button */}
        <button onClick={toggleDarkMode}
          className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100"
          title={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? (
            <SunIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          ) : (
            <MoonIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="relative profile-menu-container">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100">
            <UserCircleIcon className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 sm:w-64 overflow-hidden rounded-xl border border-white/5 bg-[#11141A] shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-50">
              <div className="border-b border-white/5 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <UserCircleIcon className="h-7 w-7 sm:h-9 sm:w-9 text-slate-300 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#E6E9EF] truncate">{userInfo?.username}</p>
                    <p className="text-xs text-[#8B929D] truncate">{userInfo?.email}</p>
                    {typeof userInfo?.points === 'number' && (
                      <p className="mt-1 text-xs font-medium text-amber-300">
                        Your Points: <span className="font-semibold">{userInfo.points}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-2 py-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-[12px] sm:text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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


// -----------------------------------------------------------------------
// SIDEBAR
// -----------------------------------------------------------------------

interface SidebarProps {
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  messages: Array<{id: number; text: string; isUser: boolean}>;
  setMessages: (messages: Array<{id: number; text: string; isUser: boolean}>) => void;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar = ({
  showAIPanel,
  setShowAIPanel,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isMinimized,
  setIsMinimized,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}: SidebarProps) => {

  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: <HomeIcon className="w-4 h-4" />, label: 'Home' },
    { href: '/tasks', icon: <ClipboardDocumentListIcon className="w-4 h-4" />, label: 'Tasks' },
    { href: '/pomodoro', icon: <ClockIcon className="w-4 h-4" />, label: 'Pomodoro' },
    { href: '/analytics', icon: <ChartBarIcon className="w-4 h-4" />, label: 'Analytics' },
    { href: '/ai-assistant', icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
        <path d="M9.5 15.2c1 0.5 2.5 0.5 3.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 18v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ), label: 'AI Assistant' },
    { href: '/settings', icon: <Cog6ToothIcon className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar - Always Expanded */}
      <aside className="hidden md:flex w-64 md:h-screen h-full bg-slate-50 border-r border-slate-200 flex-col dark:bg-[#0F1218] dark:border-white/5 transition-all duration-300 relative md:fixed md:top-0 md:left-0 md:bottom-0 md:z-30 flex-shrink-0 rounded-br-3xl">
        
        <nav className="py-6 md:pt-[90px] px-2 flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 rounded-lg py-2.5 text-sm transition-colors relative
                ${isActive
                  ? 'bg-primary-100 text-primary-800 shadow-sm ring-1 ring-primary-300 dark:bg-[#151922] dark:text-[#E6E9EF] dark:ring-0'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800 dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100'}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[13px] transition-colors flex-shrink-0
                  ${isActive
                    ? 'border-primary-400 bg-primary-50 text-primary-600 dark:border-[#3B82F6] dark:text-[#3B82F6] dark:bg-transparent'
                    : 'border-slate-300 text-slate-500 group-hover:border-primary-300 group-hover:text-primary-600 dark:border-[#1F2430]'}`}
                >
                  {item.icon}
                </span>
                <span className="font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </Link>
            );
          })}

        </nav>
      </aside>

      {/* Desktop placeholder to preserve layout space when sidebar is fixed */}
      <div className="hidden md:block w-64 flex-shrink-0" aria-hidden="true" />

      {/* Mobile Sidebar - Slide from left */}
      <div className={`md:hidden fixed inset-y-0 left-0 w-64 bg-blue-200 border-r border-blue-300 flex flex-col dark:bg-[#0F1218] dark:border-white/5 z-40 transform transition-transform duration-300 rounded-r-3xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-300 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#E6E9EF]">Menu</h3>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-blue-300 dark:hover:bg-[#151922] transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <nav className="py-4 px-2 flex-1 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 rounded-lg py-2.5 text-sm transition-colors
                ${isActive
                  ? 'bg-primary-100 text-primary-800 shadow-sm ring-1 ring-primary-300 dark:bg-[#151922] dark:text-[#E6E9EF] dark:ring-0'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800 dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100'}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[13px] transition-colors flex-shrink-0
                  ${isActive
                    ? 'border-primary-400 bg-primary-50 text-primary-600 dark:border-[#3B82F6] dark:text-[#3B82F6] dark:bg-transparent'
                    : 'border-slate-300 text-slate-500 dark:border-[#1F2430]'}`}
                >
                  {item.icon}
                </span>
                <span className="font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* AI Right Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 glass-panel transform ${showAIPanel ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-50`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
          <button onClick={() => setShowAIPanel(false)} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}
                className={`p-4 rounded-lg ${message.isUser ? 'bg-gray-100 dark:bg-gray-700 ml-8' : 'bg-blue-50 dark:bg-blue-900/20 mr-8'}`}>
                <p className={`text-sm ${message.isUser ? 'text-gray-800 dark:text-gray-200' : 'text-blue-800 dark:text-blue-200'}`}>
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="11" r="1" fill="currentColor" />
                <circle cx="15" cy="11" r="1" fill="currentColor" />
                <path d="M9.5 15.2c1 0.5 2.5 0.5 3.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* DARKER OVERLAY */}
      {showAIPanel && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setShowAIPanel(false)}
        />
      )}
    </>
  );
};


// -----------------------------------------------------------------------
// MAIN DASHBOARD LAYOUT
// -----------------------------------------------------------------------

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState !== null) {
      setIsMinimized(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarMinimized', isMinimized.toString());
  }, [isMinimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = { id: messages.length + 1, text: inputMessage, isUser: true };
    setMessages([...messages, newMessage]);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I'm a simple AI assistant. In a real implementation, I would process your message and provide a helpful response.",
        isUser: false
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 text-slate-900 transition-colors dark:bg-[#16191F] dark:text-slate-50">
      <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="h-[73px]" aria-hidden="true" />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
        <Sidebar
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          messages={messages}
          setMessages={setMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant Button - Bottom Left */}
      <Link
        href="/ai-assistant"
        className="fixed left-4 sm:left-6 bottom-6 w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group z-50"
        title="Open AI Assistant"
      >
        <SparklesIcon className="w-6 sm:w-7 h-6 sm:h-7 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </Link>
    </div>
  );
}
