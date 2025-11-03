'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Task } from '@/types';

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

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then((res) => res.json()),
      fetch('/api/tasks/stats').then((res) => res.json()),
    ])
      .then(([tasksData, statsData]) => {
        setRecentTasks(tasksData.slice(0, 5));
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  if (loading) {
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`text-2xl p-3 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1">{task.title}</h3>
          <p className="text-sm text-gray-500">
            Due: {new Date(task.dueDate || '').toLocaleDateString()}
          </p>
        </div>
        <div className="space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-700'
              : task.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            task.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : task.status === 'in-progress'
              ? 'bg-blue-100 text-blue-700'
              : task.status === 'overdue'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {task.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function PriorityItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colorMap = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <span className="text-gray-600">{label}</span>
      <span className={`text-lg font-semibold ${colorMap[color as keyof typeof colorMap]}`}>
        {count}
      </span>
    </div>
  );
}