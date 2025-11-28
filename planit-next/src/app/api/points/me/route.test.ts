import { NextRequest } from 'next/server';
import { GET } from './route';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { getUserPointsAndActivity } from '@/lib/points';

// Mock dependencies
jest.mock('@/lib/auth-utils');
jest.mock('@/lib/points');

describe('Points Me API Route', () => {
  const mockUserId = 'user123';
  const mockGetAuthenticatedUserId = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;
  const mockGetUserPointsAndActivity = getUserPointsAndActivity as jest.MockedFunction<typeof getUserPointsAndActivity>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/points/me', () => {
    it('should return points and activities for authenticated user', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 250,
          level: 5,
          currentLevelProgress: 50,
          nextLevelAt: 300,
        },
        activities: [
          {
            id: 'activity1',
            type: 'task_completed_on_time',
            amount: 10,
            description: 'Completed task: Review PR',
            createdAt: new Date('2025-11-28'),
          },
          {
            id: 'activity2',
            type: 'daily_checkin',
            amount: 5,
            description: 'Daily check-in streak: 3 days',
            createdAt: new Date('2025-11-29'),
          },
        ],
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(mockGetAuthenticatedUserId).toHaveBeenCalled();
      expect(mockGetUserPointsAndActivity).toHaveBeenCalledWith(mockUserId);
      expect(response.status).toBe(200);
      expect(data.points).toEqual(mockData.points);
      expect(data.activities).toEqual(mockData.activities);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
      expect(mockGetUserPointsAndActivity).not.toHaveBeenCalled();
    });

    it('should handle zero points correctly', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 0,
          level: 1,
          currentLevelProgress: 0,
          nextLevelAt: 50,
        },
        activities: [],
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points.totalPoints).toBe(0);
      expect(data.points.level).toBe(1);
      expect(data.activities).toEqual([]);
    });

    it('should handle large point values', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 10000,
          level: 50,
          currentLevelProgress: 75,
          nextLevelAt: 10500,
        },
        activities: Array.from({ length: 100 }, (_, i) => ({
          id: `activity${i}`,
          type: 'task_completed_on_time',
          amount: 10,
          description: `Task ${i}`,
          createdAt: new Date(),
        })),
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points.totalPoints).toBe(10000);
      expect(data.activities.length).toBe(100);
    });

    it('should handle negative point activities (penalties)', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 45,
          level: 2,
          currentLevelProgress: 45,
          nextLevelAt: 100,
        },
        activities: [
          {
            id: 'activity1',
            type: 'task_completed_on_time',
            amount: 10,
            description: 'Completed task',
            createdAt: new Date('2025-11-28'),
          },
          {
            id: 'activity2',
            type: 'missed_deadline',
            amount: -5,
            description: 'Missed deadline',
            createdAt: new Date('2025-11-29'),
          },
        ],
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities[1].amount).toBe(-5);
      expect(data.activities[1].type).toBe('missed_deadline');
    });

    it('should handle database errors gracefully', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      mockGetUserPointsAndActivity.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching points data');
    });

    it('should handle getUserPointsAndActivity returning null', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      mockGetUserPointsAndActivity.mockResolvedValue(null as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.points).toBeNull();
      expect(data.activities).toBeNull();
    });

    it('should handle empty activities array', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 50,
          level: 2,
          currentLevelProgress: 0,
          nextLevelAt: 100,
        },
        activities: [],
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities).toEqual([]);
    });

    it('should preserve activity order', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockData = {
        points: {
          userId: mockUserId,
          totalPoints: 100,
          level: 3,
          currentLevelProgress: 0,
          nextLevelAt: 150,
        },
        activities: [
          {
            id: 'activity1',
            type: 'daily_checkin',
            amount: 5,
            description: 'First',
            createdAt: new Date('2025-11-27'),
          },
          {
            id: 'activity2',
            type: 'task_completed_on_time',
            amount: 10,
            description: 'Second',
            createdAt: new Date('2025-11-28'),
          },
          {
            id: 'activity3',
            type: 'task_completed_on_time',
            amount: 10,
            description: 'Third',
            createdAt: new Date('2025-11-29'),
          },
        ],
      };

      mockGetUserPointsAndActivity.mockResolvedValue(mockData);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activities[0].description).toBe('First');
      expect(data.activities[1].description).toBe('Second');
      expect(data.activities[2].description).toBe('Third');
    });

    it('should handle authentication errors', async () => {
      mockGetAuthenticatedUserId.mockRejectedValue(new Error('Auth service unavailable'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching points data');
    });
  });
});
