import { getPriorityClass, getStatusClass } from './types';

describe('app/types utility functions', () => {
  describe('getPriorityClass', () => {
    it('should return correct class for high priority', () => {
      const result = getPriorityClass('high');
      expect(result).toBe('bg-red-100 text-red-700');
    });

    it('should return correct class for medium priority', () => {
      const result = getPriorityClass('medium');
      expect(result).toBe('bg-yellow-100 text-yellow-700');
    });

    it('should return correct class for low priority', () => {
      const result = getPriorityClass('low');
      expect(result).toBe('bg-blue-100 text-blue-700');
    });

    it('should return default class for invalid priority', () => {
      const result = getPriorityClass('' as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for completed status', () => {
      const result = getStatusClass('completed');
      expect(result).toBe('bg-green-100 text-green-700');
    });

    it('should return correct class for in-progress status', () => {
      const result = getStatusClass('in-progress');
      expect(result).toBe('bg-blue-100 text-blue-700');
    });

    it('should return correct class for pending status', () => {
      const result = getStatusClass('pending');
      expect(result).toBe('bg-yellow-100 text-yellow-700');
    });

    it('should return default class for invalid status', () => {
      const result = getStatusClass('' as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('TaskFormData interface', () => {
    it('should accept valid task form data', () => {
      const taskData = {
        id: '123',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: '2025-12-31',
        startTime: '09:00',
        endTime: '10:00'
      };

      expect(taskData.title).toBe('Test Task');
      expect(taskData.priority).toBe('high');
      expect(taskData.status).toBe('pending');
    });

    it('should accept task form data without optional fields', () => {
      const taskData: any = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium' as const,
        status: 'completed' as const,
        dueDate: '2025-12-31'
      };

      expect(taskData.title).toBe('Test Task');
      expect(taskData.id).toBeUndefined();
      expect(taskData.startTime).toBeUndefined();
      expect(taskData.endTime).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null for invalid priority', () => {
      const result = getPriorityClass(null as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });

    it('should handle undefined for invalid priority', () => {
      const result = getPriorityClass(undefined as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });

    it('should handle null for invalid status', () => {
      const result = getStatusClass(null as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });

    it('should handle undefined for invalid status', () => {
      const result = getStatusClass(undefined as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });

    it('should handle random string for priority', () => {
      const result = getPriorityClass('urgent' as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });

    it('should handle random string for status', () => {
      const result = getStatusClass('archived' as any);
      expect(result).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('Return Value Consistency', () => {
    it('should always return a string from getPriorityClass', () => {
      const priorities = ['low', 'medium', 'high', '', null, undefined, 'invalid'];
      priorities.forEach(priority => {
        const result = getPriorityClass(priority as any);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should always return a string from getStatusClass', () => {
      const statuses = ['pending', 'in-progress', 'completed', '', null, undefined, 'invalid'];
      statuses.forEach(status => {
        const result = getStatusClass(status as any);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should return Tailwind CSS classes', () => {
      const priorityResult = getPriorityClass('high');
      const statusResult = getStatusClass('completed');

      expect(priorityResult).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      expect(statusResult).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
    });

    it('should handle all valid priority values', () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      priorities.forEach(priority => {
        const result = getPriorityClass(priority);
        expect(result).not.toBe('bg-gray-100 text-gray-700');
      });
    });

    it('should handle all valid status values', () => {
      const statuses: Array<'pending' | 'in-progress' | 'completed'> = ['pending', 'in-progress', 'completed'];
      statuses.forEach(status => {
        const result = getStatusClass(status);
        expect(result).not.toBe('bg-gray-100 text-gray-700');
      });
    });
  });
});
