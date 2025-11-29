'use client';

import React from 'react';
const { useState, useEffect } = React;
import PageWrapper from '@/components/page-wrapper';
import { createTask, updateTask, deleteTask } from '@/lib/tasks';

// Simple SVG icons to replace heroicons
const DocumentArrowDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ArrowDownTrayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);


interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  startTime?: string;
  endTime?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  startTime?: string;
  endTime?: string;
}

const getPriorityClass = (priority: Task['priority']): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    case 'low':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};

const getStatusClass = (status: Task['status']): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'in-progress':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all');
  const [dueFrom, setDueFrom] = useState<string>('');
  const [dueTo, setDueTo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingTask) {
        const previousStatus = editingTask.status;

        await updateTask(editingTask.id, formData);

        // Show immediate toast *if* we can infer an on-time completion or missed deadline
        const newStatus = formData.status;
  const hasDueDate = !!formData.dueDate;
        const now = new Date();
        const due = hasDueDate ? new Date(formData.dueDate) : null;

        if (hasDueDate && due && !isNaN(due.getTime())) {
          // Only consider if due date wasn't removed
          if (newStatus === 'completed' && previousStatus !== 'completed' && now <= due) {
            (window as any).showPointsToast?.(
              'Task completed on time! You earned +10 points.',
              10
            );
          } else if (newStatus === 'pending' && previousStatus !== 'pending' && now > due) {
            // If you mark a past-due task as pending, treat it as missed deadline in UI
            (window as any).showPointsToast?.(
              'Deadline missed. You lost 5 points.',
              -5
            );
          }
        }
      } else {
        await createTask(formData);
      }
      await loadTasks();
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save task';
      setError(errorMessage);
      console.error('Error saving task:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
    });
    setEditingTask(null);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      startTime: task.startTime || '',
      endTime: task.endTime || '',
    });
    setShowModal(true);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tasks/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || 'Failed to import tasks from CSV';
        throw new Error(message);
      }

      await loadTasks();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import tasks from CSV';
      setError(errorMessage);
      console.error('Error importing tasks from CSV:', err);
    } finally {
      setImporting(false);
      // Reset the input value so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const exportToCSV = () => {
    // Header row
    const csvHeader = ['Title,Description,Due Date,Time (24h),Status,Priority'];
    
    // Convert tasks to CSV format
  const csvRows = tasks.map((task: Task) => {
      const formattedDate = new Date(task.dueDate).toLocaleDateString();
      // Escape commas and quotes in text fields to handle CSV properly
      const escapedTitle = task.title.replace(/"/g, '""');
      const escapedDescription = (task.description || '').replace(/"/g, '""');
      const timeRange = task.startTime && task.endTime 
        ? `${task.startTime} - ${task.endTime}`
        : task.startTime || task.endTime || '';
      
      return [
        `"${escapedTitle}"`,
        `"${escapedDescription}"`,
        `"${formattedDate}"`,
        `"${timeRange}"`,
        `"${task.status}"`,
        `"${task.priority}"`
      ].join(',');
    });

    // Combine header and rows
    const csvContent = [...csvHeader, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <div className="flex gap-2 items-center">
              <div>
                <label className="flex px-3 sm:px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors items-center justify-center gap-2 cursor-pointer text-sm min-h-[40px] sm:min-h-auto">
                  <DocumentArrowDownIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Import CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
              </div>
              <button
                onClick={exportToCSV}
                className="flex px-3 sm:px-4 py-2 bg-cyan-600 dark:bg-cyan-700 text-white rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-colors items-center gap-2 text-sm"
              >
                <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex px-3 sm:px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors items-center gap-2 text-sm"
              >
                <PlusIcon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>
          </div>
          {/* Search and Filters */}
          <div className="glass-panel rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-xs font-bold text-gray-700 dark:text-white mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by title or description…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="statusFilter" className="block text-xs font-bold text-gray-700 dark:text-white mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="priorityFilter" className="block text-xs font-bold text-gray-700 dark:text-white mb-1">
                Priority
              </label>
              <select
                id="priorityFilter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="dueFrom" className="block text-xs font-bold text-gray-700 dark:text-white mb-1">
                From
              </label>
              <input
                id="dueFrom"
                type="date"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white dark:text-base"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="dueTo" className="block text-xs font-bold text-gray-700 dark:text-white mb-1">
                To
              </label>
              <input
                id="dueTo"
                type="date"
                value={dueTo}
                onChange={(e) => setDueTo(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white dark:text-base"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">{error}</div>
        )}

        {/* Derived filtered tasks */}
        {(() => {
          const normalizedQuery = searchQuery.trim().toLowerCase();
          const filtered = tasks.filter((t: Task) => {
            // Search
            const matchesQuery =
              !normalizedQuery ||
              t.title.toLowerCase().includes(normalizedQuery) ||
              (t.description || '').toLowerCase().includes(normalizedQuery);
            if (!matchesQuery) return false;
            // Status
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            // Priority
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
            // Due date range
            if (dueFrom) {
              const fromTs = new Date(dueFrom).setHours(0, 0, 0, 0);
              const dueTs = new Date(t.dueDate || '').setHours(0, 0, 0, 0);
              if (isFinite(fromTs) && isFinite(dueTs) && dueTs < fromTs) return false;
            }
            if (dueTo) {
              const toTs = new Date(dueTo).setHours(23, 59, 59, 999);
              const dueTs = new Date(t.dueDate || '').getTime();
              if (isFinite(toTs) && isFinite(dueTs) && dueTs > toTs) return false;
            }
            return true;
          });
          return (
            <>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filtered.length} of {tasks.length} tasks
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((task: Task) => (
            <div
              key={task.id}
              className="glass-panel rounded-xl p-6 space-y-4 transition-all"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{task.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(task)}
                      className="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm">{task.description}</p>

              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    Due: {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) 
                      ? new Date(task.dueDate).toLocaleDateString() 
                      : 'No due date set'}
                  </span>
                  {(task.startTime || task.endTime) && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {task.startTime && `Start: ${task.startTime}`}
                      {task.startTime && task.endTime && ' | '}
                      {task.endTime && `End: ${task.endTime}`}
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusClass(task.status)}`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-xl p-7 w-full max-w-md transition-all">
            <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e: { target: { value: string } }) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: { target: { value: string } }) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all resize-none"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e: { target: { value: string } }) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e: { target: { value: string } }) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'pending' | 'in-progress' | 'completed',
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e: { target: { value: string } }) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Start Time (24h)
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e: { target: { value: string } }) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                    step="60"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                    End Time (24h)
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e: { target: { value: string } }) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                    step="60"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-7 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-sm"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}