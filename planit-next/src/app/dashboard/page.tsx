'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import PageWrapper from '@/components/page-wrapper';
import { Task } from '@/types';
import { StatCard, TaskCard, PriorityItem } from './components';

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

// Define the LoadingSpinner component outside the DashboardPage component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

export default function DashboardPage() {
    const [taskPage, setTaskPage] = useState(1);
  const [sortOption, setSortOption] = useState<'default' | 'priority' | 'date'>('default');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const [tasksResponse, statsResponse] = await Promise.all([
        fetch(`/api/tasks?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/tasks/stats?t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (!tasksResponse.ok) {
        throw new Error(`Tasks fetch failed: ${tasksResponse.statusText}`);
      }
      if (!statsResponse.ok) {
        throw new Error(`Stats fetch failed: ${statsResponse.statusText}`);
      }

      const [tasksData, statsData] = await Promise.all([
        tasksResponse.json(),
        statsResponse.json()
      ]);

      console.log('Fetched tasks:', tasksData);
      console.log('Fetched stats:', statsData);

      setTasks(tasksData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setLastUpdated(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  // Initial load and listen for task updates
  useEffect(() => {
    console.log('Setting up dashboard data fetch');
    fetchDashboardData();

    // Listen for task update events from other pages/components
    const handleTaskUpdate = () => {
      console.log('Task update event received, refreshing dashboard');
      fetchDashboardData();
    };

    // Listen to custom event
    window.addEventListener('task-updated', handleTaskUpdate);
    
    // Listen to postMessage (for cross-page communication)
    const handleMessage = ({ data }: MessageEvent) => {
    if (data?.type !== 'task-updated') return;

    handleTaskUpdate();
  };
    window.addEventListener('message', handleMessage);

    // Polling for updates every 10 seconds as a fallback
    // Define configuration constant for better readability
const POLLING_DELAY_MS = 10_000;

const performPolling = () => {
  console.log('Polling for updates');
  fetchDashboardData();
};

// Initialize interval with named reference
const pollInterval = setInterval(performPolling, POLLING_DELAY_MS);

    return () => {
      console.log('Cleaning up dashboard polling and event listeners');
      window.removeEventListener('task-updated', handleTaskUpdate);
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    setTaskPage(1);
  }, [sortOption]);

  const sortedTasks = useMemo(() => {
    const byStatus = { pending: 1, 'in-progress': 2, completed: 3 } as const;
    const byPriority = { high: 1, medium: 2, low: 3 } as const;

    const normalized = [...tasks];

    if (sortOption === 'priority') {
      return normalized.sort((a, b) => {
        const priorityA = byPriority[a.priority as keyof typeof byPriority] ?? 99;
        const priorityB = byPriority[b.priority as keyof typeof byPriority] ?? 99;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const statusA = byStatus[a.status as keyof typeof byStatus] ?? 99;
        const statusB = byStatus[b.status as keyof typeof byStatus] ?? 99;
        if (statusA !== statusB) {
          return statusA - statusB;
        }

        return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      });
    }

    if (sortOption === 'date') {
      return normalized.sort((a, b) => {
        const dateA = new Date(a.updatedAt ?? a.createdAt ?? a.dueDate ?? 0).getTime();
        const dateB = new Date(b.updatedAt ?? b.createdAt ?? b.dueDate ?? 0).getTime();
        return dateB - dateA;
      });
    }

    return normalized.sort((a, b) => {
      const statusA = byStatus[a.status as keyof typeof byStatus] ?? 99;
      const statusB = byStatus[b.status as keyof typeof byStatus] ?? 99;
      if (statusA === statusB) {
        return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      }
      return statusA - statusB;
    });
  }, [tasks, sortOption]);

  const tasksPerPage = 5;
  const totalSortedTasks = sortedTasks.length;
  const paginatedTasks = sortedTasks.slice((taskPage - 1) * tasksPerPage, taskPage * tasksPerPage);
  const startIndex = totalSortedTasks ? (taskPage - 1) * tasksPerPage + 1 : 0;
  const endIndex = totalSortedTasks ? Math.min(taskPage * tasksPerPage, totalSortedTasks) : 0;

  if (loading && !stats.totalTasks) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back! Here&apos;s your task overview.</p>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {lastUpdated && <>Last updated: {lastUpdated}</>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              label="Total Tasks"
              value={stats.totalTasks}
              color="blue"
            />
            <StatCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Pending"
              value={stats.pendingTasks}
              color="yellow"
            />
            <StatCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              label="In Progress"
              value={stats.inProgressTasks}
              color="indigo"
            />
            <StatCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Completed"
              value={stats.completedTasks}
              color="green"
            />
            <StatCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              label="Overdue"
              value={stats.overdueTasks}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative glass-panel rounded-2xl p-6">
                <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Tasks</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-300">
                    <span className="hidden sm:inline">
                      {totalSortedTasks ? `Showing ${startIndex}–${endIndex} of ${totalSortedTasks} tasks` : 'No tasks'}
                    </span>
                    <label className="flex flex-col gap-1">
                      <span className="text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Sort by</span>
                      <select
                        value={sortOption}
                        onChange={(event) => setSortOption(event.target.value as 'default' | 'priority' | 'date')}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="default">Default</option>
                        <option value="priority">Priority (High → Low)</option>
                        <option value="date">Date (Newest)</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  {paginatedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-gray-400">
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>No tasks available</p>
                      <p className="text-sm mt-1">Start by creating your first task!</p>
                    </div>
                  ) : (
                    paginatedTasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onComplete={async (taskId) => {
                          try {
                            await fetch(`/api/tasks/${taskId}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ status: 'completed' }),
                            });
                            fetchDashboardData();
                          } catch (error) {
                            console.error('Failed to complete task:', error);
                            throw error;
                          }
                        }}
                        onDelete={async (taskId) => {
                          try {
                            await fetch(`/api/tasks/${taskId}`, {
                              method: 'DELETE',
                            });
                            fetchDashboardData();
                          } catch (error) {
                            console.error('Failed to delete task:', error);
                            throw error;
                          }
                        }}
                      />
                    ))
                  )}
                </div>
                {/* Pagination Controls */}
                {totalSortedTasks > tasksPerPage && (
                  <div className="flex justify-center mt-4 space-x-2">
                    <button
                      className={`px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${taskPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setTaskPage(taskPage - 1)}
                      disabled={taskPage === 1}
                    >
                      Previous
                    </button>
                    <button
                      className={`px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${taskPage === Math.ceil(totalSortedTasks / tasksPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setTaskPage(taskPage + 1)}
                      disabled={taskPage === Math.ceil(totalSortedTasks / tasksPerPage)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="sticky top-6 space-y-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative glass-panel rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Task Priority Breakdown</h2>
                    <div className="space-y-4">
                      <PriorityItem
                        label="High Priority"
                        count={stats.highPriority}
                        color="red"
                      />
                      <PriorityItem
                        label="Medium Priority"
                        count={stats.mediumPriority}
                        color="yellow"
                      />
                      <PriorityItem
                        label="Low Priority"
                        count={stats.lowPriority}
                        color="blue"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
  );
}

