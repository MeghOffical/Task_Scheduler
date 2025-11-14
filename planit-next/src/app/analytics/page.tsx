'use client';

import { useEffect, useRef, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate?: string;
  createdAt?: string;
};

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const priorityChartRef = useRef<HTMLCanvasElement | null>(null);
  const productivityChartRef = useRef<HTMLCanvasElement | null>(null);
  const pomodoroChartRef = useRef<HTMLCanvasElement | null>(null);

  const chartsRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setTasks(data as Task[]);
      } catch (e) {
        // noop
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    // Load Chart.js from CDN
    let isCancelled = false;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
    script.async = true;
    script.onload = () => {
      if (isCancelled) return;
      renderCharts();
    };

    // If Chart already present, just render
    if ((window as any).Chart) {
      renderCharts();
    } else {
      document.body.appendChild(script);
    }

    const handleThemeChange = () => {
      renderCharts();
    };
    window.addEventListener('storage', handleThemeChange);

    return () => {
      isCancelled = true;
      window.removeEventListener('storage', handleThemeChange);
      // Destroy charts on unmount
      Object.values(chartsRef.current).forEach((chart: any) => {
        try { chart?.destroy?.(); } catch {}
      });
      chartsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const applyThemeDefaults = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const Chart = (window as any).Chart;
    if (!Chart) return;
    Chart.defaults.color = isDark ? '#9ca3af' : '#e5e7eb';
    Chart.defaults.borderColor = isDark ? '#404040' : '#4b5563';
    // Grid colors are set per chart in the options, not as a global default
  };

  const renderCharts = () => {
    const Chart = (window as any).Chart;
    if (!Chart) return;

    // Destroy existing
    Object.values(chartsRef.current).forEach((chart: any) => {
      try { chart?.destroy?.(); } catch {}
    });
    chartsRef.current = {};

    applyThemeDefaults();

    // Status chart
    const statusCounts = {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => isTaskOverdue(t)).length,
    };

    if (statusChartRef.current) {
      chartsRef.current.status = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'In Progress', 'Completed', 'Overdue'],
          datasets: [{
            data: [statusCounts.pending, statusCounts.inProgress, statusCounts.completed, statusCounts.overdue],
            backgroundColor: ['#f59e0b', '#0ea5e9', '#10b981', '#ef4444'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'bottom',
              labels: {
                color: '#e5e7eb',
                font: { size: 12 }
              }
            } 
          },
        },
      });
    }

    // Priority chart
    const priorityCounts = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    if (priorityChartRef.current) {
      chartsRef.current.priority = new Chart(priorityChartRef.current, {
        type: 'bar',
        data: {
          labels: ['High', 'Medium', 'Low'],
          datasets: [{
            label: 'Tasks',
            data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { 
                stepSize: 1,
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            },
            x: {
              ticks: {
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            }
          },
        },
      });
    }

    // Simple productivity chart (last 7 days completed tasks)
    const days: string[] = [];
    const completedByDay: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      days.push(`${months[date.getMonth()]} ${date.getDate()}`);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const completed = tasks.filter(t => t.status === 'completed')
        .filter(() => true) // No completedDate available; display cumulative trend placeholder
        .length;
      completedByDay.push(completed);
    }

    if (productivityChartRef.current) {
      chartsRef.current.productivity = new Chart(productivityChartRef.current, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: 'Completed Tasks',
            data: completedByDay,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { 
                stepSize: 1,
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            },
            x: {
              ticks: {
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            }
          },
        },
      });
    }

    // Placeholder Pomodoro chart (no API provided yet)
    if (pomodoroChartRef.current) {
      chartsRef.current.pomodoro = new Chart(pomodoroChartRef.current, {
        type: 'line',
        data: {
          labels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
          datasets: [{
            label: 'Sessions',
            data: [0,0,0,0,0,0,0],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { 
                stepSize: 1,
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            },
            x: {
              ticks: {
                color: '#e5e7eb'
              },
              grid: {
                color: '#4b5563'
              }
            }
          },
        },
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Tasks by Status</h2>
          <div className="relative h-72">
            <canvas ref={statusChartRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Tasks by Priority</h2>
          <div className="relative h-72">
            <canvas ref={priorityChartRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Pomodoro Sessions This Week</h2>
          <div className="relative h-72">
            <canvas ref={pomodoroChartRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Productivity Trend</h2>
          <div className="relative h-72">
            <canvas ref={productivityChartRef} />
          </div>
        </div>
      </div>
    </div>
  );
}


