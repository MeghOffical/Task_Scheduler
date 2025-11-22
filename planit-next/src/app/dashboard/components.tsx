import { useState } from 'react';
import { Task } from '@/types';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

type StatCardProps = Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}>;

export function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/10 dark:from-blue-400/10 dark:to-blue-600/10 text-blue-600 dark:text-blue-400',
    green: 'from-green-500/10 to-green-600/10 dark:from-green-400/10 dark:to-green-600/10 text-green-600 dark:text-green-400',
    yellow: 'from-yellow-500/10 to-yellow-600/10 dark:from-yellow-400/10 dark:to-yellow-600/10 text-yellow-600 dark:text-yellow-400',
    red: 'from-red-500/10 to-red-600/10 dark:from-red-400/10 dark:to-red-600/10 text-red-600 dark:text-red-400',
    indigo: 'from-indigo-500/10 to-indigo-600/10 dark:from-indigo-400/10 dark:to-indigo-600/10 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="relative glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} opacity-30`} />
      <div className="relative flex items-center gap-4">
        <div className={`text-2xl p-3 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-md ${colorMap[color as keyof typeof colorMap]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

type TaskCardProps = Readonly<{
  task: Task;
  onComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}>;

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
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
    <div className="group glass-panel p-4 rounded-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 truncate">{task.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getPriorityStyles(task.priority)}`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {task.priority}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusStyles(task.status)}`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-900 dark:text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </p>
            {(task.startTime || task.endTime) && (
              <p className="text-xs text-gray-800 dark:text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.startTime && `Start: ${task.startTime}`}
                {task.startTime && task.endTime && ' | '}
                {task.endTime && `End: ${task.endTime}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {task.status !== 'completed' && onComplete && (
            <button
              onClick={handleComplete}
              disabled={isUpdating}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                isUpdating 
                  ? 'bg-gray-100 dark:bg-gray-700 cursor-wait' 
                  : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/50 hover:shadow-md'
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
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                }
              }}
              className="flex-shrink-0 p-2 rounded-lg transition-all duration-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50 hover:shadow-md text-red-600 dark:text-red-400"
              title="Delete task"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
    red: 'from-red-500/10 to-red-600/10 dark:from-red-400/10 dark:to-red-600/10 text-red-600 dark:text-red-400',
    yellow: 'from-yellow-500/10 to-yellow-600/10 dark:from-yellow-400/10 dark:to-yellow-600/10 text-yellow-600 dark:text-yellow-400',
    blue: 'from-blue-500/10 to-blue-600/10 dark:from-blue-400/10 dark:to-blue-600/10 text-blue-600 dark:text-blue-400',
  };

  const gaugeColor = {
    red: '#ef4444',
    yellow: '#eab308',
    blue: '#3b82f6',
  };

  return (
    <div className="relative group">
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative flex justify-between items-center p-4 glass-panel rounded-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm ${colorMap[color as keyof typeof colorMap]}`}>
            {/* Gauge/Speedometer Icon */}
            <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer circle */}
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
              
              {/* Gauge background arc */}
              <path
                d="M 15 50 A 35 35 0 0 1 85 50"
                stroke="currentColor"
                strokeWidth="8"
                opacity="0.2"
                strokeLinecap="round"
              />
              
              {/* Active gauge arc based on priority */}
              {color === 'red' && (
                <path
                  d="M 15 50 A 35 35 0 0 1 78 28"
                  stroke={gaugeColor.red}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              )}
              {color === 'yellow' && (
                <path
                  d="M 15 50 A 35 35 0 0 1 50 16"
                  stroke={gaugeColor.yellow}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              )}
              {color === 'blue' && (
                <path
                  d="M 15 50 A 35 35 0 0 1 32 25"
                  stroke={gaugeColor.blue}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              )}
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="6" fill="currentColor"/>
              
              {/* Needle */}
              {color === 'red' && (
                <line x1="50" y1="50" x2="70" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              )}
              {color === 'yellow' && (
                <line x1="50" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              )}
              {color === 'blue' && (
                <line x1="50" y1="50" x2="35" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              )}
            </svg>
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-300">{label}</span>
        </div>
        <span className={`text-xl font-bold ${colorMap[color as keyof typeof colorMap]}`}>
          {count}
        </span>
      </div>
    </div>
  );
}