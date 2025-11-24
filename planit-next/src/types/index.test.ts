import type { AuthResponse, UserData } from './index';
import type { Task } from '@/types';

describe('types/index', () => {
  describe('AuthResponse interface', () => {
    it('should accept valid auth response with token', () => {
      const authResponse: AuthResponse = {
        token: 'jwt-token-123',
        message: 'Login successful',
        id: 'user123',
        username: 'testuser',
      };

      expect(authResponse.token).toBe('jwt-token-123');
      expect(authResponse.message).toBe('Login successful');
      expect(authResponse.id).toBe('user123');
      expect(authResponse.username).toBe('testuser');
    });

    it('should accept auth response with error', () => {
      const authResponse: AuthResponse = {
        message: 'Authentication failed',
        error: 'Invalid credentials',
      };

      expect(authResponse.message).toBe('Authentication failed');
      expect(authResponse.error).toBe('Invalid credentials');
    });

    it('should accept minimal auth response', () => {
      const authResponse: AuthResponse = {
        message: 'Success',
      };

      expect(authResponse.message).toBe('Success');
      expect(authResponse.token).toBeUndefined();
      expect(authResponse.error).toBeUndefined();
    });
  });

  describe('UserData interface', () => {
    it('should accept complete user data', () => {
      const userData: UserData = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        profession: 'Developer',
      };

      expect(userData.id).toBe('user123');
      expect(userData.username).toBe('testuser');
      expect(userData.email).toBe('test@example.com');
      expect(userData.password).toBe('hashedpassword');
      expect(userData.profession).toBe('Developer');
    });

    it('should accept user data without optional fields', () => {
      const userData: UserData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      expect(userData.username).toBe('testuser');
      expect(userData.email).toBe('test@example.com');
      expect(userData.id).toBeUndefined();
      expect(userData.password).toBeUndefined();
      expect(userData.profession).toBeUndefined();
    });

    it('should accept user data with id only', () => {
      const userData: UserData = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      expect(userData.id).toBe('user123');
    });
  });

  describe('Task interface', () => {
    it('should accept complete task data', () => {
      const task: Task = {
        id: 'task123',
        title: 'Test Task',
        description: 'Task description',
        priority: 'high',
        status: 'in-progress',
        dueDate: '2025-12-31',
        startTime: '09:00',
        endTime: '10:00',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(task.id).toBe('task123');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Task description');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('in-progress');
      expect(task.dueDate).toBe('2025-12-31');
      expect(task.startTime).toBe('09:00');
      expect(task.endTime).toBe('10:00');
      expect(task.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(task.userId).toBe('user123');
    });

    it('should accept task with null dueDate', () => {
      const task: Task = {
        id: 'task123',
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(task.dueDate).toBeNull();
    });

    it('should accept all priority levels', () => {
      const lowTask: Task = {
        id: '1',
        title: 'Low Priority',
        priority: 'low',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      const mediumTask: Task = {
        id: '2',
        title: 'Medium Priority',
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      const highTask: Task = {
        id: '3',
        title: 'High Priority',
        priority: 'high',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(lowTask.priority).toBe('low');
      expect(mediumTask.priority).toBe('medium');
      expect(highTask.priority).toBe('high');
    });

    it('should accept all status levels', () => {
      const pendingTask: Task = {
        id: '1',
        title: 'Pending Task',
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      const inProgressTask: Task = {
        id: '2',
        title: 'In Progress Task',
        priority: 'medium',
        status: 'in-progress',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      const completedTask: Task = {
        id: '3',
        title: 'Completed Task',
        priority: 'medium',
        status: 'completed',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      const overdueTask: Task = {
        id: '4',
        title: 'Overdue Task',
        priority: 'medium',
        status: 'overdue',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(pendingTask.status).toBe('pending');
      expect(inProgressTask.status).toBe('in-progress');
      expect(completedTask.status).toBe('completed');
      expect(overdueTask.status).toBe('overdue');
    });

    it('should accept task with optional fields undefined', () => {
      const task: Task = {
        id: 'task123',
        title: 'Minimal Task',
        priority: 'low',
        status: 'pending',
        dueDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(task.description).toBeUndefined();
      expect(task.startTime).toBeUndefined();
      expect(task.endTime).toBeUndefined();
    });

    it('should accept task with time fields as null', () => {
      const task: Task = {
        id: 'task123',
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        startTime: null,
        endTime: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        userId: 'user123',
      };

      expect(task.startTime).toBeNull();
      expect(task.endTime).toBeNull();
    });
  });
});
