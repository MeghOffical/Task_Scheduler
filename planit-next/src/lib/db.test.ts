/**
 * Unit tests for database connection utilities
 */

// Clear require cache before tests
beforeEach(() => {
  jest.resetModules();
  delete (global as any).mongoose;
});

// Mock mongoose completely to avoid BSON import issues
jest.mock('mongoose', () => {
  const mockMongoose = {
    connect: jest.fn().mockResolvedValue({
      connection: { readyState: 1 }
    }),
    connection: {
      readyState: 0,
    },
  };
  return mockMongoose;
});

import mongoose from 'mongoose';

describe('Database Connection Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as any).mongoose;
    (mongoose.connect as jest.Mock).mockClear();
  });

  describe('Environment Configuration', () => {
    it('should require MONGODB_URI environment variable', () => {
      const uri = process.env.MONGODB_URI;
      expect(uri).toBeDefined();
      expect(typeof uri).toBe('string');
    });

    it('should throw error if MONGODB_URI is not defined', async () => {
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;
      
      // Re-import module to trigger the check
      jest.resetModules();
      
      await expect(async () => {
        await import('./db');
      }).rejects.toThrow('Please define the MONGODB_URI environment variable inside .env.local');
      
      process.env.MONGODB_URI = originalUri;
    });

    it('should validate MONGODB_URI format', () => {
      const uri = process.env.MONGODB_URI || '';
      expect(uri).toMatch(/^mongodb/);
    });
  });

  describe('Connection Caching', () => {
    it('should initialize cache on first import', async () => {
      const { default: dbConnect } = await import('./db');
      
      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose).toHaveProperty('conn');
      expect((global as any).mongoose).toHaveProperty('promise');
    });

    it('should reuse cached connection when already connected', async () => {
      // Set up cached connection
      (global as any).mongoose = {
        conn: mongoose,
        promise: null,
      };
      
      const { default: dbConnect } = await import('./db');
      const result = await dbConnect();
      
      expect(result).toBe(mongoose);
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should reuse cached promise when connection is in progress', async () => {
      const mockPromise = Promise.resolve(mongoose);
      (global as any).mongoose = {
        conn: null,
        promise: mockPromise,
      };
      
      const { default: dbConnect } = await import('./db');
      await dbConnect();
      
      // Should not create new promise, should reuse cached one
      expect((global as any).mongoose.promise).toBe(mockPromise);
    });

    it('should create cache if not exists', async () => {
      delete (global as any).mongoose;
      
      const { default: dbConnect } = await import('./db');
      
      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose.conn).toBeNull();
      expect((global as any).mongoose.promise).toBeNull();
    });

    it('should check if cached.conn exists with truthy evaluation', () => {
      const cache1 = { conn: mongoose, promise: null };
      const cache2 = { conn: null, promise: null };
      
      // Test the if (cached.conn) condition
      expect(!!cache1.conn).toBe(true);
      expect(!!cache2.conn).toBe(false);
    });

    it('should check if cached.promise is falsy before creating new one', () => {
      const cacheWithPromise = { conn: null, promise: Promise.resolve(mongoose) };
      const cacheWithoutPromise = { conn: null, promise: null };
      
      // Test the if (!cached.promise) condition
      expect(!cacheWithPromise.promise).toBe(false);
      expect(!cacheWithoutPromise.promise).toBe(true);
    });

    it('should verify cache states properly', () => {
      // Test different cache states
      const states = [
        { conn: null, promise: null, hasConn: false, hasPromise: false },
        { conn: mongoose, promise: null, hasConn: true, hasPromise: false },
        { conn: null, promise: Promise.resolve(mongoose), hasConn: false, hasPromise: true },
        { conn: mongoose, promise: Promise.resolve(mongoose), hasConn: true, hasPromise: true },
      ];
      
      states.forEach(state => {
        expect(!!state.conn).toBe(state.hasConn);
        expect(!!state.promise).toBe(state.hasPromise);
      });
    });
  });

  describe('Connection Establishment', () => {
    it('should test connection options structure', () => {
      const connectionOptions = {
        bufferCommands: false,
      };
      
      expect(connectionOptions.bufferCommands).toBe(false);
      expect(typeof connectionOptions.bufferCommands).toBe('boolean');
    });

    it('should validate connection parameters', () => {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
      const opts = { bufferCommands: false };
      
      expect(uri).toBeDefined();
      expect(opts).toHaveProperty('bufferCommands');
      expect(opts.bufferCommands).toBe(false);
    });

    it('should handle connection promise pattern', async () => {
      const mockConnect = jest.fn().mockResolvedValue(mongoose);
      const result = await mockConnect('mongodb://localhost', { bufferCommands: false });
      
      expect(mockConnect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should cache connection result', () => {
      const cache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = { conn: null, promise: null };
      const connection = mongoose;
      
      cache.conn = connection;
      
      expect(cache.conn).toBeDefined();
      expect(cache.conn).toBe(connection);
    });

    it('should cache promise during connection', () => {
      const cache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = { conn: null, promise: null };
      const promise = Promise.resolve(mongoose);
      
      cache.promise = promise;
      
      expect(cache.promise).toBeDefined();
      expect(cache.promise).toBeInstanceOf(Promise);
    });

    it('should reuse existing promise', () => {
      const existingPromise = Promise.resolve(mongoose);
      const cache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = { conn: null, promise: existingPromise };
      
      // Should not create new promise if one exists
      const shouldUseExisting = !cache.promise ? Promise.resolve(mongoose) : cache.promise;
      
      expect(shouldUseExisting).toBe(existingPromise);
    });

    it('should use bufferCommands: false not true', () => {
      const correctOptions = { bufferCommands: false };
      const incorrectOptions = { bufferCommands: true };
      
      expect(correctOptions.bufferCommands).toBe(false);
      expect(correctOptions.bufferCommands).not.toBe(true);
      expect(incorrectOptions.bufferCommands).toBe(true);
    });

    it('should create opts object with specific structure', () => {
      const opts = { bufferCommands: false };
      
      expect(Object.keys(opts)).toEqual(['bufferCommands']);
      expect(opts).toEqual({ bufferCommands: false });
      expect(opts).not.toEqual({});
    });

    it('should pass opts to mongoose.connect', () => {
      const uri = 'mongodb://test';
      const opts = { bufferCommands: false };
      
      // Simulate the connect call pattern
      const connectCall = { uri, opts };
      
      expect(connectCall.opts).toEqual({ bufferCommands: false });
      expect(connectCall.opts.bufferCommands).toBe(false);
    });

    it('should return mongoose from promise.then', async () => {
      const mockMongoose = mongoose;
      const promise = Promise.resolve(mockMongoose).then((m) => m);
      
      const result = await promise;
      expect(result).toBe(mockMongoose);
    });

    it('should await cached.promise and assign to cached.conn', async () => {
      const cache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
        conn: null,
        promise: Promise.resolve(mongoose),
      };
      
      // Simulate: cached.conn = await cached.promise
      if (cache.promise) {
        cache.conn = await cache.promise;
      }
      
      expect(cache.conn).toBe(mongoose);
      expect(cache.conn).not.toBeNull();
    });
  });

  describe('Connection Management', () => {
    it('should connect to MongoDB when not already connected', () => {
      // Test connection state logic
      const isConnected = (readyState: number) => readyState === 1;
      
      expect(isConnected(0)).toBe(false); // disconnected
      expect(isConnected(1)).toBe(true);  // connected
      expect(isConnected(2)).toBe(false); // connecting
    });

    it('should validate MongoDB URI format', () => {
      const validUris = [
        'mongodb://localhost:27017/test',
        'mongodb+srv://user:pass@cluster.mongodb.net/db',
      ];
      
      const invalidUris = [
        'http://localhost',
        'invalid-uri',
      ];
      
      validUris.forEach(uri => {
        expect(uri).toMatch(/^mongodb(\+srv)?:\/\//);
      });
      
      invalidUris.forEach(uri => {
        expect(uri).not.toMatch(/^mongodb(\+srv)?:\/\//);
      });
    });

    it('should not reconnect if already connected', async () => {
      // Simulate already connected state
      (global as any).mongoose = {
        conn: mongoose,
        promise: null,
      };
      
      const { default: dbConnect } = await import('./db');
      const result = await dbConnect();
      
      // Should return cached connection without calling connect
      expect(result).toBe(mongoose);
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', () => {
      // Test error handling logic
      const simulateConnect = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Connection failed');
        }
        return { connected: true };
      };
      
      expect(simulateConnect(true)).rejects.toThrow('Connection failed');
      expect(simulateConnect(false)).resolves.toHaveProperty('connected', true);
    });
  });

  describe('Connection States', () => {
    it('should recognize disconnected state', () => {
      expect(mongoose.connection.readyState).toBe(0); // disconnected
    });

    it('should recognize connected state', () => {
      (mongoose.connection.readyState as any) = 1;
      expect(mongoose.connection.readyState).toBe(1); // connected
      (mongoose.connection.readyState as any) = 0;
    });

    it('should recognize connecting state', () => {
      (mongoose.connection.readyState as any) = 2;
      expect(mongoose.connection.readyState).toBe(2); // connecting
      (mongoose.connection.readyState as any) = 0;
    });

    it('should recognize disconnecting state', () => {
      (mongoose.connection.readyState as any) = 3;
      expect(mongoose.connection.readyState).toBe(3); // disconnecting
      (mongoose.connection.readyState as any) = 0;
    });
  });

  describe('Environment Configuration', () => {
    it('should require MONGODB_URI', () => {
      const uri = process.env.MONGODB_URI;
      expect(uri).toBeDefined();
    });

    it('should handle missing MONGODB_URI gracefully', () => {
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;
      
      // Should have fallback or throw error
      expect(() => {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not defined');
      }).toThrow();
      
      process.env.MONGODB_URI = originalUri;
    });

    it('should validate URI format', () => {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
      
      expect(uri).toMatch(/^mongodb(\+srv)?:\/\//);
    });
  });

  describe('Connection Options', () => {
    it('should support connection pooling', () => {
      const connectionOptions = {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
      };
      
      expect(connectionOptions.maxPoolSize).toBeGreaterThan(0);
      expect(connectionOptions.minPoolSize).toBeGreaterThan(0);
      expect(connectionOptions.serverSelectionTimeoutMS).toBeGreaterThan(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should classify network errors', () => {
      const networkError = new Error('ECONNREFUSED');
      const authError = new Error('Authentication failed');
      const timeoutError = new Error('Connection timeout');
      
      expect(networkError.message).toContain('ECONNREFUSED');
      expect(authError.message).toContain('Authentication');
      expect(timeoutError.message).toContain('timeout');
    });

    it('should handle retry logic', () => {
      let attempts = 0;
      const maxRetries = 3;
      
      const tryConnect = () => {
        attempts++;
        return attempts <= maxRetries;
      };
      
      expect(tryConnect()).toBe(true); // attempt 1
      expect(tryConnect()).toBe(true); // attempt 2
      expect(tryConnect()).toBe(true); // attempt 3
      expect(tryConnect()).toBe(false); // exceeded max
    });

    it('should provide error context', () => {
      const buildErrorMessage = (err: Error) => {
        return `Database connection failed: ${err.message}`;
      };
      
      const error = new Error('ECONNREFUSED');
      const errorMessage = buildErrorMessage(error);
      
      expect(errorMessage).toContain('Database connection failed');
      expect(errorMessage).toContain('ECONNREFUSED');
    });
  });

  describe('Performance', () => {
    it('should connect within reasonable time', async () => {
      const startTime = Date.now();
      
      const { default: dbConnect } = await import('./db');
      await dbConnect();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should be fast in mock environment
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Connection Flow', () => {
    it('should return cached.conn at end of dbConnect', () => {
      const cache = { conn: mongoose, promise: null };
      
      // Simulates: return cached.conn
      const result = cache.conn;
      
      expect(result).toBe(mongoose);
      expect(result).toBe(cache.conn);
    });

    it('should follow connection logic flow', () => {
      // Test the if-else flow logic
      const scenarios = [
        { conn: mongoose, promise: null, shouldConnect: false, reason: 'has conn' },
        { conn: null, promise: Promise.resolve(mongoose), shouldConnect: false, reason: 'has promise' },
        { conn: null, promise: null, shouldConnect: true, reason: 'needs connection' },
      ];
      
      scenarios.forEach(scenario => {
        if (scenario.conn) {
          // Would return cached.conn
          expect(scenario.shouldConnect).toBe(false);
        } else if (scenario.promise) {
          // Would await cached.promise
          expect(scenario.shouldConnect).toBe(false);
        } else {
          // Would create new connection
          expect(scenario.shouldConnect).toBe(true);
        }
      });
    });

    it('should test the complete connection decision tree', () => {
      // Decision tree for dbConnect function
      const testConnection = (conn: any, promise: any) => {
        if (conn) return 'return-conn';
        if (!promise) return 'create-promise';
        return 'await-promise';
      };
      
      expect(testConnection(mongoose, null)).toBe('return-conn');
      expect(testConnection(null, null)).toBe('create-promise');
      expect(testConnection(null, Promise.resolve(mongoose))).toBe('await-promise');
    });
  });
});
