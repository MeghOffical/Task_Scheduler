import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { jwtVerify } from 'jose';

// Mock jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

describe('middleware', () => {
  const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('root path redirection', () => {
    it('should redirect authenticated users from / to /dashboard with auth_token', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const mockCookies = new Map([['auth_token', 'valid-token']]);
      
      // Mock cookies.get
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect authenticated users from / to /dashboard with NextAuth session', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const mockCookies = new Map([['next-auth.session-token', 'session-token']]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should allow unauthenticated users to access /', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      jest.spyOn(request.cookies, 'get').mockReturnValue(undefined);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('/home redirection', () => {
    it('should redirect /home to /dashboard', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/home'));
      jest.spyOn(request.cookies, 'get').mockReturnValue(undefined);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('public routes', () => {
    const publicPaths = [
      '/_next/static/test.js',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/api/auth/login',
    ];

    it.each(publicPaths)('should allow access to public route: %s', async (path) => {
      const request = new NextRequest(new URL(`http://localhost:3000${path}`));
      jest.spyOn(request.cookies, 'get').mockReturnValue(undefined);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('protected routes with auth_token', () => {
    it('should allow access with valid auth_token', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const mockCookies = new Map([['auth_token', 'valid-token']]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      mockJwtVerify.mockResolvedValue({
        payload: { id: '123', username: 'test' },
        protectedHeader: {},
      } as any);

      const response = await middleware(request);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should check NextAuth session when auth_token is invalid', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const mockCookies = new Map([
        ['auth_token', 'invalid-token'],
        ['next-auth.session-token', 'session-token']
      ]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('protected routes with NextAuth session', () => {
    it('should allow access with production NextAuth session token', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/tasks'));
      const mockCookies = new Map([['__Secure-next-auth.session-token', 'session-token']]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access with development NextAuth session token', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/pomodoro'));
      const mockCookies = new Map([['next-auth.session-token', 'session-token']]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('unauthenticated access to protected routes', () => {
    it('should redirect unauthenticated users to /', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      jest.spyOn(request.cookies, 'get').mockReturnValue(undefined);

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/');
    });

    it('should redirect when auth_token is invalid and no NextAuth session', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/tasks'));
      const mockCookies = new Map([['auth_token', 'invalid-token']]);
      
      jest.spyOn(request.cookies, 'get').mockImplementation((name) => ({
        name,
        value: mockCookies.get(name) || '',
      }) as any);

      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/');
    });
  });
});
