'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
          // Check if task is missed/overdue (dueDate < today AND status !== 'completed')
          let isMissed = false;
          if (task.dueDate && task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < now) {
              missed.push(task);
              isMissed = true;
            }
          }

          // Check if task is pending (status is 'pending' AND not already in missed)
          if (task.status === 'pending' && !isMissed) {
            pending.push(task);
          }
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

    // Fetch user info and notifications
    fetchUserInfo();
    fetchNotifications();
  }, []);

  // Close menus when clicking outside
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

  // Listen for task updates to refresh notifications
  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('task-updated', handleTaskUpdate);
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'task-updated') {
        handleTaskUpdate();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('task-updated', handleTaskUpdate);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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
    <header className="w-full bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center transition-colors sticky top-0 z-40">
      <Link href="/dashboard" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
        Plan-it
      </Link>
      <div className="flex items-center gap-4">
        {/* Notifications Menu */}
        <div className="relative notification-menu-container">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                fetchNotifications(); // Refresh notifications when opening
              }
            }}
            className="text-xl cursor-pointer hover:opacity-80 transition-opacity relative"
            title="Notifications"
          >
            🔔
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {notificationCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {/* Missed/Overdue Tasks */}
                {missedTasks.length > 0 && (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <span>⚠️</span> Missed Tasks ({missedTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {missedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500 dark:border-red-400"
                        >
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                      <span>⏳</span> Pending Tasks ({pendingTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500 dark:border-yellow-400"
                        >
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No notifications */}
                {pendingTasks.length === 0 && missedTasks.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notifications
                    </p>
                  </div>
                )}
              </div>
            </div>
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
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/tasks', icon: '📋', label: 'Tasks' },
    { href: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
    { href: '/chatbot', icon: '🤖', label: 'Chatbot' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <aside className="bg-white dark:bg-gray-800 w-64 h-full shadow-sm transition-colors flex flex-col">
        <nav className="py-6 flex-1 flex flex-col gap-2 overflow-y-auto">
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

      {/* AI Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-lg transform ${showAIPanel ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-40 border-l border-gray-200 dark:border-gray-700`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            <button
              onClick={() => setShowAIPanel(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isUser 
                      ? 'bg-gray-100 dark:bg-gray-700 ml-8' 
                      : 'bg-blue-50 dark:bg-blue-900/20 mr-8'
                  }`}
                >
                  <p className={`text-sm ${
                    message.isUser 
                      ? 'text-gray-800 dark:text-gray-200' 
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {message.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
      {showAIPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowAIPanel(false)}
        />
      )}
    </>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessage = { id: messages.length + 1, text: inputMessage, isUser: true };
    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        id: messages.length + 2, 
        text: "I'm a simple AI assistant. In a real implementation, I would process your message and provide a helpful response.", 
        isUser: false 
      };
      setMessages((prev: Array<{id: number; text: string; isUser: boolean}>) => [...prev, aiResponse]);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
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
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating AI Button */}
      <button
        onClick={() => setShowAIPanel(true)}
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center z-30 transition-transform hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <span className="text-2xl">🤖</span>
      </button>
    </div>
  );
}