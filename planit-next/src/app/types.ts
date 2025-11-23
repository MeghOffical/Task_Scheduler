/// <reference types="react" />

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  startTime?: string; // Format: "HH:mm" (24-hour format)
  endTime?: string; // Format: "HH:mm" (24-hour format)
}

export const getPriorityClass = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusClass = (status: 'pending' | 'in-progress' | 'completed'): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'in-progress':
      return 'bg-blue-100 text-blue-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

declare module '@/types' {
  export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    // --- FIX: ADDED 'overdue' TO MATCH MONGOOSE SCHEMA ---
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
    // ----------------------------------------------------
    dueDate: string | null;
    startTime?: string | null; // Format: "HH:mm" (24-hour format)
    endTime?: string | null; // Format: "HH:mm" (24-hour format)
    userId: string;
    createdAt: string;
    updatedAt: string;
  }

}