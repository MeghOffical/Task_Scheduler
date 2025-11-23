import { authConfig } from './config';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { comparePasswords } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/models');
jest.mock('@/lib/auth');

describe('Auth Config', () => {
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
  const mockComparePasswords = comparePasswords as jest.MockedFunction<typeof comparePasswords>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('authConfig structure', () => {
    it('should have secret configured', () => {
      expect(authConfig.secret).toBeDefined();
    });

    it('should have providers array', () => {
      expect(authConfig.providers).toBeDefined();
      expect(Array.isArray(authConfig.providers)).toBe(true);
      expect(authConfig.providers.length).toBeGreaterThan(0);
    });

    it('should have session configuration', () => {
      expect(authConfig.session).toBeDefined();
      expect(authConfig.session?.strategy).toBe('jwt');
      expect(authConfig.session?.maxAge).toBe(24 * 60 * 60);
    });

    it('should have pages configuration', () => {
      expect(authConfig.pages).toBeDefined();
      expect(authConfig.pages?.signIn).toBe('/login');
      expect(authConfig.pages?.error).toBe('/login');
    });

    it('should have cookies configuration', () => {
      expect(authConfig.cookies).toBeDefined();
      expect(authConfig.cookies?.sessionToken).toBeDefined();
      expect(authConfig.cookies?.callbackUrl).toBeDefined();
      expect(authConfig.cookies?.csrfToken).toBeDefined();
    });
  });

  describe('Credentials Provider', () => {
    let credentialsProvider: any;

    beforeEach(() => {
      credentialsProvider = authConfig.providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'credentials'
      );
    });

    it('should have credentials provider configured', () => {
      expect(credentialsProvider).toBeDefined();
    });

    it('should authorize valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(true);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockComparePasswords).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should reject when email is missing', async () => {
      const credentials = {
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(result).toBeNull();
    });

    it('should reject when password is missing', async () => {
      const credentials = {
        email: 'test@example.com',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(result).toBeNull();
    });

    it('should reject when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(result).toBeNull();
    });

    it('should reject when password is invalid', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockComparePasswords.mockResolvedValue(false);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials);

      expect(result).toBeNull();
    });
  });

  describe('Google Provider', () => {
    it('should have Google provider configured', () => {
      const googleProvider = authConfig.providers.find(
        (p: any) => p.id === 'google'
      );

      expect(googleProvider).toBeDefined();
    });
  });

  describe('Cookie Configuration', () => {
    it('should configure session token cookie correctly', () => {
      const sessionTokenConfig = authConfig.cookies?.sessionToken;
      
      expect(sessionTokenConfig).toBeDefined();
      expect(sessionTokenConfig?.options.httpOnly).toBe(true);
      expect(sessionTokenConfig?.options.sameSite).toBe('lax');
      expect(sessionTokenConfig?.options.path).toBe('/');
    });

    it('should configure callback URL cookie correctly', () => {
      const callbackUrlConfig = authConfig.cookies?.callbackUrl;
      
      expect(callbackUrlConfig).toBeDefined();
      expect(callbackUrlConfig?.options.httpOnly).toBe(true);
      expect(callbackUrlConfig?.options.sameSite).toBe('lax');
      expect(callbackUrlConfig?.options.path).toBe('/');
    });

    it('should configure CSRF token cookie correctly', () => {
      const csrfTokenConfig = authConfig.cookies?.csrfToken;
      
      expect(csrfTokenConfig).toBeDefined();
      expect(csrfTokenConfig?.options.httpOnly).toBe(true);
      expect(csrfTokenConfig?.options.sameSite).toBe('lax');
      expect(csrfTokenConfig?.options.path).toBe('/');
    });

    it('should configure PKCE code verifier cookie correctly', () => {
      const pkceConfig = authConfig.cookies?.pkceCodeVerifier;
      
      expect(pkceConfig).toBeDefined();
      expect(pkceConfig?.options.httpOnly).toBe(true);
      expect(pkceConfig?.options.sameSite).toBe('lax');
      expect(pkceConfig?.options.path).toBe('/');
      expect(pkceConfig?.options.maxAge).toBe(60 * 15);
    });
  });
});
