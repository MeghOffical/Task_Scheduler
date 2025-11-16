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
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
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
      window.location.href = '/login';
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
    <header className="w-full bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-40 transition-all">
      
      {/* Logo */}
      <Link href="/dashboard" className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
          viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          className="w-7 h-7 text-blue-600 dark:text-blue-400">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Z" />
        </svg>
        Plan-it
      </Link>


      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative notification-menu-container">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition relative"
          >
            <BellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Drop-down */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Notifications
                  </h3>

                  {(pendingTasks.length > 0 || missedTasks.length > 0) && (
                    <button onClick={clearAllNotifications}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded transition">
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Missed Tasks */}
              {missedTasks.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                    Missed Tasks ({missedTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {missedTasks.map((task) => (
                      <div key={task.id}
                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500 dark:border-red-400 relative group">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition">
                          <XMarkIcon className="w-4 h-4" />
                        </button>

                        <p className="text-sm font-medium text-red-900 dark:text-red-100">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-red-700 dark:text-red-300">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    Pending Tasks ({pendingTasks.length})
                  </h4>

                  <div className="space-y-2 mt-2">
                    {pendingTasks.map((task) => (
                      <div key={task.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500 dark:border-yellow-400 relative group">

                        <button onClick={() => dismissNotification(task.id)}
                          className="absolute top-2 right-2 text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 opacity-0 group-hover:opacity-100 transition">
                          <XMarkIcon className="w-4 h-4" />
                        </button>

                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingTasks.length === 0 && missedTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Dark / Light Mode Button */}
        <button onClick={toggleDarkMode}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? (
            <SunIcon className="w-6 h-6 text-yellow-400" />
          ) : (
            <MoonIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="relative profile-menu-container">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <UserCircleIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{userInfo?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userInfo?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
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
    { href: '/dashboard', icon: <HomeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />, label: 'Home' },
    { href: '/tasks', icon: <ClipboardDocumentListIcon className="w-6 h-6 text-green-600 dark:text-green-400" />, label: 'Tasks' },
    { href: '/pomodoro', icon: <FireIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />, label: 'Pomodoro' },
    { href: '/analytics', icon: <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />, label: 'Analytics' },
    { href: '/chatbot', icon: <CpuChipIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />, label: 'Chatbot' },
    { href: '/settings', icon: <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />, label: 'Settings' },
  ];

  return (
    <>
      <aside className="bg-white dark:bg-gray-800 w-64 h-full shadow-lg border-r border-gray-200 dark:border-gray-700 transition-colors flex flex-col">
        <nav className="py-8 px-3 flex-1 flex flex-col gap-1.5 overflow-y-auto">

          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 mx-1 rounded-xl text-gray-600 dark:text-gray-300 
              hover:bg-gray-100 dark:hover:bg-gray-700/50 transition 
              ${pathname === item.href ? 'bg-gray-900 text-white dark:text-white font-semibold shadow-md' : ''}`}>
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

        </nav>
      </aside>

      {/* AI Right Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl transform ${showAIPanel ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 border-l border-gray-300 dark:border-gray-700 z-50`}>
        
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
              <SparklesIcon className="w-5 h-5" />
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
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

      {/* Floating AI Button */}
      <button
        onClick={() => setShowAIPanel(true)}
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl hover:scale-110 transition"
      >
        <SparklesIcon className="w-8 h-8" />
      </button>
    </div>
  );
}
