import { Task } from '@/types';

const dispatchTaskUpdate = () => {
  console.log('Dispatching task update event');
  
  // Use window.postMessage for more reliable cross-page communication
  window.postMessage({ type: 'task-updated', timestamp: Date.now() }, '*');
  
  // Also dispatch a custom event as backup
  const event = new CustomEvent('task-updated', { detail: { timestamp: Date.now() } });
  window.dispatchEvent(event);
  
  // Force a re-render by updating URL parameters
  const url = new URL(window.location.href);
  url.searchParams.set('timestamp', Date.now().toString());
  window.history.replaceState({}, '', url.toString());
  
  console.log('Task update event dispatched');
};

export async function createTask(taskData: Omit<Task, 'id' | 'userId'>) {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }

  dispatchTaskUpdate();
  return response.json();
}

export async function updateTask(taskId: string, taskData: Partial<Task>) {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error('Failed to update task');
  }

  dispatchTaskUpdate();
  return response.json();
}

export async function deleteTask(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }

  dispatchTaskUpdate();
  return response.json();
}