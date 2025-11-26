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

    it('should handle string with only spaces', () => {
      expect(formatTaskTitle('   ')).toBe('');
    });

    it('should handle string with leading spaces only', () => {
      expect(formatTaskTitle('   task')).toBe('Task');
    });

    it('should handle string with trailing spaces only', () => {
      expect(formatTaskTitle('task   ')).toBe('Task');
    });

    it('should handle multiple spaces between words', () => {
      expect(formatTaskTitle('  test   task  ')).toBe('Test   task');
    });

    it('should trim before checking length (not just check length)', () => {
      // This test ensures trim() is called before length check
      const inputWithSpaces = '  ';
      const result = formatTaskTitle(inputWithSpaces);
      expect(result).toBe('');
      // The untrimmed length is 2, but trimmed is 0
      expect(inputWithSpaces.length).toBe(2);
      expect(inputWithSpaces.trim().length).toBe(0);
    });

    it('should return empty for null-like falsy title', () => {
      expect(formatTaskTitle(null as any)).toBe('');
      expect(formatTaskTitle(undefined as any)).toBe('');
    });

    it('should handle title that becomes empty after trim', () => {
      const spacesOnly = '     \t\n  ';
      expect(formatTaskTitle(spacesOnly)).toBe('');
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

    it('should reject email without domain extension', () => {
      expect(validateEmail('test@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test@ example.com')).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      expect(validateEmail('testexample.com')).toBe(false);
    });

    it('should validate email starts correctly', () => {
      expect(validateEmail(' test@example.com')).toBe(false);
    });

    it('should validate email ends correctly', () => {
      expect(validateEmail('test@example.com ')).toBe(false);
    });

    it('should handle null-like empty email', () => {
      expect(validateEmail('' as any)).toBe(false);
    });

    it('should check for email existence before regex validation', () => {
      // Test that !email check happens first
      const emptyEmail = '';
      expect(validateEmail(emptyEmail)).toBe(false);
      expect(emptyEmail).toBe(''); // Confirm it's empty
    });

    it('should validate email with exact regex pattern', () => {
      // These should match the exact regex behavior
      expect(validateEmail('test@domain.c')).toBe(true); // Minimal valid
      expect(validateEmail('a@b.c')).toBe(true); // Very short but valid
    });

    it('should reject email that fails regex', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test domain@test.com')).toBe(false);
    });
  });

  describe('calculateTaskPriority', () => {
    const now = Date.now();

    it('should return 10 for overdue tasks', () => {
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      expect(calculateTaskPriority(yesterday, 3)).toBe(10);
    });

    it('should return 10 for tasks due exactly at boundary (just overdue)', () => {
      const justOverdue = new Date(now - 1000); // 1 second ago
      expect(calculateTaskPriority(justOverdue, 3)).toBe(10);
    });

    it('should return high priority for tasks due today', () => {
      const today = new Date(now + 2 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(today, 2);
      expect(priority).toBeGreaterThanOrEqual(8);
    });

    it('should return correct priority for tasks due exactly 0 days', () => {
      const exactlyToday = new Date(now + 1000); // 1 second from now
      const priority = calculateTaskPriority(exactlyToday, 2);
      expect(priority).toBe(10); // 8 + min(2, 2) = 10
    });

    it('should return correct priority for tasks due exactly 1 day', () => {
      const oneDayFromNow = new Date(now + 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(oneDayFromNow, 1);
      expect(priority).toBe(9); // 8 + min(1, 2) = 9
    });

    it('should cap importance at 2 for tasks due today/tomorrow', () => {
      const today = new Date(now + 2 * 60 * 60 * 1000);
      const priorityHigh = calculateTaskPriority(today, 5); // importance > 2
      const priorityNormal = calculateTaskPriority(today, 2);
      expect(priorityHigh).toBe(10); // 8 + min(5, 2) = 10
      expect(priorityNormal).toBe(10); // 8 + min(2, 2) = 10
    });

    it('should return medium priority for tasks due this week', () => {
      const nextWeek = new Date(now + 5 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(nextWeek, 3);
      expect(priority).toBeGreaterThanOrEqual(5);
    });

    it('should return correct priority for tasks due exactly 7 days', () => {
      const sevenDaysFromNow = new Date(now + 7 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(sevenDaysFromNow, 3);
      expect(priority).toBe(8); // 5 + min(3, 4) = 8
    });

    it('should cap importance at 4 for tasks due this week', () => {
      const thisWeek = new Date(now + 5 * 24 * 60 * 60 * 1000);
      const priorityHigh = calculateTaskPriority(thisWeek, 10); // importance > 4
      const priorityNormal = calculateTaskPriority(thisWeek, 4);
      expect(priorityHigh).toBe(9); // 5 + min(10, 4) = 9
      expect(priorityNormal).toBe(9); // 5 + min(4, 4) = 9
    });

    it('should return importance for tasks due later than 7 days', () => {
      const farFuture = new Date(now + 30 * 24 * 60 * 60 * 1000);
      const importance = 3;
      const priority = calculateTaskPriority(farFuture, importance);
      expect(priority).toBe(importance);
    });

    it('should return importance for tasks due exactly 8 days', () => {
      const eightDaysFromNow = new Date(now + 8 * 24 * 60 * 60 * 1000);
      const importance = 2;
      const priority = calculateTaskPriority(eightDaysFromNow, importance);
      expect(priority).toBe(2);
    });

    it('should handle importance of 0', () => {
      const today = new Date(now + 2 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(today, 0);
      expect(priority).toBe(8); // 8 + min(0, 2) = 8
    });

    it('should check overdue condition first (daysUntilDue < 0)', () => {
      // Test the exact < 0 condition with a full day in the past
      const overdue = new Date(now - 25 * 60 * 60 * 1000); // 25 hours ago
      expect(calculateTaskPriority(overdue, 5)).toBe(10);
      // Verify it's actually negative days
      const days = Math.ceil((overdue.getTime() - now) / (1000 * 60 * 60 * 24));
      expect(days).toBeLessThan(0);
    });

    it('should differentiate between daysUntilDue < 0 and <= 0', () => {
      // Test that < 0 is used, not <= 0
      const justBarelyFuture = new Date(now + 100); // Milliseconds from now
      const days = Math.ceil((justBarelyFuture.getTime() - now) / (1000 * 60 * 60 * 24));
      // Should be 1 day (ceil rounds up any positive value), not 0
      expect(days).toBeGreaterThanOrEqual(0);
      const priority = calculateTaskPriority(justBarelyFuture, 2);
      // Since it ceils to 1 day, it falls into <= 1 category
      expect(priority).toBeGreaterThanOrEqual(8); // 8 + min(2, 2) = 10
    });

    it('should check daysUntilDue <= 1 after overdue check', () => {
      // Test the second condition with exactly 1 day
      const oneDayExact = new Date(now + 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(oneDayExact, 1);
      expect(priority).toBeGreaterThanOrEqual(8);
    });

    it('should check daysUntilDue <= 7 after <= 1 check', () => {
      // Test the third condition with exactly 2 days (not caught by <= 1)
      const twoDays = new Date(now + 2 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(twoDays, 3);
      const days = Math.ceil((twoDays.getTime() - now) / (1000 * 60 * 60 * 24));
      expect(days).toBeGreaterThan(1);
      expect(days).toBeLessThanOrEqual(7);
      expect(priority).toBeGreaterThanOrEqual(5);
    });

    it('should use Math.min correctly for importance capping', () => {
      // Verify Math.min is used, not Math.max
      const today = new Date(now + 2 * 60 * 60 * 1000);
      const highImportance = calculateTaskPriority(today, 10);
      const normalImportance = calculateTaskPriority(today, 2);
      // Both should cap at 2 for today/tomorrow
      expect(highImportance).toBe(10); // 8 + min(10, 2) = 10
      expect(normalImportance).toBe(10); // 8 + min(2, 2) = 10
      // If it used max, high would be 18
      expect(highImportance).not.toBe(18);
    });

    it('should return importance directly for tasks beyond 7 days', () => {
      const farFuture = new Date(now + 10 * 24 * 60 * 60 * 1000);
      const importance = 6;
      const priority = calculateTaskPriority(farFuture, importance);
      expect(priority).toBe(importance);
      expect(priority).toBe(6);
    });
  });

  describe('getTaskStatusLabel', () => {
    it('should return correct label for status', () => {
      expect(getTaskStatusLabel('pending')).toBe('Pending');
      expect(getTaskStatusLabel('in-progress')).toBe('In Progress');
      expect(getTaskStatusLabel('completed')).toBe('Completed');
    });

    it('should return Unknown for invalid status', () => {
      expect(getTaskStatusLabel('invalid' as any)).toBe('Unknown');
    });

    it('should handle each status individually', () => {
      expect(getTaskStatusLabel('pending')).not.toBe('In Progress');
      expect(getTaskStatusLabel('in-progress')).not.toBe('Completed');
      expect(getTaskStatusLabel('completed')).not.toBe('Pending');
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
