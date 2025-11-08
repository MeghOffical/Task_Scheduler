import { useState } from 'react';
import { Task } from '@/types';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

type StatCardProps = Readonly<{
  icon: string;
  label: string;
  value: number;
  color: string;
}>;

export function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md p-6 flex items-center gap-4 transition-colors">
      <div className={`text-2xl p-3 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );
}

type TaskCardProps = Readonly<{
  task: Task;
  onComplete?: (taskId: string) => Promise<void>;
}>;

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    }
  };

  const handleComplete = async () => {
    if (!onComplete || task.status === 'completed' || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onComplete(task.id);
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium mb-1 text-gray-900 dark:text-gray-100">{task.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Due: {new Date(task.dueDate || '').toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyles(task.status)}`}>
            {task.status}
          </span>
          {task.status !== 'completed' && onComplete && (
            <button
              onClick={handleComplete}
              disabled={isUpdating}
              className={`ml-2 p-1 rounded-full transition-colors ${
                isUpdating 
                  ? 'bg-gray-200 dark:bg-gray-600 cursor-wait' 
                  : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50'
              }`}
              title="Mark as completed"
            >
              {isUpdating ? (
                <svg className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type PriorityItemProps = Readonly<{
  label: string;
  count: number;
  color: string;
}>;

export function PriorityItem({ label, count, color }: PriorityItemProps) {
  const colorMap = {
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className={`text-lg font-semibold ${colorMap[color as keyof typeof colorMap]}`}>
        {count}
      </span>
    </div>
  );
}