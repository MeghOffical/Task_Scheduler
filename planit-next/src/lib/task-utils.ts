/**
 * Task utility functions for the planit application
 */

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: number;
}

export function formatTaskTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return '';
  }
  const trimmed = title.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function calculateTaskPriority(dueDate: Date, importance: number): number {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) {
    return 10; // Overdue
  }
  
  if (daysUntilDue <= 1) {
    return 8 + Math.min(importance, 2); // Due today/tomorrow
  }
  
  if (daysUntilDue <= 7) {
    return 5 + Math.min(importance, 4); // Due this week
  }
  
  return importance; // Due later
}

export function getTaskStatusLabel(status: Task['status']): string {
  const labels: Record<Task['status'], string> = {
    'pending': 'Pending',
    'in-progress': 'In Progress',
    'completed': 'Completed'
  };
  return labels[status] || 'Unknown';
}

export function filterTasksByStatus(tasks: Task[], status: Task['status']): Task[] {
  return tasks.filter(task => task.status === status);
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}
