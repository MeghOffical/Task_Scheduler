'use client';

import React from 'react';
const { useState, useEffect } = React;
import PageWrapper from '@/components/page-wrapper';
import { createTask, updateTask, deleteTask } from '@/lib/tasks';

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
        await updateTask(editingTask.id, formData);
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <div className="flex gap-3 items-center">
              <div>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer">
                  <span>📥</span> {importing ? 'Importing…' : 'Import CSV'}
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>📊</span> Export CSV
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
          {/* Search and Filters */}
          <div className="glass-panel rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
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
            <div>
              <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 mb-1">
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
            <div>
              <label htmlFor="priorityFilter" className="block text-xs font-medium text-gray-700 mb-1">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dueFrom" className="block text-xs font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  id="dueFrom"
                  type="date"
                  value={dueFrom}
                  onChange={(e) => setDueFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="dueTo" className="block text-xs font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  id="dueTo"
                  type="date"
                  value={dueTo}
                  onChange={(e) => setDueTo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600 dark:border-gray-600 dark:bg-[#111827] dark:text-white"
                />
              </div>
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
                      className="text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    🗑️
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