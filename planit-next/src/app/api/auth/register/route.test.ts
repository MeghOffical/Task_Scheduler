import { NextRequest } from 'next/server';
import { POST } from './route';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/auth');
jest.mock('@/lib/db');

describe('Register API Route', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'newuser123',
        username: 'newuser',
        email: 'new@example.com',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          profession: 'Developer',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'new@example.com' }, { username: 'newuser' }],
      });
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(User.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed-password',
        profession: 'Developer',
      });
      expect(response.status).toBe(201);
      expect(data.message).toBe('User registered successfully!');
    });

    it('should return 400 when username is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Username, email, and password are required');
    });

    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Username, email, and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Username, email, and password are required');
    });

    it('should return 400 when username already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing123',
        username: 'existinguser',
        email: 'existing@example.com',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Username or email already exists');
    });

    it('should return 400 when email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing123',
        username: 'anotheruser',
        email: 'existing@example.com',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Username or email already exists');
    });

    it('should register without profession field', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'newuser123',
        username: 'newuser',
        email: 'new@example.com',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(User.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed-password',
        profession: undefined,
      });
      expect(response.status).toBe(201);
    });

    it('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error during registration');
    });

    it('should handle password hashing errors', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      mockHashPassword.mockRejectedValue(new Error('Hashing failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error during registration');
    });
  });
});
