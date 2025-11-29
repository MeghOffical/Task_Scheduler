/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth');
jest.mock('@/lib/db');

describe('Reset Password API Route', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'old-hashed-password',
        provider: 'credentials',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('new-hashed-password');

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: { $gt: expect.any(Date) },
      });
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword123');
      expect(mockUser.password).toBe('new-hashed-password');
      expect(mockUser.resetPasswordToken).toBeNull();
      expect(mockUser.resetPasswordExpires).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.message).toBe('Password reset successfully');
    });

    it('should return 400 if token is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ password: 'newPassword123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Token and password are required');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Token and password are required');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 if password is too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'short',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Password must be at least 8 characters long');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for expired token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      // The query itself will return null for expired tokens due to $gt filter
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'expired-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for Google OAuth users', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'google@example.com',
        provider: 'google',
        password: null,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Google OAuth users cannot reset password through this method');
    });

    it('should return 400 for users without password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        provider: 'credentials',
        password: null,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Cannot reset password for an account without a password.');
    });

    it('should handle database errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error');
    });

    it('should handle hashing errors', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'old-hashed-password',
        provider: 'credentials',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockHashPassword.mockRejectedValue(new Error('Hashing failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error');
    });

    it('should handle save errors', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'old-hashed-password',
        provider: 'credentials',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('new-hashed-password');

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: 'newPassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error');
    });

    it('should accept password exactly 8 characters', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'old-hashed-password',
        provider: 'credentials',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockHashPassword.mockResolvedValue('new-hashed-password');

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token',
          password: '12345678', // exactly 8 characters
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Password reset successfully');
    });
  });
});
