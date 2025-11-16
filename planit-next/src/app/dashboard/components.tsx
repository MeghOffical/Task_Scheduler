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
    blue: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bg: 'from-blue-500/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-600/20',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
      shadow: 'shadow-blue-500/20 dark:shadow-blue-500/10'
    },
    green: {
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      bg: 'from-green-500/20 to-green-600/20 dark:from-green-400/20 dark:to-green-600/20',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40',
      shadow: 'shadow-green-500/20 dark:shadow-green-500/10'
    },
    yellow: {
      gradient: 'from-yellow-500 via-amber-600 to-orange-600',
      bg: 'from-yellow-500/20 to-yellow-600/20 dark:from-yellow-400/20 dark:to-yellow-600/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40',
      shadow: 'shadow-yellow-500/20 dark:shadow-yellow-500/10'
    },
    red: {
      gradient: 'from-red-500 via-rose-600 to-pink-600',
      bg: 'from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-600/20',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40',
      shadow: 'shadow-red-500/20 dark:shadow-red-500/10'
    },
    indigo: {
      gradient: 'from-indigo-500 via-purple-600 to-violet-600',
      bg: 'from-indigo-500/20 to-indigo-600/20 dark:from-indigo-400/20 dark:to-indigo-600/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40',
      shadow: 'shadow-indigo-500/20 dark:shadow-indigo-500/10'
    },
  };

  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;

  return (
    <div className="group relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-white/20 dark:border-slate-700/50 overflow-hidden">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative flex items-center gap-4">
        <div className={`relative p-4 rounded-xl ${colors.iconBg} shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
          <div className={`${colors.text} relative z-10`}>
            {icon}
          </div>
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity`} />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">
            {value}
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">{label}</div>
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
    <div className="group relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
            {task.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${getPriorityStyles(task.priority)}`}>
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {task.priority}
            </span>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${getStatusStyles(task.status)}`}>
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center space-x-2 relative z-10">
          {task.status !== 'completed' && onComplete && (
            <button
              onClick={handleComplete}
              disabled={isUpdating}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 ${
                isUpdating 
                  ? 'bg-gray-100 dark:bg-gray-700 cursor-wait' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 dark:hover:from-green-800/50 dark:hover:to-emerald-800/50 hover:shadow-lg hover:shadow-green-500/30 hover:scale-110 active:scale-95 border border-green-200/50 dark:border-green-700/50'
              }`}
              title="Mark as completed"
            >
              {isUpdating ? (
                <svg className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
              className="flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 dark:hover:from-red-800/50 dark:hover:to-rose-800/50 hover:shadow-lg hover:shadow-red-500/30 hover:scale-110 active:scale-95 border border-red-200/50 dark:border-red-700/50 text-red-600 dark:text-red-400"
              title="Delete task"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
    red: {
      bg: 'from-red-500/20 to-red-600/20 dark:from-red-400/20 dark:to-red-600/20',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40',
      gradient: 'from-red-500 via-rose-600 to-pink-600',
    },
    yellow: {
      bg: 'from-yellow-500/20 to-yellow-600/20 dark:from-yellow-400/20 dark:to-yellow-600/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40',
      gradient: 'from-yellow-500 via-amber-600 to-orange-600',
    },
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-600/20',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
    },
  };

  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;

  return (
    <div className="relative group">
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`} />
      <div className="relative flex justify-between items-center p-5 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="flex items-center space-x-3 relative z-10">
          <div className={`p-3 rounded-xl ${colors.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <div className={`${colors.text} relative z-10`}>
              {color === 'red' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {color === 'yellow' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {color === 'blue' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
            </div>
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity`} />
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 dark:group-hover:from-gray-100 dark:group-hover:to-gray-300 transition-all duration-300">
            {label}
          </span>
        </div>
        <span className={`text-2xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 relative z-10`}>
          {count}
        </span>
      </div>
    </div>
  );
}