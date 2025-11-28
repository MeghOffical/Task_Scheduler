/**
 * Unit tests for points utilities
 */

import { awardPoints, hasClaimedDailyCheckinToday, getUserPointsAndActivity } from './points';

// Mock the database connection
jest.mock('./db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

// Mock the models
jest.mock('@/models', () => ({
  User: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  PointActivity: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

import { User, PointActivity } from '@/models';
import dbConnect from './db';

describe('Points Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('awardPoints', () => {
    it('should award points and create point activity', async () => {
      const mockUser = {
        _id: 'user123',
        points: 150,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 50,
        description: 'Completed task on time',
      });

      const result = await awardPoints({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 50,
        description: 'Completed task on time',
      });

      expect(dbConnect).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $inc: { points: 50 },
        },
        { new: true }
      );
      expect(PointActivity.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 50,
        description: 'Completed task on time',
      });
      expect(result).toBe(150);
    });

    it('should handle daily checkin and update lastDailyCheckinAt', async () => {
      const mockUser = {
        _id: 'user123',
        points: 110,
        lastDailyCheckinAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const result = await awardPoints({
        userId: 'user123',
        type: 'daily_checkin',
        amount: 10,
        description: 'Daily check-in bonus',
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          $inc: { points: 10 },
          $set: { lastDailyCheckinAt: expect.any(Date) },
        }),
        { new: true }
      );
      expect(result).toBe(110);
    });

    it('should handle negative points (penalties)', async () => {
      const mockUser = {
        _id: 'user123',
        points: 50,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const result = await awardPoints({
        userId: 'user123',
        type: 'missed_deadline',
        amount: -20,
        description: 'Missed deadline penalty',
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $inc: { points: -20 },
        },
        { new: true }
      );
      expect(result).toBe(50);
    });

    it('should clamp negative points to zero', async () => {
      const mockUser = {
        _id: 'user123',
        points: -10,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const result = await awardPoints({
        userId: 'user123',
        type: 'missed_deadline',
        amount: -50,
        description: 'Large penalty',
      });

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.points).toBe(0);
      expect(result).toBe(0);
    });

    it('should throw error when user not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        awardPoints({
          userId: 'nonexistent',
          type: 'task_completed_on_time',
          amount: 50,
          description: 'Test',
        })
      ).rejects.toThrow('User not found when awarding points');
    });

    it('should handle signup bonus', async () => {
      const mockUser = {
        _id: 'user123',
        points: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const result = await awardPoints({
        userId: 'user123',
        type: 'signup_bonus',
        amount: 100,
        description: 'Welcome bonus',
      });

      expect(result).toBe(100);
      expect(PointActivity.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'signup_bonus',
        amount: 100,
        description: 'Welcome bonus',
      });
    });

    it('should not update lastDailyCheckinAt for non-checkin types', async () => {
      const mockUser = {
        _id: 'user123',
        points: 150,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      await awardPoints({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 50,
        description: 'Task completed',
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $inc: { points: 50 },
        },
        { new: true }
      );
    });
  });

  describe('hasClaimedDailyCheckinToday', () => {
    it('should return false when lastDailyCheckinAt is null', () => {
      expect(hasClaimedDailyCheckinToday(null)).toBe(false);
    });

    it('should return false when lastDailyCheckinAt is undefined', () => {
      expect(hasClaimedDailyCheckinToday(undefined)).toBe(false);
    });

    it('should return true when checked in today', () => {
      const today = new Date();
      expect(hasClaimedDailyCheckinToday(today)).toBe(true);
    });

    it('should return false when checked in yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(hasClaimedDailyCheckinToday(yesterday)).toBe(false);
    });

    it('should return false when checked in last month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(hasClaimedDailyCheckinToday(lastMonth)).toBe(false);
    });

    it('should return false when checked in last year', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      expect(hasClaimedDailyCheckinToday(lastYear)).toBe(false);
    });

    it('should handle same day but earlier time', () => {
      const earlier = new Date();
      // Keep same year, month, and day but earlier hour
      earlier.setHours(0, 0, 0, 0);
      expect(hasClaimedDailyCheckinToday(earlier)).toBe(true);
    });

    it('should compare year, month, and day correctly', () => {
      const now = new Date();
      const sameDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      expect(hasClaimedDailyCheckinToday(sameDay)).toBe(true);
    });

    it('should handle date at end of month', () => {
      const endOfMonth = new Date(2024, 0, 31, 23, 59, 59); // Jan 31, 2024
      const currentDate = new Date();
      
      if (
        currentDate.getFullYear() === 2024 &&
        currentDate.getMonth() === 0 &&
        currentDate.getDate() === 31
      ) {
        expect(hasClaimedDailyCheckinToday(endOfMonth)).toBe(true);
      } else {
        expect(hasClaimedDailyCheckinToday(endOfMonth)).toBe(false);
      }
    });

    it('should handle date at start of month', () => {
      const startOfMonth = new Date(2024, 1, 1, 0, 0, 0); // Feb 1, 2024
      const currentDate = new Date();
      
      if (
        currentDate.getFullYear() === 2024 &&
        currentDate.getMonth() === 1 &&
        currentDate.getDate() === 1
      ) {
        expect(hasClaimedDailyCheckinToday(startOfMonth)).toBe(true);
      } else {
        expect(hasClaimedDailyCheckinToday(startOfMonth)).toBe(false);
      }
    });

    it('should handle leap year dates', () => {
      const leapDay = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
      const currentDate = new Date();
      
      if (
        currentDate.getFullYear() === 2024 &&
        currentDate.getMonth() === 1 &&
        currentDate.getDate() === 29
      ) {
        expect(hasClaimedDailyCheckinToday(leapDay)).toBe(true);
      } else {
        expect(hasClaimedDailyCheckinToday(leapDay)).toBe(false);
      }
    });
  });

  describe('getUserPointsAndActivity', () => {
    it('should fetch user points and activity with default limit', async () => {
      const mockActivities = [
        { userId: 'user123', type: 'task_completed_on_time', amount: 50, createdAt: new Date() },
        { userId: 'user123', type: 'daily_checkin', amount: 10, createdAt: new Date() },
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 200 }),
      });

      (PointActivity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockActivities),
      });

      const result = await getUserPointsAndActivity('user123');

      expect(dbConnect).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(PointActivity.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(result).toEqual({
        points: 200,
        activities: mockActivities,
      });
    });

    it('should fetch user points with custom limit', async () => {
      const mockActivities = [
        { userId: 'user123', type: 'task_completed_on_time', amount: 50, createdAt: new Date() },
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 150 }),
      });

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockActivities),
      };

      (PointActivity.find as jest.Mock).mockReturnValue(mockChain);

      const result = await getUserPointsAndActivity('user123', 10);

      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        points: 150,
        activities: mockActivities,
      });
    });

    it('should throw error when user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(getUserPointsAndActivity('nonexistent')).rejects.toThrow(
        'User not found when fetching points'
      );
    });

    it('should handle user with zero points', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 0 }),
      });

      (PointActivity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await getUserPointsAndActivity('user123');

      expect(result).toEqual({
        points: 0,
        activities: [],
      });
    });

    it('should handle user with undefined points', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: undefined }),
      });

      (PointActivity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await getUserPointsAndActivity('user123');

      expect(result.points).toBe(0);
    });

    it('should sort activities by createdAt descending', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 100 }),
      });

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (PointActivity.find as jest.Mock).mockReturnValue(mockChain);

      await getUserPointsAndActivity('user123');

      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return activities as lean objects', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 100 }),
      });

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (PointActivity.find as jest.Mock).mockReturnValue(mockChain);

      await getUserPointsAndActivity('user123');

      expect(mockChain.lean).toHaveBeenCalled();
    });

    it('should handle large activity history', async () => {
      const mockActivities = Array.from({ length: 100 }, (_, i) => ({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 10,
        createdAt: new Date(Date.now() - i * 86400000),
      }));

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', points: 1000 }),
      });

      (PointActivity.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockActivities),
      });

      const result = await getUserPointsAndActivity('user123', 100);

      expect(result.activities).toHaveLength(100);
    });
  });

  describe('PointActivityType validation', () => {
    it('should accept valid point activity types', async () => {
      const mockUser = {
        _id: 'user123',
        points: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const validTypes = [
        'signup_bonus',
        'daily_checkin',
        'task_completed_on_time',
        'missed_deadline',
      ] as const;

      for (const type of validTypes) {
        await awardPoints({
          userId: 'user123',
          type,
          amount: 10,
          description: `Test ${type}`,
        });
      }

      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(validTypes.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent point awards', async () => {
      const mockUser = {
        _id: 'user123',
        points: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const awards = [
        awardPoints({
          userId: 'user123',
          type: 'task_completed_on_time',
          amount: 50,
          description: 'Task 1',
        }),
        awardPoints({
          userId: 'user123',
          type: 'task_completed_on_time',
          amount: 30,
          description: 'Task 2',
        }),
      ];

      const results = await Promise.all(awards);
      expect(results).toHaveLength(2);
    });

    it('should handle very large point amounts', async () => {
      const mockUser = {
        _id: 'user123',
        points: 1000000,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (PointActivity.create as jest.Mock).mockResolvedValue({});

      const result = await awardPoints({
        userId: 'user123',
        type: 'task_completed_on_time',
        amount: 999999,
        description: 'Huge bonus',
      });

      expect(result).toBe(1000000);
    });

    it('should handle date edge cases around midnight', () => {
      const justBeforeMidnight = new Date();
      justBeforeMidnight.setHours(23, 59, 59, 999);
      
      const justAfterMidnight = new Date(justBeforeMidnight);
      justAfterMidnight.setDate(justAfterMidnight.getDate() + 1);
      justAfterMidnight.setHours(0, 0, 0, 0);

      // These should be different days
      expect(hasClaimedDailyCheckinToday(justBeforeMidnight)).not.toBe(
        hasClaimedDailyCheckinToday(justAfterMidnight)
      );
    });
  });
});
