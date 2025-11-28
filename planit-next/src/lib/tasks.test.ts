/**
 * Unit tests for task utilities
 */

import { createTask, updateTask, deleteTask } from './tasks';

// Mock global fetch
global.fetch = jest.fn();

// Mock window.postMessage, dispatchEvent, and history
const mockPostMessage = jest.fn();
const mockDispatchEvent = jest.fn();
const mockReplaceState = jest.fn();

Object.defineProperty(window, 'postMessage', {
  writable: true,
  value: mockPostMessage,
});

Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: mockDispatchEvent,
});

Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    replaceState: mockReplaceState,
  },
});

// Mock console.log to avoid cluttering test output
global.console.log = jest.fn();

describe('Task Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockPostMessage.mockClear();
    mockDispatchEvent.mockClear();
    mockReplaceState.mockClear();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task123',
        title: 'New Task',
        description: 'Task description',
        status: 'todo' as const,
        priority: 'medium' as const,
        dueDate: new Date('2024-12-31'),
        userId: 'user123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTask),
      });

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo' as const,
        priority: 'medium' as const,
        dueDate: new Date('2024-12-31'),
      };

      const result = await createTask(taskData);

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      expect(result).toEqual(mockTask);
      expect(mockPostMessage).toHaveBeenCalled();
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it('should throw error when create fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      });

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo' as const,
        priority: 'medium' as const,
        dueDate: new Date('2024-12-31'),
      };

      await expect(createTask(taskData)).rejects.toThrow('Failed to create task');
    });

    it('should dispatch task update event after creation', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task-updated',
          timestamp: expect.any(Number),
        }),
        '*'
      );
    });

    it('should dispatch custom event after creation', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockDispatchEvent).toHaveBeenCalled();
      const call = mockDispatchEvent.mock.calls[0][0];
      expect(call.type).toBe('task-updated');
    });

    it('should call history.replaceState after creation', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('should handle task with all optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      const taskData = {
        title: 'Minimal Task',
        status: 'todo' as const,
        priority: 'low' as const,
      };

      await createTask(taskData as any);

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const mockUpdatedTask = {
        id: 'task123',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in-progress' as const,
        priority: 'high' as const,
        userId: 'user123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUpdatedTask),
      });

      const updates = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in-progress' as const,
      };

      const result = await updateTask('task123', updates);

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      expect(result).toEqual(mockUpdatedTask);
      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        updateTask('nonexistent', { title: 'Updated' })
      ).rejects.toThrow('Failed to update task');
    });

    it('should dispatch task update event after update', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await updateTask('task123', { status: 'completed' });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task-updated',
          timestamp: expect.any(Number),
        }),
        '*'
      );
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await updateTask('task123', { priority: 'high' });

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: 'high' }),
      });
    });

    it('should handle status change', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123', status: 'completed' }),
      });

      const result = await updateTask('task123', { status: 'completed' });

      expect(result.status).toBe('completed');
    });

    it('should handle multiple field updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      const updates = {
        title: 'New Title',
        description: 'New Description',
        status: 'in-progress' as const,
        priority: 'high' as const,
        dueDate: new Date('2024-12-31'),
      };

      await updateTask('task123', updates);

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Task deleted',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await deleteTask('task123');

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task123', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(deleteTask('nonexistent')).rejects.toThrow('Failed to delete task');
    });

    it('should dispatch task update event after deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await deleteTask('task123');

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task-updated',
          timestamp: expect.any(Number),
        }),
        '*'
      );
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it('should handle deletion with empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await deleteTask('task123');

      expect(result).toEqual({});
    });
  });

  describe('dispatchTaskUpdate', () => {
    it('should use window.postMessage for cross-page communication', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'task-updated' }),
        '*'
      );
    });

    it('should dispatch custom event as backup', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockDispatchEvent).toHaveBeenCalled();
      const event = mockDispatchEvent.mock.calls[0][0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('task-updated');
      expect(event.detail).toHaveProperty('timestamp');
    });

    it('should call replaceState with URL string', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(mockReplaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.any(String)
      );
    });

    it('should include timestamp in all dispatches', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      const beforeTime = Date.now();
      
      await createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      const afterTime = Date.now();

      const postMessageCall = mockPostMessage.mock.calls[0][0];
      expect(postMessageCall.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(postMessageCall.timestamp).toBeLessThanOrEqual(afterTime);

      const eventCall = mockDispatchEvent.mock.calls[0][0];
      expect(eventCall.detail.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventCall.detail.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during create', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        createTask({
          title: 'Test',
          description: 'Test',
          status: 'todo',
          priority: 'low',
          dueDate: new Date(),
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle network errors during update', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(updateTask('task123', { title: 'Updated' })).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle network errors during delete', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(deleteTask('task123')).rejects.toThrow('Network error');
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(createTask({
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      })).rejects.toThrow('Failed to create task');
    });

    it('should handle 401 unauthorized errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(updateTask('task123', { title: 'Updated' })).rejects.toThrow(
        'Failed to update task'
      );
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(deleteTask('task123')).rejects.toThrow('Failed to delete task');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle rapid successive task creations', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      const tasks = [
        { title: 'Task 1', description: 'Desc 1', status: 'todo' as const, priority: 'low' as const },
        { title: 'Task 2', description: 'Desc 2', status: 'todo' as const, priority: 'medium' as const },
        { title: 'Task 3', description: 'Desc 3', status: 'todo' as const, priority: 'high' as const },
      ];

      const results = await Promise.all(tasks.map(task => createTask(task as any)));

      expect(results).toHaveLength(3);
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle task lifecycle: create, update, delete', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: 'task123', title: 'New Task' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: 'task123', title: 'Updated Task' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        });

      await createTask({
        title: 'New Task',
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      await updateTask('task123', { title: 'Updated Task' });
      await deleteTask('task123');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty task data object in update', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await updateTask('task123', {});

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks/task123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    });

    it('should handle special characters in task data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      await createTask({
        title: 'Task with "quotes" and special chars: <>&',
        description: 'Description with\nnewlines\tand\ttabs',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle very long task titles', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'task123' }),
      });

      const longTitle = 'A'.repeat(1000);
      await createTask({
        title: longTitle,
        description: 'Test',
        status: 'todo',
        priority: 'low',
        dueDate: new Date(),
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
