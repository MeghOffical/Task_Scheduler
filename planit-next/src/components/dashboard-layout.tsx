'use client';

import { useState, useEffect } from 'react';
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
} from "@heroicons/react/24/outline";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
}

const Header = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string } | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [missedTasks, setMissedTasks] = useState<Task[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

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
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.replace('/');
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
    <header className="w-full sticky top-0 z-40 bg-white/90 border-b border-slate-200 backdrop-blur flex justify-between items-center px-6 py-3 dark:bg-[#11141A]/95 dark:border-white/5">
      
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-[#E6E9EF]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
          viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          className="w-5 h-5 text-[#3B82F6]">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Z" />
        </svg>
        <span className="uppercase tracking-[0.16em] text-xs text-[#8B929D]">Plan-it</span>
      </Link>


      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative notification-menu-container">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100"
          >
            <BellIcon className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-medium text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Drop-down */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl bg-[#11141A] border border-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex justify-between items-center">
                  <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8B929D]">
                    <BellIcon className="w-4 h-4 text-[#3B82F6]" />
                    Notifications
                  </h3>

                  {(pendingTasks.length > 0 || missedTasks.length > 0) && (
                    <button onClick={clearAllNotifications}
                      className="text-[11px] text-[#8B929D] hover:text-red-400 px-2 py-1 rounded transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Missed Tasks */}
              {missedTasks.length > 0 && (
                <div className="border-b border-white/5 px-4 py-3">
                  <h4 className="flex items-center gap-2 text-xs font-medium text-red-400">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Missed Tasks ({missedTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {missedTasks.map((task) => (
                      <div key={task.id}
                        className="relative rounded-lg bg-[#151922] px-3 py-2 text-xs text-[#E6E9EF]">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                          <XMarkIcon className="w-3 h-3" />
                        </button>

                        <p className="text-[13px] font-medium text-[#E6E9EF]">{task.title}</p>
                        {task.dueDate && (
                          <p className="mt-0.5 text-[11px] text-[#8B929D]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="px-4 py-3">
                  <h4 className="flex items-center gap-2 text-xs font-medium text-[#E6E9EF]">
                    <ClockIcon className="w-4 h-4 text-slate-500" />
                    Pending Tasks ({pendingTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {pendingTasks.map((task) => (
                      <div key={task.id}
                        className="relative rounded-lg bg-[#151922] px-3 py-2 text-xs text-[#E6E9EF]">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                          <XMarkIcon className="w-3 h-3" />
                        </button>

                        <p className="text-[13px] font-medium text-[#E6E9EF]">{task.title}</p>
                        {task.dueDate && (
                          <p className="mt-0.5 text-[11px] text-[#8B929D]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingTasks.length === 0 && missedTasks.length === 0 && (
                <div className="px-4 py-6 text-center text-[12px] text-[#8B929D]">No notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Dark / Light Mode Button */}
        <button onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100"
          title={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="relative profile-menu-container">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100">
            <UserCircleIcon className="w-6 h-6" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-white/5 bg-[#11141A] shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-50">
              <div className="border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="h-9 w-9 text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-[#E6E9EF]">{userInfo?.username}</p>
                    <p className="text-xs text-[#8B929D]">{userInfo?.email}</p>
                  </div>
                </div>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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
}

export const Sidebar = ({
  showAIPanel,
  setShowAIPanel,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  handleSendMessage
}: SidebarProps) => {

  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: <HomeIcon className="w-4 h-4" />, label: 'Home' },
    { href: '/tasks', icon: <ClipboardDocumentListIcon className="w-4 h-4" />, label: 'Tasks' },
    { href: '/pomodoro', icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.5 6.5c.5-1 1.8-2 3.5-1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15.5 6.5c-.5-1-1.8-2-3.5-1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M12 9.5v1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M16 8c.6-.3 1-1 1-1.6 0-.9-.9-1.6-1.8-1.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </svg>
    ), label: 'Pomodoro' },
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
      <aside className="w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col dark:bg-[#0B0E12] dark:border-white/5">
        <nav className="py-6 px-2 flex-1 flex flex-col gap-1 overflow-y-auto">

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors
                ${isActive
                  ? 'bg-primary-100 text-primary-800 shadow-sm ring-1 ring-primary-300 dark:bg-[#151922] dark:text-[#E6E9EF] dark:ring-0'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800 dark:text-slate-400 dark:hover:bg-[#151922] dark:hover:text-slate-100'}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[13px] transition-colors
                  ${isActive
                    ? 'border-primary-400 bg-primary-50 text-primary-600 dark:border-[#3B82F6] dark:text-[#3B82F6] dark:bg-transparent'
                    : 'border-slate-300 text-slate-500 group-hover:border-primary-300 group-hover:text-primary-600 dark:border-[#1F2430]'}`}
                >
                  {item.icon}
                </span>
                <span className="font-medium tracking-tight">{item.label}</span>
              </Link>
            );
          })}

        </nav>
      </aside>

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
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-[#05070B] dark:text-slate-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          messages={messages}
          setMessages={setMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant Button - Bottom Left */}
      <Link
        href="/ai-assistant"
        className="fixed left-6 bottom-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group z-50"
        title="Open AI Assistant"
      >
        <svg className="w-7 h-7 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          <path d="M9.5 15.2c1 0.5 2.5 0.5 3.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </Link>
    </div>
  );
}
