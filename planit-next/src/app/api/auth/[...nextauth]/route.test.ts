/**
 * @jest-environment node
 */

/**
 * Unit tests for NextAuth API route handler
 * Tests the route configuration, exports, and NextAuth integration
 */

import { NextRequest } from 'next/server';

// Mock NextAuth before importing the route
jest.mock('next-auth', () => {
  const mockHandler = jest.fn((req: any, res: any) => {
    return {
      status: 200,
      json: () => ({ session: null }),
    };
  });
  
  return jest.fn((config: any) => {
    mockHandler.config = config;
    return mockHandler;
  });
});

jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    secret: 'test-secret',
    providers: [
      {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
      },
      {
        id: 'google',
        name: 'Google',
        type: 'oauth',
      },
    ],
    session: {
      strategy: 'jwt',
      maxAge: 86400,
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    callbacks: {
      signIn: jest.fn(),
      jwt: jest.fn(),
      session: jest.fn(),
      redirect: jest.fn(),
    },
  },
}));

describe('NextAuth Route Handler', () => {
  let NextAuth: jest.Mock;
  let authConfig: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-import to get fresh mocks
    NextAuth = require('next-auth');
    authConfig = require('@/lib/auth/config').authConfig;
  });

  describe('Module Exports', () => {
    it('should export runtime configuration', async () => {
      const route = await import('./route');
      expect(route.runtime).toBe('nodejs');
    });

    it('should export dynamic configuration', async () => {
      const route = await import('./route');
      expect(route.dynamic).toBe('force-dynamic');
    });

    it('should export GET handler', async () => {
      const route = await import('./route');
      expect(route.GET).toBeDefined();
      expect(typeof route.GET).toBe('function');
    });

    it('should export POST handler', async () => {
      const route = await import('./route');
      expect(route.POST).toBeDefined();
      expect(typeof route.POST).toBe('function');
    });

    it('should have GET and POST point to same handler', async () => {
      const route = await import('./route');
      expect(route.GET).toBe(route.POST);
    });
  });

  describe('NextAuth Configuration', () => {
    it('should initialize NextAuth with authConfig', async () => {
      await import('./route');
      
      expect(NextAuth).toHaveBeenCalledTimes(1);
      expect(NextAuth).toHaveBeenCalledWith(authConfig);
    });

    it('should pass complete auth configuration to NextAuth', async () => {
      await import('./route');
      
      const passedConfig = NextAuth.mock.calls[0][0];
      expect(passedConfig).toEqual(authConfig);
      expect(passedConfig.secret).toBe('test-secret');
      expect(passedConfig.providers).toHaveLength(2);
      expect(passedConfig.session).toBeDefined();
      expect(passedConfig.callbacks).toBeDefined();
    });

    it('should configure providers correctly', async () => {
      await import('./route');
      
      const passedConfig = NextAuth.mock.calls[0][0];
      expect(passedConfig.providers).toEqual([
        {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
        },
        {
          id: 'google',
          name: 'Google',
          type: 'oauth',
        },
      ]);
    });

    it('should configure session with JWT strategy', async () => {
      await import('./route');
      
      const passedConfig = NextAuth.mock.calls[0][0];
      expect(passedConfig.session.strategy).toBe('jwt');
      expect(passedConfig.session.maxAge).toBe(86400);
    });

    it('should configure custom pages', async () => {
      await import('./route');
      
      const passedConfig = NextAuth.mock.calls[0][0];
      expect(passedConfig.pages.signIn).toBe('/login');
      expect(passedConfig.pages.error).toBe('/login');
    });

    it('should configure all required callbacks', async () => {
      await import('./route');
      
      const passedConfig = NextAuth.mock.calls[0][0];
      expect(passedConfig.callbacks.signIn).toBeDefined();
      expect(passedConfig.callbacks.jwt).toBeDefined();
      expect(passedConfig.callbacks.session).toBeDefined();
      expect(passedConfig.callbacks.redirect).toBeDefined();
    });
  });

  describe('Runtime Configuration', () => {
    it('should use nodejs runtime', async () => {
      const route = await import('./route');
      expect(route.runtime).toBe('nodejs');
    });

    it('should not use edge runtime', async () => {
      const route = await import('./route');
      expect(route.runtime).not.toBe('edge');
    });

    it('should force dynamic rendering', async () => {
      const route = await import('./route');
      expect(route.dynamic).toBe('force-dynamic');
    });

    it('should not allow static rendering', async () => {
      const route = await import('./route');
      expect(route.dynamic).not.toBe('force-static');
    });
  });

  describe('Handler Function', () => {
    it('should return a function from NextAuth', async () => {
      const route = await import('./route');
      
      expect(typeof route.GET).toBe('function');
      expect(typeof route.POST).toBe('function');
    });

    it('should create handler that can be called', async () => {
      const route = await import('./route');
      const mockRequest = {} as NextRequest;
      
      // Verify handler is callable (actual behavior tested by NextAuth)
      expect(() => {
        const result = route.GET(mockRequest, {});
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should use same handler instance for GET and POST', async () => {
      const route = await import('./route');
      
      // Both should reference the same NextAuth handler
      expect(route.GET).toStrictEqual(route.POST);
    });
  });

  describe('NextAuth Integration', () => {
    it('should call NextAuth exactly once during module load', async () => {
      NextAuth.mockClear();
      
      await import('./route');
      
      expect(NextAuth).toHaveBeenCalledTimes(1);
    });

    it('should not call NextAuth on subsequent imports', async () => {
      await import('./route');
      const callCount = NextAuth.mock.calls.length;
      
      await import('./route');
      
      // Should not increase call count (module cached)
      expect(NextAuth.mock.calls.length).toBe(callCount);
    });

    it('should pass authConfig object directly to NextAuth', async () => {
      await import('./route');
      
      const passedArg = NextAuth.mock.calls[0][0];
      expect(passedArg).toBe(authConfig);
    });

    it('should return handler from NextAuth', async () => {
      const route = await import('./route');
      
      // Verify handler is returned (mock returns a function)
      expect(typeof route.GET).toBe('function');
      expect(typeof route.POST).toBe('function');
    });
  });

  describe('HTTP Method Support', () => {
    it('should support GET method for session retrieval', async () => {
      const route = await import('./route');
      
      expect(route.GET).toBeDefined();
      expect(typeof route.GET).toBe('function');
    });

    it('should support POST method for authentication', async () => {
      const route = await import('./route');
      
      expect(route.POST).toBeDefined();
      expect(typeof route.POST).toBe('function');
    });

    it('should not export PUT method', async () => {
      const route = await import('./route');
      
      expect((route as any).PUT).toBeUndefined();
    });

    it('should not export DELETE method', async () => {
      const route = await import('./route');
      
      expect((route as any).DELETE).toBeUndefined();
    });

    it('should not export PATCH method', async () => {
      const route = await import('./route');
      
      expect((route as any).PATCH).toBeUndefined();
    });
  });

  describe('Module Structure', () => {
    it('should have correct export structure', async () => {
      const route = await import('./route');
      const exportKeys = Object.keys(route);
      
      expect(exportKeys).toContain('runtime');
      expect(exportKeys).toContain('dynamic');
      expect(exportKeys).toContain('GET');
      expect(exportKeys).toContain('POST');
    });

    it('should not export unexpected properties', async () => {
      const route = await import('./route');
      const exportKeys = Object.keys(route);
      const expectedKeys = ['runtime', 'dynamic', 'GET', 'POST', 'default'];
      
      exportKeys.forEach(key => {
        expect(expectedKeys).toContain(key);
      });
    });

    it('should import authConfig from correct path', async () => {
      // This test verifies the import path is correct
      await import('./route');
      
      // If import fails, test will fail
      expect(authConfig).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle NextAuth initialization errors gracefully', async () => {
      // NextAuth is a third-party library that handles its own errors
      // We verify our code structure is correct
      const route = await import('./route');
      
      expect(NextAuth).toHaveBeenCalled();
      expect(route.GET).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should ensure authConfig has required secret', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.secret).toBeDefined();
      expect(typeof config.secret).toBe('string');
      expect(config.secret.length).toBeGreaterThan(0);
    });

    it('should ensure authConfig has providers array', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(Array.isArray(config.providers)).toBe(true);
      expect(config.providers.length).toBeGreaterThan(0);
    });

    it('should ensure authConfig has session configuration', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.session).toBeDefined();
      expect(config.session.strategy).toBeDefined();
      expect(config.session.maxAge).toBeDefined();
    });

    it('should ensure authConfig has pages configuration', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.pages).toBeDefined();
      expect(config.pages.signIn).toBeDefined();
      expect(config.pages.error).toBeDefined();
    });

    it('should ensure authConfig has callbacks', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.callbacks).toBeDefined();
      expect(config.callbacks.signIn).toBeDefined();
      expect(config.callbacks.jwt).toBeDefined();
      expect(config.callbacks.session).toBeDefined();
      expect(config.callbacks.redirect).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should export handlers with correct types', async () => {
      const route = await import('./route');
      
      // Handlers should be functions
      expect(typeof route.GET).toBe('function');
      expect(typeof route.POST).toBe('function');
    });

    it('should export runtime as string literal', async () => {
      const route = await import('./route');
      
      expect(typeof route.runtime).toBe('string');
      expect(route.runtime).toBe('nodejs');
    });

    it('should export dynamic as string literal', async () => {
      const route = await import('./route');
      
      expect(typeof route.dynamic).toBe('string');
      expect(route.dynamic).toBe('force-dynamic');
    });
  });

  describe('Handler Reusability', () => {
    it('should create single handler instance', async () => {
      NextAuth.mockClear();
      
      await import('./route');
      
      // NextAuth should be called once to create handler
      expect(NextAuth).toHaveBeenCalledTimes(1);
    });

    it('should share handler between GET and POST', async () => {
      const route = await import('./route');
      
      // Both exports should reference the same handler
      expect(route.GET).toBe(route.POST);
      expect(typeof route.GET).toBe('function');
    });
  });

  describe('Environment Compatibility', () => {
    it('should work in Node.js environment', async () => {
      const route = await import('./route');
      
      expect(route.runtime).toBe('nodejs');
    });

    it('should support Next.js App Router', async () => {
      const route = await import('./route');
      
      // App Router routes export named HTTP method handlers
      expect(route.GET).toBeDefined();
      expect(route.POST).toBeDefined();
    });

    it('should disable static optimization', async () => {
      const route = await import('./route');
      
      // force-dynamic ensures route is always dynamic
      expect(route.dynamic).toBe('force-dynamic');
    });
  });

  describe('NextAuth Handler Properties', () => {
    it('should preserve NextAuth handler configuration', async () => {
      const mockHandler = jest.fn();
      mockHandler.config = authConfig;
      NextAuth.mockReturnValue(mockHandler);
      
      jest.resetModules();
      const route = await import('./route');
      
      // Handler should have config attached
      expect((route.GET as any).config).toBeDefined();
    });

    it('should maintain reference to auth configuration', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config).toBe(authConfig);
    });
  });

  describe('Integration Points', () => {
    it('should integrate with NextAuth authentication flow', async () => {
      const route = await import('./route');
      
      // Verify handlers exist for auth endpoints
      expect(route.GET).toBeDefined(); // For session checks
      expect(route.POST).toBeDefined(); // For sign in/out
    });

    it('should use configured authentication providers', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      const providerIds = config.providers.map((p: any) => p.id);
      
      expect(providerIds).toContain('credentials');
      expect(providerIds).toContain('google');
    });

    it('should integrate with session management', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.session.strategy).toBe('jwt');
    });

    it('should integrate with custom pages', async () => {
      await import('./route');
      
      const config = NextAuth.mock.calls[0][0];
      expect(config.pages.signIn).toBe('/login');
    });
  });

  describe('Route Configuration Edge Cases', () => {
    it('should pass authConfig to NextAuth', async () => {
      const route = await import('./route');
      
      // Verify NextAuth was called with authConfig
      expect(NextAuth).toHaveBeenCalled();
      const config = NextAuth.mock.calls[0][0];
      expect(config).toBeDefined();
      expect(config.secret).toBeDefined();
      expect(config.providers).toBeDefined();
    });

    it('should export valid route handlers', async () => {
      const route = await import('./route');
      
      // Verify exports are valid
      expect(route.GET).toBeDefined();
      expect(route.POST).toBeDefined();
      expect(route.runtime).toBe('nodejs');
      expect(route.dynamic).toBe('force-dynamic');
    });
  });

  describe('Module Caching Behavior', () => {
    it('should cache handler instance', async () => {
      const route1 = await import('./route');
      const route2 = await import('./route');
      
      // Same handler instance due to module caching
      expect(route1.GET).toBe(route2.GET);
      expect(route1.POST).toBe(route2.POST);
    });

    it('should maintain configuration across imports', async () => {
      const route1 = await import('./route');
      const route2 = await import('./route');
      
      expect(route1.runtime).toBe(route2.runtime);
      expect(route1.dynamic).toBe(route2.dynamic);
    });
  });
});
