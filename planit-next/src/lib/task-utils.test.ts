/**
 * Unit tests for task utility functions
 */

import {
  formatTaskTitle,
  validateEmail,
  calculateTaskPriority,
  getTaskStatusLabel,
  filterTasksByStatus,
  sortTasksByPriority,
  Task
} from '@/lib/task-utils';

describe('Task Utilities', () => {
  describe('formatTaskTitle', () => {
    it('should capitalize first letter', () => {
      expect(formatTaskTitle('test task')).toBe('Test task');
    });

    it('should trim whitespace', () => {
      expect(formatTaskTitle('  test  ')).toBe('Test');
    });

    it('should handle empty string', () => {
      expect(formatTaskTitle('')).toBe('');
    });

    it('should handle single character', () => {
      expect(formatTaskTitle('t')).toBe('T');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('calculateTaskPriority', () => {
    const now = Date.now();

    it('should return 10 for overdue tasks', () => {
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      expect(calculateTaskPriority(yesterday, 3)).toBe(10);
    });

    it('should return high priority for tasks due today', () => {
      const today = new Date(now + 2 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(today, 2);
      expect(priority).toBeGreaterThanOrEqual(8);
    });

    it('should return medium priority for tasks due this week', () => {
      const nextWeek = new Date(now + 5 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(nextWeek, 3);
      expect(priority).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getTaskStatusLabel', () => {
    it('should return correct label for status', () => {
      expect(getTaskStatusLabel('pending')).toBe('Pending');
      expect(getTaskStatusLabel('in-progress')).toBe('In Progress');
      expect(getTaskStatusLabel('completed')).toBe('Completed');
    });
  });

  describe('filterTasksByStatus', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', status: 'pending', priority: 1 },
      { id: '2', title: 'Task 2', status: 'completed', priority: 2 },
      { id: '3', title: 'Task 3', status: 'pending', priority: 3 },
    ];

    it('should filter tasks by status', () => {
      const pending = filterTasksByStatus(tasks, 'pending');
      expect(pending).toHaveLength(2);
      expect(pending[0].status).toBe('pending');
    });

    it('should return empty array when no matches', () => {
      const inProgress = filterTasksByStatus(tasks, 'in-progress');
      expect(inProgress).toHaveLength(0);
    });
  });

  describe('sortTasksByPriority', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Task 1', status: 'pending', priority: 1 },
      { id: '2', title: 'Task 2', status: 'completed', priority: 5 },
      { id: '3', title: 'Task 3', status: 'pending', priority: 3 },
    ];

    it('should sort tasks by priority descending', () => {
      const sorted = sortTasksByPriority(tasks);
      expect(sorted[0].priority).toBe(5);
      expect(sorted[1].priority).toBe(3);
      expect(sorted[2].priority).toBe(1);
    });

    it('should not modify original array', () => {
      const sorted = sortTasksByPriority(tasks);
      expect(tasks[0].priority).toBe(1);
      expect(sorted[0].priority).toBe(5);
    });
  });
});
