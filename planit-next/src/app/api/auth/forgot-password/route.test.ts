/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';
import { User } from '@/models';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Mock dependencies
jest.mock('@/models');
jest.mock('@/lib/db');
jest.mock('crypto');
jest.mock('nodemailer');

describe('Forgot Password API Route', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockCrypto = crypto as jest.Mocked<typeof crypto>;
  const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
  const mockSendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    process.env.NODE_ENV = 'test';
    
    // Mock crypto.randomBytes
    (mockCrypto.randomBytes as jest.Mock) = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-reset-token-123'),
    });

    // Mock nodemailer
    mockNodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token for valid email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_USER = 'smtp@example.com';
      process.env.SMTP_PASSWORD = 'password';
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(data.message).toContain('password reset link has been sent');
    });

    it('should return 400 if email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should not reveal if user does not exist (security)', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('password reset link has been sent');
    });

    it('should not allow reset for Google OAuth users', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user123',
        email: 'google@example.com',
        provider: 'google',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'google@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('password reset link has been sent');
    });

    it('should handle SMTP configuration missing in development', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_USER = '';
      process.env.SMTP_PASSWORD = '';
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resetUrl).toBeDefined();
      expect(data.resetToken).toBeDefined();
    });

    it('should handle email sending failure in development', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_USER = 'smtp@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.NODE_ENV = 'development';
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resetUrl).toBeDefined();
      expect(data.emailError).toBeDefined();
    });

    it('should handle email sending failure in production', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_USER = 'smtp@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.NODE_ENV = 'production';
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('password reset link has been sent');
      expect(data.resetUrl).toBeUndefined(); // Should not expose URL in production
    });

    it('should set token expiry to 1 hour', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_USER = 'smtp@example.com';
      process.env.SMTP_PASSWORD = 'password';
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      await POST(request);

      expect(mockUser.resetPasswordToken).toBe('mock-reset-token-123');
      expect(mockUser.resetPasswordExpires).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error');
    });

    it('should handle user save errors', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        provider: 'credentials',
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server error');
    });

    it('should use custom SMTP configuration when provided', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'credentials',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      process.env.SMTP_HOST = 'custom.smtp.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'custom@example.com';
      process.env.SMTP_PASSWORD = 'password';
      process.env.SMTP_FROM = 'noreply@example.com';
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      await POST(request);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'custom.smtp.com',
        port: 465,
        secure: true,
        auth: {
          user: 'custom@example.com',
          pass: 'password',
        },
      });
    });
  });
});
