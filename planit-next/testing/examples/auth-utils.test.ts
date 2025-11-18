/**
 * Unit tests for utility functions
 * This demonstrates testing pure utility functions without Next.js server dependencies
 */

// Example utility functions that could exist in your project
const formatTaskTitle = (title: string): string => {
  return title.trim().charAt(0).toUpperCase() + title.trim().slice(1);
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const calculateTaskPriority = (dueDate: Date, importance: number): number => {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) return 10; // Overdue
  if (daysUntilDue <= 1) return 8 + importance; // Due today/tomorrow
  if (daysUntilDue <= 7) return 5 + importance; // Due this week
  return importance; // Due later
};

describe('Utility Functions', () => {
  describe('formatTaskTitle', () => {
    it('should capitalize first letter of task title', () => {
      const result = formatTaskTitle('test task');
      expect(result).toBe('Test task');
    });

    it('should trim whitespace and capitalize', () => {
      const result = formatTaskTitle('  test task  ');
      expect(result).toBe('Test task');
    });

    it('should handle already capitalized titles', () => {
      const result = formatTaskTitle('Test Task');
      expect(result).toBe('Test Task');
    });

    it('should handle single character', () => {
      const result = formatTaskTitle('t');
      expect(result).toBe('T');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
      expect(validateEmail('invalid@.com')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test@ example.com')).toBe(false);
    });
  });

  describe('calculateTaskPriority', () => {
    const now = Date.now();

    it('should return 10 for overdue tasks', () => {
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(yesterday, 3);
      expect(priority).toBe(10);
    });

    it('should return high priority for tasks due today', () => {
      const today = new Date(now + 2 * 60 * 60 * 1000); // 2 hours from now
      const priority = calculateTaskPriority(today, 2);
      expect(priority).toBeGreaterThanOrEqual(8);
    });

    it('should return medium priority for tasks due this week', () => {
      const nextWeek = new Date(now + 5 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(nextWeek, 3);
      expect(priority).toBeGreaterThanOrEqual(5);
      expect(priority).toBeLessThan(10);
    });

    it('should return base importance for tasks due later', () => {
      const farFuture = new Date(now + 30 * 24 * 60 * 60 * 1000);
      const priority = calculateTaskPriority(farFuture, 3);
      expect(priority).toBe(3);
    });
  });
});
