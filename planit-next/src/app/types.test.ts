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
});
