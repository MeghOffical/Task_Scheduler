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
      return 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
    case 'medium':
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};

const getStatusClass = (status: Task['status']): string => {
  switch (status) {
    case 'completed':
      return 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800';
    case 'in-progress':
      return 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    case 'pending':
      return 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
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

  const exportToCSV = () => {
    // Header row
    const csvHeader = ['Title,Description,Due Date,Time (24h),Status,Priority'];
    
    // Convert tasks to CSV format
    const csvRows = tasks.map(task => {
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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Tasks
            </h1>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 font-semibold overflow-hidden"
              >
                <span className="relative z-10">📊</span>
                <span className="relative z-10">Export CSV</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 font-semibold overflow-hidden"
              >
                <span className="relative z-10">Add Task</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </div>
          </div>
          {/* Search and Filters */}
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl p-5 border border-white/20 dark:border-slate-700/50 shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-3 py-2.5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="backdrop-blur-xl bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-lg">{error}</div>
        )}

        {/* Derived filtered tasks */}
        {(() => {
          const normalizedQuery = searchQuery.trim().toLowerCase();
          const filtered = tasks.filter((t) => {
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
              <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Showing {filtered.length} of {tasks.length} tasks
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((task: Task) => (
            <div
              key={task.id}
              className="group relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-2xl overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 group-hover:dark:from-blue-400 group-hover:dark:via-purple-400 group-hover:dark:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {task.title}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-600 dark:text-yellow-400 hover:from-yellow-200 hover:to-amber-200 dark:hover:from-yellow-800/40 dark:hover:to-amber-800/40 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-600 dark:text-red-400 hover:from-red-200 hover:to-rose-200 dark:hover:from-red-800/40 dark:hover:to-rose-800/40 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="relative text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{task.description}</p>

              <div className="relative flex justify-between items-center text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Due: {new Date(task.dueDate || '').toLocaleDateString()}
                  </span>
                  {(task.startTime || task.endTime) && (
                    <span className="text-gray-500 dark:text-gray-500 text-xs">
                      {task.startTime && `Start: ${task.startTime}`}
                      {task.startTime && task.endTime && ' | '}
                      {task.endTime && `End: ${task.endTime}`}
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getPriorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getStatusClass(task.status)}`}
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 rounded-2xl p-7 w-full max-w-md transition-all shadow-2xl border border-white/20 dark:border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
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
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                  className="group flex-1 px-4 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="group relative flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">{editingTask ? 'Update Task' : 'Add Task'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}