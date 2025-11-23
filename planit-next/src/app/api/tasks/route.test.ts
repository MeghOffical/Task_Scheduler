import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth-utils');
jest.mock('@/lib/db');

describe('Tasks API Routes', () => {
  const mockUserId = 'user123';
  const mockGetAuthenticatedUserId = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET /api/tasks', () => {
    it('should return tasks for authenticated user', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      
      const mockTasks = [
        {
          _id: 'task1',
          userId: mockUserId,
          title: 'Test Task',
          description: 'Description',
          priority: 'high',
          status: 'pending',
          dueDate: '2025-12-31',
          startTime: '09:00',
          endTime: '10:00',
          createdAt: new Date('2025-01-01'),
        },
      ];

      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTasks),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockGetAuthenticatedUserId).toHaveBeenCalled();
      expect(Task.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('task1');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should filter tasks by query parameter', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks?q=test');
      await GET(request);

      expect(Task.find).toHaveBeenCalledWith({
        userId: mockUserId,
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } },
        ],
      });
    });

    it('should filter tasks by status', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks?status=completed');
      await GET(request);

      expect(Task.find).toHaveBeenCalledWith({
        userId: mockUserId,
        status: 'completed',
      });
    });

    it('should filter tasks by priority', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks?priority=high');
      await GET(request);

      expect(Task.find).toHaveBeenCalledWith({
        userId: mockUserId,
        priority: 'high',
      });
    });

    it('should support internal user id header', async () => {
      const mockTasks = [];
      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTasks),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const headers = new Headers();
      headers.set('x-user-id', 'internal-user-123');
      Object.defineProperty(request, 'headers', { value: headers });

      await GET(request);

      expect(Task.find).toHaveBeenCalledWith({ userId: 'internal-user-123' });
      expect(mockGetAuthenticatedUserId).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching tasks');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockTask = {
        _id: 'task123',
        userId: mockUserId,
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-12-31'),
        startTime: '09:00',
        endTime: '10:00',
      };

      (Task.create as jest.Mock).mockResolvedValue(mockTask);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          description: 'New Description',
          priority: 'medium',
          status: 'pending',
          dueDate: '2025-12-31',
          startTime: '09:00',
          endTime: '10:00',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(Task.create).toHaveBeenCalledWith({
        userId: mockUserId,
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        status: 'pending',
        dueDate: expect.any(Date),
        startTime: '09:00',
        endTime: '10:00',
      });
      expect(response.status).toBe(201);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when title is missing', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Title is required');
    });

    it('should handle null values for optional fields', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (Task.create as jest.Mock).mockResolvedValue({ _id: 'task123' });

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task without optional fields',
        }),
      });

      await POST(request);

      expect(Task.create).toHaveBeenCalledWith({
        userId: mockUserId,
        title: 'Task without optional fields',
        description: undefined,
        priority: undefined,
        status: undefined,
        dueDate: null,
        startTime: null,
        endTime: null,
      });
    });

    it('should handle database errors', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Task' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating task');
    });
  });
});
