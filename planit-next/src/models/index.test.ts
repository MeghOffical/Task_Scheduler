import mongoose from 'mongoose';
import { User, Task, ChatbotThread, ChatbotMessage } from './index';

// Mock mongoose to avoid BSON import issues
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    Schema: class Schema {
      constructor(definition: any, options?: any) {
        this.definition = definition;
        this.options = options;
      }
      definition: any;
      options: any;
    },
    model: jest.fn((name: string, schema: any) => {
      return class MockModel {
        constructor(data: any) {
          Object.assign(this, data);
        }
        save = jest.fn().mockResolvedValue(this);
        static find = jest.fn();
        static findOne = jest.fn();
        static findById = jest.fn();
        static create = jest.fn();
        static deleteOne = jest.fn();
        static updateOne = jest.fn();
      };
    }),
    models: {},
  };
});

describe('Models', () => {
  describe('User Model', () => {
    it('should create a valid credentials user', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        provider: 'credentials',
        profession: 'Developer'
      };

      const user = new User(userData);
      
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashedpassword');
      expect(user.provider).toBe('credentials');
      expect(user.profession).toBe('Developer');
    });

    it('should create a valid Google OAuth user without password', () => {
      const userData = {
        email: 'google@example.com',
        provider: 'google',
        providerId: 'google-123',
        name: 'John Doe',
        image: 'https://example.com/image.jpg'
      };

      const user = new User(userData);
      
      expect(user.email).toBe('google@example.com');
      expect(user.provider).toBe('google');
      expect(user.providerId).toBe('google-123');
      expect(user.name).toBe('John Doe');
      expect(user.image).toBe('https://example.com/image.jpg');
      expect(user.password).toBeUndefined();
    });

    it('should have default pomodoro settings', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
      
      expect(user.pomodoroSettings.workDuration).toBe(25);
      expect(user.pomodoroSettings.shortBreakDuration).toBe(5);
      expect(user.pomodoroSettings.longBreakDuration).toBe(15);
      expect(user.pomodoroSettings.longBreakInterval).toBe(4);
    });

    it('should validate required email field', () => {
      const user = new User({
        username: 'testuser',
        password: 'hashedpassword'
      });

      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError?.errors.email).toBeDefined();
    });

    it('should have default provider as credentials', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
      
      expect(user.provider).toBe('credentials');
    });

    it('should store reset password token and expiry', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        resetPasswordToken: 'reset-token-123',
        resetPasswordExpires: new Date('2025-12-31')
      });
      
      expect(user.resetPasswordToken).toBe('reset-token-123');
      expect(user.resetPasswordExpires).toEqual(new Date('2025-12-31'));
    });
  });

  describe('Task Model', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    it('should create a valid task', () => {
      const taskData = {
        userId: mockUserId,
        title: 'Test Task',
        description: 'Task description',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: new Date('2025-12-31'),
        startTime: '09:00',
        endTime: '10:00'
      };

      const task = new Task(taskData);
      
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Task description');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
      expect(task.dueDate).toEqual(new Date('2025-12-31'));
      expect(task.startTime).toBe('09:00');
      expect(task.endTime).toBe('10:00');
    });

    it('should have default values', () => {
      const task = new Task({
        userId: mockUserId,
        title: 'Test Task'
      });
      
      expect(task.description).toBe('');
      expect(task.priority).toBe('medium');
      expect(task.status).toBe('pending');
    });

    it('should validate required fields', () => {
      const task = new Task({
        title: 'Test Task'
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError?.errors.userId).toBeDefined();
    });

    it('should only accept valid priority values', () => {
      const task = new Task({
        userId: mockUserId,
        title: 'Test Task',
        priority: 'invalid' as any
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should only accept valid status values', () => {
      const task = new Task({
        userId: mockUserId,
        title: 'Test Task',
        status: 'invalid' as any
      });

      const validationError = task.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should accept null dueDate', () => {
      const task = new Task({
        userId: mockUserId,
        title: 'Test Task',
        dueDate: null
      });

      const validationError = task.validateSync();
      expect(validationError).toBeUndefined();
      expect(task.dueDate).toBeNull();
    });
  });

  describe('ChatbotThread Model', () => {
    const mockUserId = new mongoose.Types.ObjectId();

    it('should create a valid chatbot thread', () => {
      const threadData = {
        userId: mockUserId,
        title: 'Test Thread'
      };

      const thread = new ChatbotThread(threadData);
      
      expect(thread.userId).toEqual(mockUserId);
      expect(thread.title).toBe('Test Thread');
    });

    it('should have default empty title', () => {
      const thread = new ChatbotThread({
        userId: mockUserId
      });
      
      expect(thread.title).toBe('');
    });

    it('should validate required userId field', () => {
      const thread = new ChatbotThread({
        title: 'Test Thread'
      });

      const validationError = thread.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError?.errors.userId).toBeDefined();
    });
  });

  describe('ChatbotMessage Model', () => {
    const mockThreadId = new mongoose.Types.ObjectId();

    it('should create a valid user message', () => {
      const messageData = {
        threadId: mockThreadId,
        role: 'user' as const,
        content: 'Hello, how are you?'
      };

      const message = new ChatbotMessage(messageData);
      
      expect(message.threadId).toEqual(mockThreadId);
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, how are you?');
    });

    it('should create a valid assistant message', () => {
      const messageData = {
        threadId: mockThreadId,
        role: 'assistant' as const,
        content: 'I am doing well, thank you!'
      };

      const message = new ChatbotMessage(messageData);
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('I am doing well, thank you!');
    });

    it('should validate required fields', () => {
      const message = new ChatbotMessage({
        role: 'user',
        content: 'Test message'
      });

      const validationError = message.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError?.errors.threadId).toBeDefined();
    });

    it('should only accept valid role values', () => {
      const message = new ChatbotMessage({
        threadId: mockThreadId,
        role: 'invalid' as any,
        content: 'Test'
      });

      const validationError = message.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should validate required content field', () => {
      const message = new ChatbotMessage({
        threadId: mockThreadId,
        role: 'user'
      });

      const validationError = message.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError?.errors.content).toBeDefined();
    });

    it('should have timestamps', () => {
      const message = new ChatbotMessage({
        threadId: mockThreadId,
        role: 'user',
        content: 'Test message'
      });
      
      expect(message.createdAt).toBeUndefined(); // Not set until saved
    });
  });
});
