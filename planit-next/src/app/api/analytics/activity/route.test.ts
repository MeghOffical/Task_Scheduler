/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';
import { TaskCompletionHistory } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth-utils');
jest.mock('@/lib/db');

describe('Analytics Activity API Route', () => {
  const mockUserId = 'user123';
  const mockGetAuthenticatedUserId = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET /api/analytics/activity', () => {
    it('should return activity data for authenticated user', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockCompletionHistory = [
        { completedAt: new Date('2025-11-01T10:00:00Z') },
        { completedAt: new Date('2025-11-01T15:00:00Z') },
        { completedAt: new Date('2025-11-02T09:00:00Z') },
        { completedAt: new Date('2025-11-03T14:00:00Z') },
        { completedAt: new Date('2025-11-03T16:00:00Z') },
        { completedAt: new Date('2025-11-03T18:00:00Z') },
      ];

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCompletionHistory),
      });

      const response = await GET();
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockGetAuthenticatedUserId).toHaveBeenCalled();
      expect(TaskCompletionHistory.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(response.status).toBe(200);
      expect(data.activity).toBeDefined();
      expect(data.activity['2025-11-01']).toBe(2);
      expect(data.activity['2025-11-02']).toBe(1);
      expect(data.activity['2025-11-03']).toBe(3);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle empty completion history', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activity).toEqual({});
    });

    it('should handle null completedAt dates', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockCompletionHistory = [
        { completedAt: new Date('2025-11-01T10:00:00Z') },
        { completedAt: null },
        { completedAt: new Date('2025-11-02T09:00:00Z') },
      ];

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCompletionHistory),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activity['2025-11-01']).toBe(1);
      expect(data.activity['2025-11-02']).toBe(1);
      expect(Object.keys(data.activity).length).toBe(2);
    });

    it('should aggregate multiple completions on same day', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockCompletionHistory = Array.from({ length: 10 }, () => ({
        completedAt: new Date('2025-11-15T10:00:00Z'),
      }));

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCompletionHistory),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activity['2025-11-15']).toBe(10);
    });

    it('should handle database errors', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch activity data');
    });

    it('should handle different date formats correctly', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockCompletionHistory = [
        { completedAt: new Date('2025-01-01T00:00:00Z') },
        { completedAt: new Date('2025-01-01T23:59:59Z') },
        { completedAt: new Date('2025-12-31T12:00:00Z') },
      ];

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCompletionHistory),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activity['2025-01-01']).toBe(2);
      expect(data.activity['2025-12-31']).toBe(1);
    });

    it('should call dbConnect before database operations', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await GET();

      const dbConnectOrder = mockDbConnect.mock.invocationCallOrder[0];
      const findOrder = (TaskCompletionHistory.find as jest.Mock).mock.invocationCallOrder[0];

      expect(dbConnectOrder).toBeLessThan(findOrder);
    });

    it('should select only completedAt field', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const selectMock = jest.fn().mockResolvedValue([]);
      (TaskCompletionHistory.find as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      await GET();

      expect(selectMock).toHaveBeenCalledWith('completedAt');
    });

    it('should handle connection errors gracefully', async () => {
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch activity data');
    });
  });
});
