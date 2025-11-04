'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
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
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

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

      setRecentTasks(tasksData.slice(0, 5));
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
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'task-updated') {
        handleTaskUpdate();
      }
    };
    window.addEventListener('message', handleMessage);

    // Polling for updates every 10 seconds as a fallback
    const pollInterval = setInterval(() => {
      console.log('Polling for updates');
      fetchDashboardData();
    }, 10000);

    return () => {
      console.log('Cleaning up dashboard polling and event listeners');
      window.removeEventListener('task-updated', handleTaskUpdate);
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [fetchDashboardData]);

  if (loading && !stats.totalTasks) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="📋"
            label="Total Tasks"
            value={stats.totalTasks}
            color="blue"
          />
          <StatCard
            icon="⏳"
            label="Pending"
            value={stats.pendingTasks}
            color="yellow"
          />
          <StatCard
            icon="🔄"
            label="In Progress"
            value={stats.inProgressTasks}
            color="indigo"
          />
          <StatCard
            icon="✅"
            label="Completed"
            value={stats.completedTasks}
            color="green"
          />
          <StatCard
            icon="⚠️"
            label="Overdue"
            value={stats.overdueTasks}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No tasks available</p>
              ) : (
                recentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Task Priority Breakdown</h2>
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
    </DashboardLayout>
  );
}

