import { NextRequest } from 'next/server';
import { DELETE, PUT, PATCH } from './route';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth-utils');
jest.mock('@/lib/db');
jest.mock('mongodb');

describe('Tasks [id] API Routes', () => {
  const mockUserId = 'user123';
  const mockTaskId = '507f1f77bcf86cd799439011';
  const mockGetAuthenticatedUserId = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task successfully', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockTask = {
        _id: new ObjectId(mockTaskId),
        userId: mockUserId,
        title: 'Test Task',
      };

      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
      (Task.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`);
      const response = await DELETE(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(Task.findOne).toHaveBeenCalled();
      expect(Task.deleteOne).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.message).toBe('Task deleted successfully');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`);
      const response = await DELETE(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when task not found', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`);
      const response = await DELETE(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Task not found or unauthorized');
    });

    it('should handle database errors', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`);
      const response = await DELETE(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error deleting task');
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('should update a task successfully', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockTask = {
        _id: new ObjectId(mockTaskId),
        userId: mockUserId,
        title: 'Old Title',
      };

      const updatedTask = {
        _id: new ObjectId(mockTaskId),
        userId: mockUserId,
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high',
        status: 'in-progress',
      };

      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
      (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedTask);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'high',
          status: 'in-progress',
          dueDate: '2025-12-31',
        }),
      });

      const response = await PUT(request, { params: { id: mockTaskId } });

      expect(mockDbConnect).toHaveBeenCalled();
      expect(Task.findOne).toHaveBeenCalled();
      expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'high',
          status: 'in-progress',
        }),
        { new: true }
      );
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });

      const response = await PUT(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when task not found', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });

      const response = await PUT(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Task not found or unauthorized');
    });

    it('should handle null dueDate', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockTask = {
        _id: new ObjectId(mockTaskId),
        userId: mockUserId,
      };

      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
      (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockTask);

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Task',
          dueDate: null,
        }),
      });

      await PUT(request, { params: { id: mockTaskId } });

      expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        expect.objectContaining({
          dueDate: null,
        }),
        { new: true }
      );
    });

    it('should handle database errors', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      (Task.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });

      const response = await PUT(request, { params: { id: mockTaskId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error updating task');
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('should partially update a task', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockTask = {
        _id: new ObjectId(mockTaskId),
        userId: mockUserId,
        title: 'Test Task',
        status: 'pending',
      };

      (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
      (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockTask,
        status: 'completed',
      });

      const request = new NextRequest(`http://localhost:3000/api/tasks/${mockTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      });

      const response = await PATCH(request, { params: { id: mockTaskId } });

      expect(response.status).toBe(200);
    });
  });
});
