/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PUT } from './route';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import { User } from '@/models';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/db');
jest.mock('@/models');
jest.mock('@/lib/auth/config');

describe('Settings API Route', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET /api/settings', () => {
    it('should return user pomodoro settings', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const mockUser = {
        email: 'test@example.com',
        pomodoroSettings: {
          workDuration: 30,
          shortBreakDuration: 10,
          longBreakDuration: 20,
          longBreakInterval: 4,
        },
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(response.status).toBe(200);
      expect(data.pomodoroSettings).toEqual(mockUser.pomodoroSettings);
    });

    it('should return default settings if user has no custom settings', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const mockUser = {
        email: 'test@example.com',
        pomodoroSettings: null,
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pomodoroSettings).toEqual({
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch settings');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update pomodoro settings', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const updatedSettings = {
        workDuration: 40,
        shortBreakDuration: 8,
        longBreakDuration: 25,
        longBreakInterval: 3,
      };

      const mockUser = {
        email: 'test@example.com',
        pomodoroSettings: updatedSettings,
        username: 'testuser',
      };

      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ pomodoroSettings: updatedSettings }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { $set: { pomodoroSettings: updatedSettings } },
        { new: true }
      );
      expect(response.status).toBe(200);
      expect(data.pomodoroSettings).toEqual(updatedSettings);
    });

    it('should update username', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const mockUser = {
        email: 'test@example.com',
        username: 'newusername',
        pomodoroSettings: {},
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ username: 'newusername' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.username).toBe('newusername');
    });

    it('should return 400 when username is already taken', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const existingUser = {
        email: 'other@example.com',
        username: 'existinguser',
      };

      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ username: 'existinguser' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username already taken');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ pomodoroSettings: {} }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 400 when no valid settings provided', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No valid settings provided for update');
    });

    it('should return 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ username: 'newuser' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});
