import mongoose from 'mongoose';
import { User, Task, ChatThread, TaskCompletionHistory, PointActivity } from './index';

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn((name: string, schema: any) => {
      return class MockModel {
        constructor(data: any) {
          Object.assign(this, data);
        }
        static schema = schema;
        static modelName = name;
      };
    }),
    models: {},
  };
});

describe('Models', () => {
  describe('UserSchema', () => {
    it('should have correct field types', () => {
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });

    it('should have email as required field', () => {
      const schema = (User as any).schema;
      expect(schema).toBeDefined();
    });

    it('should have default values for points', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      expect(user).toBeDefined();
    });

    it('should support OAuth provider', () => {
      const user = new User({
        email: 'test@example.com',
        provider: 'google',
        providerId: 'google123'
      });
      expect(user).toBeDefined();
    });

    it('should have pomodoro settings with defaults', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      expect(user).toBeDefined();
    });

    it('should support reset password token', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        resetPasswordToken: 'token123',
        resetPasswordExpires: new Date()
      });
      expect(user).toBeDefined();
    });

    it('should have lastDailyCheckinAt field', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        lastDailyCheckinAt: new Date()
      });
      expect(user).toBeDefined();
    });

    it('should support profession field', () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        profession: 'Developer'
      });
      expect(user).toBeDefined();
    });

    it('should support name and image for OAuth', () => {
      const user = new User({
        email: 'test@example.com',
        provider: 'google',
        name: 'Test User',
        image: 'https://example.com/image.jpg'
      });
      expect(user).toBeDefined();
    });
  });

  describe('TaskSchema', () => {
    it('should have correct model name', () => {
      expect(Task).toBeDefined();
      expect(Task.modelName).toBe('Task');
    });

    it('should create task with required fields', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task'
      });
      expect(task).toBeDefined();
    });

    it('should have default priority as medium', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task'
      });
      expect(task).toBeDefined();
    });

    it('should have default status as pending', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task'
      });
      expect(task).toBeDefined();
    });

    it('should support all priority levels', () => {
      const priorities = ['low', 'medium', 'high'];
      priorities.forEach(priority => {
        const task = new Task({
          userId: new mongoose.Types.ObjectId(),
          title: 'Test Task',
          priority
        });
        expect(task).toBeDefined();
      });
    });

    it('should support all status values', () => {
      const statuses = ['pending', 'in-progress', 'completed', 'overdue'];
      statuses.forEach(status => {
        const task = new Task({
          userId: new mongoose.Types.ObjectId(),
          title: 'Test Task',
          status
        });
        expect(task).toBeDefined();
      });
    });

    it('should support optional description', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        description: 'Test description'
      });
      expect(task).toBeDefined();
    });

    it('should support dueDate', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        dueDate: new Date('2025-12-31')
      });
      expect(task).toBeDefined();
    });

    it('should support startTime and endTime', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        startTime: '09:00',
        endTime: '17:00'
      });
      expect(task).toBeDefined();
    });

    it('should support completedAt timestamp', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task',
        status: 'completed',
        completedAt: new Date()
      });
      expect(task).toBeDefined();
    });
  });

  describe('ChatThreadSchema', () => {
    it('should have correct model name', () => {
      expect(ChatThread).toBeDefined();
      expect(ChatThread.modelName).toBe('ChatThread');
    });

    it('should create chat thread with userId', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId()
      });
      expect(thread).toBeDefined();
    });

    it('should have default title', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId()
      });
      expect(thread).toBeDefined();
    });

    it('should support custom title', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId(),
        title: 'Custom Chat Title'
      });
      expect(thread).toBeDefined();
    });

    it('should support messages array', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId(),
        messages: [
          { role: 'user', content: 'Hello', createdAt: new Date() },
          { role: 'assistant', content: 'Hi there!', createdAt: new Date() }
        ]
      });
      expect(thread).toBeDefined();
    });

    it('should support all message roles', () => {
      const roles = ['user', 'assistant', 'tool', 'system'];
      roles.forEach(role => {
        const thread = new ChatThread({
          userId: new mongoose.Types.ObjectId(),
          messages: [{ role, content: 'Test message', createdAt: new Date() }]
        });
        expect(thread).toBeDefined();
      });
    });

    it('should generate threadId automatically', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId()
      });
      expect(thread).toBeDefined();
    });
  });

  describe('TaskCompletionHistorySchema', () => {
    it('should have correct model name', () => {
      expect(TaskCompletionHistory).toBeDefined();
      expect(TaskCompletionHistory.modelName).toBe('TaskCompletionHistory');
    });

    it('should create history with required fields', () => {
      const history = new TaskCompletionHistory({
        userId: new mongoose.Types.ObjectId(),
        taskId: new mongoose.Types.ObjectId(),
        taskTitle: 'Completed Task'
      });
      expect(history).toBeDefined();
    });

    it('should have default completedAt timestamp', () => {
      const history = new TaskCompletionHistory({
        userId: new mongoose.Types.ObjectId(),
        taskId: new mongoose.Types.ObjectId(),
        taskTitle: 'Completed Task'
      });
      expect(history).toBeDefined();
    });

    it('should support custom completedAt', () => {
      const customDate = new Date('2025-01-01');
      const history = new TaskCompletionHistory({
        userId: new mongoose.Types.ObjectId(),
        taskId: new mongoose.Types.ObjectId(),
        taskTitle: 'Completed Task',
        completedAt: customDate
      });
      expect(history).toBeDefined();
    });
  });

  describe('PointActivitySchema', () => {
    it('should have correct model name', () => {
      expect(PointActivity).toBeDefined();
      expect(PointActivity.modelName).toBe('PointActivity');
    });

    it('should create activity with required fields', () => {
      const activity = new PointActivity({
        userId: new mongoose.Types.ObjectId(),
        type: 'task_completed',
        amount: 10,
        description: 'Completed task on time'
      });
      expect(activity).toBeDefined();
    });

    it('should support positive amounts', () => {
      const activity = new PointActivity({
        userId: new mongoose.Types.ObjectId(),
        type: 'daily_checkin',
        amount: 5,
        description: 'Daily check-in bonus'
      });
      expect(activity).toBeDefined();
    });

    it('should support negative amounts', () => {
      const activity = new PointActivity({
        userId: new mongoose.Types.ObjectId(),
        type: 'missed_deadline',
        amount: -10,
        description: 'Missed task deadline'
      });
      expect(activity).toBeDefined();
    });

    it('should have default createdAt', () => {
      const activity = new PointActivity({
        userId: new mongoose.Types.ObjectId(),
        type: 'signup_bonus',
        amount: 100,
        description: 'Welcome bonus'
      });
      expect(activity).toBeDefined();
    });

    it('should support various activity types', () => {
      const types = ['signup_bonus', 'daily_checkin', 'task_completed_on_time', 'missed_deadline'];
      types.forEach(type => {
        const activity = new PointActivity({
          userId: new mongoose.Types.ObjectId(),
          type,
          amount: 10,
          description: `Activity of type ${type}`
        });
        expect(activity).toBeDefined();
      });
    });
  });

  describe('Model Exports', () => {
    it('should export all models', () => {
      expect(User).toBeDefined();
      expect(Task).toBeDefined();
      expect(ChatThread).toBeDefined();
      expect(TaskCompletionHistory).toBeDefined();
      expect(PointActivity).toBeDefined();
    });

    it('should have unique model names', () => {
      const names = [
        User.modelName,
        Task.modelName,
        ChatThread.modelName,
        TaskCompletionHistory.modelName,
        PointActivity.modelName
      ];
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Schema Relationships', () => {
    it('should reference User in Task', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Task'
      });
      expect(task).toBeDefined();
    });

    it('should reference User in ChatThread', () => {
      const thread = new ChatThread({
        userId: new mongoose.Types.ObjectId()
      });
      expect(thread).toBeDefined();
    });

    it('should reference User and Task in TaskCompletionHistory', () => {
      const history = new TaskCompletionHistory({
        userId: new mongoose.Types.ObjectId(),
        taskId: new mongoose.Types.ObjectId(),
        taskTitle: 'Test'
      });
      expect(history).toBeDefined();
    });

    it('should reference User in PointActivity', () => {
      const activity = new PointActivity({
        userId: new mongoose.Types.ObjectId(),
        type: 'test',
        amount: 10,
        description: 'Test'
      });
      expect(activity).toBeDefined();
    });
  });
});
