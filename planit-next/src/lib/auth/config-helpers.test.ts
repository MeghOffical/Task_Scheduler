/**
 * Unit tests for auth config helper functions
 * These tests cover the logic extracted from config.ts without mongoose dependencies
 */

import {
  getCookieName,
  generateUsername,
  isSameOrigin,
  getRedirectUrl,
  hasValidCredentials,
  getCookieOptions,
  shouldLinkAccount,
  buildOAuthUserData,
} from './config-helpers';

describe('Auth Config Helpers', () => {
  describe('getCookieName', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return base name in development', () => {
      process.env.NODE_ENV = 'development';
      expect(getCookieName('session-token')).toBe('session-token');
    });

    it('should add __Secure- prefix in production', () => {
      process.env.NODE_ENV = 'production';
      expect(getCookieName('session-token')).toBe('__Secure-session-token');
    });

    it('should add __Host- prefix when specified', () => {
      process.env.NODE_ENV = 'production';
      expect(getCookieName('csrf-token', 'host')).toBe('__Host-csrf-token');
    });

    it('should use secure prefix by default in production', () => {
      process.env.NODE_ENV = 'production';
      expect(getCookieName('callback-url')).toBe('__Secure-callback-url');
    });

    it('should return base name in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(getCookieName('test-cookie')).toBe('test-cookie');
    });
  });

  describe('generateUsername', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should generate username from email', () => {
      const username = generateUsername('test@example.com');
      expect(username).toBe('test_1234567890');
    });

    it('should handle email with dots', () => {
      const username = generateUsername('john.doe@example.com');
      expect(username).toBe('john.doe_1234567890');
    });

    it('should handle email with plus sign', () => {
      const username = generateUsername('user+tag@example.com');
      expect(username).toBe('user+tag_1234567890');
    });

    it('should handle email with numbers', () => {
      const username = generateUsername('user123@example.com');
      expect(username).toBe('user123_1234567890');
    });

    it('should create unique usernames with different timestamps', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const username1 = generateUsername('test@example.com');
      const username2 = generateUsername('test@example.com');

      expect(username1).toBe('test_1000');
      expect(username2).toBe('test_2000');
      expect(username1).not.toBe(username2);
    });
  });

  describe('isSameOrigin', () => {
    it('should return true for same origin URLs', () => {
      expect(isSameOrigin(
        'http://localhost:3000/dashboard',
        'http://localhost:3000'
      )).toBe(true);
    });

    it('should return true for same origin with different paths', () => {
      expect(isSameOrigin(
        'http://localhost:3000/tasks',
        'http://localhost:3000/dashboard'
      )).toBe(true);
    });

    it('should return false for different origins', () => {
      expect(isSameOrigin(
        'http://malicious.com',
        'http://localhost:3000'
      )).toBe(false);
    });

    it('should return false for different ports', () => {
      expect(isSameOrigin(
        'http://localhost:3001',
        'http://localhost:3000'
      )).toBe(false);
    });

    it('should return false for different protocols', () => {
      expect(isSameOrigin(
        'https://localhost:3000',
        'http://localhost:3000'
      )).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isSameOrigin('not-a-url', 'http://localhost:3000')).toBe(false);
    });

    it('should return false when baseUrl is invalid', () => {
      expect(isSameOrigin('http://localhost:3000', 'invalid')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(isSameOrigin(
        'http://localhost:3000/page?param=value',
        'http://localhost:3000'
      )).toBe(true);
    });

    it('should handle URLs with hash fragments', () => {
      expect(isSameOrigin(
        'http://localhost:3000/page#section',
        'http://localhost:3000'
      )).toBe(true);
    });
  });

  describe('getRedirectUrl', () => {
    const baseUrl = 'http://localhost:3000';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    afterEach(() => {
      consoleErrorSpy.mockClear();
    });

    afterAll(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should redirect to dashboard for base URL', () => {
      expect(getRedirectUrl(baseUrl, baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should redirect to dashboard for base URL with trailing slash', () => {
      expect(getRedirectUrl(`${baseUrl}/`, baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should redirect to dashboard for login page', () => {
      expect(getRedirectUrl(`${baseUrl}/login`, baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should redirect to dashboard for register page', () => {
      expect(getRedirectUrl(`${baseUrl}/register`, baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should handle relative URLs', () => {
      expect(getRedirectUrl('/tasks', baseUrl)).toBe(`${baseUrl}/tasks`);
    });

    it('should handle relative URLs with query params', () => {
      expect(getRedirectUrl('/tasks?filter=active', baseUrl)).toBe(`${baseUrl}/tasks?filter=active`);
    });

    it('should allow same-origin absolute URLs', () => {
      const url = `${baseUrl}/dashboard/settings`;
      expect(getRedirectUrl(url, baseUrl)).toBe(url);
    });

    it('should redirect to dashboard for different origin', () => {
      expect(getRedirectUrl('http://malicious.com', baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should redirect to dashboard for external HTTPS URLs', () => {
      expect(getRedirectUrl('https://external.com', baseUrl)).toBe(`${baseUrl}/dashboard`);
    });

    it('should handle invalid URLs gracefully', () => {
      const result = getRedirectUrl('not-a-valid-url', baseUrl);
      // URL logic treats paths containing 'login' or 'register' as auth pages
      expect(result).toBe(`${baseUrl}/dashboard`);
    });

    it('should preserve query parameters in same-origin URLs', () => {
      const url = `${baseUrl}/tasks?status=completed&sort=date`;
      expect(getRedirectUrl(url, baseUrl)).toBe(url);
    });

    it('should preserve hash in same-origin URLs', () => {
      const url = `${baseUrl}/dashboard#settings`;
      expect(getRedirectUrl(url, baseUrl)).toBe(url);
    });

    it('should handle URL with both query and hash', () => {
      const url = `${baseUrl}/page?param=value#section`;
      expect(getRedirectUrl(url, baseUrl)).toBe(url);
    });

    it('should redirect data URLs to dashboard', () => {
      const result = getRedirectUrl('data:text/html,<h1>test</h1>', baseUrl);
      // data: URLs are treated as external/different origin
      expect(result).toBe(`${baseUrl}/dashboard`);
    });

    it('should redirect javascript URLs to dashboard', () => {
      const result = getRedirectUrl('javascript:alert(1)', baseUrl);
      // javascript: protocol URLs are treated as different origin
      expect(result).toBe(`${baseUrl}/dashboard`);
    });
  });

  describe('hasValidCredentials', () => {
    it('should return true for valid credentials', () => {
      expect(hasValidCredentials({
        email: 'test@example.com',
        password: 'password123'
      })).toBe(true);
    });

    it('should return false when email is missing', () => {
      expect(hasValidCredentials({
        password: 'password123'
      })).toBe(false);
    });

    it('should return false when password is missing', () => {
      expect(hasValidCredentials({
        email: 'test@example.com'
      })).toBe(false);
    });

    it('should return false when both are missing', () => {
      expect(hasValidCredentials({})).toBe(false);
    });

    it('should return false for null credentials', () => {
      expect(hasValidCredentials(null)).toBe(false);
    });

    it('should return false for undefined credentials', () => {
      expect(hasValidCredentials(undefined)).toBe(false);
    });

    it('should return false when email is empty string', () => {
      expect(hasValidCredentials({
        email: '',
        password: 'password123'
      })).toBe(false);
    });

    it('should return false when password is empty string', () => {
      expect(hasValidCredentials({
        email: 'test@example.com',
        password: ''
      })).toBe(false);
    });

    it('should return false when both are empty strings', () => {
      expect(hasValidCredentials({
        email: '',
        password: ''
      })).toBe(false);
    });

    it('should handle credentials with extra fields', () => {
      expect(hasValidCredentials({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      })).toBe(true);
    });
  });

  describe('getCookieOptions', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return base options without maxAge', () => {
      process.env.NODE_ENV = 'development';
      const options = getCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      });
    });

    it('should include maxAge when provided', () => {
      process.env.NODE_ENV = 'development';
      const options = getCookieOptions(900);

      expect(options).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 900,
      });
    });

    it('should set secure to true in production', () => {
      process.env.NODE_ENV = 'production';
      const options = getCookieOptions();

      expect(options.secure).toBe(true);
    });

    it('should set secure to false in development', () => {
      process.env.NODE_ENV = 'development';
      const options = getCookieOptions();

      expect(options.secure).toBe(false);
    });

    it('should set secure to false in test', () => {
      process.env.NODE_ENV = 'test';
      const options = getCookieOptions();

      expect(options.secure).toBe(false);
    });

    it('should handle maxAge of 0', () => {
      const options = getCookieOptions(0);
      expect(options.maxAge).toBe(0);
    });

    it('should always set httpOnly to true', () => {
      process.env.NODE_ENV = 'production';
      expect(getCookieOptions().httpOnly).toBe(true);
      
      process.env.NODE_ENV = 'development';
      expect(getCookieOptions().httpOnly).toBe(true);
    });

    it('should always use lax sameSite', () => {
      process.env.NODE_ENV = 'production';
      expect(getCookieOptions().sameSite).toBe('lax');
      
      process.env.NODE_ENV = 'development';
      expect(getCookieOptions().sameSite).toBe('lax');
    });
  });

  describe('shouldLinkAccount', () => {
    it('should allow linking when no existing provider', () => {
      expect(shouldLinkAccount(undefined, 'google')).toBe(true);
    });

    it('should allow linking when existing provider matches', () => {
      expect(shouldLinkAccount('google', 'google')).toBe(true);
    });

    it('should allow linking from credentials to OAuth', () => {
      expect(shouldLinkAccount('credentials', 'google')).toBe(true);
    });

    it('should not allow linking from one OAuth to another', () => {
      expect(shouldLinkAccount('github', 'google')).toBe(false);
    });

    it('should handle empty string provider', () => {
      // Empty string is truthy check fails, so it allows linking
      expect(shouldLinkAccount('', 'google')).toBe(true);
    });

    it('should be case sensitive for provider names', () => {
      expect(shouldLinkAccount('Google', 'google')).toBe(false);
    });

    it('should handle credentials to credentials', () => {
      expect(shouldLinkAccount('credentials', 'credentials')).toBe(true);
    });
  });

  describe('buildOAuthUserData', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should build complete user data', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        'Test User',
        'https://example.com/avatar.jpg',
        'google',
        'google123'
      );

      expect(userData).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        provider: 'google',
        providerId: 'google123',
        username: 'test_1234567890',
      });
    });

    it('should handle null name', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        null,
        'https://example.com/avatar.jpg',
        'google',
        'google123'
      );

      expect(userData.name).toBeNull();
    });

    it('should handle undefined name', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        undefined,
        'https://example.com/avatar.jpg',
        'google',
        'google123'
      );

      expect(userData.name).toBeUndefined();
    });

    it('should handle null image', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        'Test User',
        null,
        'google',
        'google123'
      );

      expect(userData.image).toBeNull();
    });

    it('should handle undefined image', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        'Test User',
        undefined,
        'google',
        'google123'
      );

      expect(userData.image).toBeUndefined();
    });

    it('should generate username from email', () => {
      const userData = buildOAuthUserData(
        'john.doe@example.com',
        'John Doe',
        null,
        'github',
        'github456'
      );

      expect(userData.username).toBe('john.doe_1234567890');
    });

    it('should handle different providers', () => {
      const userData = buildOAuthUserData(
        'test@example.com',
        'Test User',
        null,
        'github',
        'github789'
      );

      expect(userData.provider).toBe('github');
      expect(userData.providerId).toBe('github789');
    });

    it('should create unique usernames for same email', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const userData1 = buildOAuthUserData(
        'test@example.com',
        'Test User',
        null,
        'google',
        'google1'
      );

      const userData2 = buildOAuthUserData(
        'test@example.com',
        'Test User',
        null,
        'github',
        'github1'
      );

      expect(userData1.username).toBe('test_1000');
      expect(userData2.username).toBe('test_2000');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete OAuth flow data', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      
      const email = 'newuser@example.com';
      const name = 'New User';
      const image = 'https://example.com/photo.jpg';
      
      const userData = buildOAuthUserData(email, name, image, 'google', 'google123');
      const cookieOptions = getCookieOptions(900);
      const redirectUrl = getRedirectUrl('/login', 'http://localhost:3000');

      expect(userData.email).toBe(email);
      expect(userData.username).toBe('newuser_1234567890');
      expect(cookieOptions.httpOnly).toBe(true);
      expect(redirectUrl).toBe('http://localhost:3000/dashboard');
    });

    it('should validate and process credentials', () => {
      const validCreds = { email: 'test@example.com', password: 'pass123' };
      const invalidCreds = { email: 'test@example.com' };

      expect(hasValidCredentials(validCreds)).toBe(true);
      expect(hasValidCredentials(invalidCreds)).toBe(false);
    });

    it('should handle account linking decision', () => {
      // New OAuth user
      expect(shouldLinkAccount(undefined, 'google')).toBe(true);
      
      // Credentials user linking to OAuth
      expect(shouldLinkAccount('credentials', 'google')).toBe(true);
      
      // OAuth user trying different OAuth
      expect(shouldLinkAccount('github', 'google')).toBe(false);
    });
  });
});
