/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { User } from '@/models';
import { comparePasswords, createToken } from '@/lib/auth';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth');
jest.mock('@/lib/db');
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}));

describe('Login API Route', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockComparePasswords = comparePasswords as jest.MockedFunction<typeof comparePasswords>;
  const mockCreateToken = createToken as jest.MockedFunction<typeof createToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(true);
      mockCreateToken.mockResolvedValue('mock-jwt-token');

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockComparePasswords).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockCreateToken).toHaveBeenCalledWith({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toEqual({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email and password are required');
    });

    it('should return 400 when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid credentials');
    });

    it('should return 400 when password is incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid credentials');
    });

    it('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error during login');
    });

    it('should handle token creation errors', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(true);
      mockCreateToken.mockRejectedValue(new Error('Token creation failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error during login');
    });
  });
});
