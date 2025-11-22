/**
 * Unit tests for authentication utilities
 */

// Mock jose before importing
jest.mock('jose', () => {
  let tokenCounter = 0;
  const validTokens = new Set<string>();
  
  return {
    SignJWT: jest.fn().mockImplementation((payload: any) => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockImplementation(async () => {
        tokenCounter++;
        const token = `mocked.jwt.token${tokenCounter}`;
        validTokens.add(token);
        return token;
      }),
    })),
    jwtVerify: jest.fn().mockImplementation(async (token: string) => {
      if (!token || !validTokens.has(token)) {
        throw new Error('Invalid token');
      }
      return {
        payload: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
        },
      };
    }),
  };
});

import { createToken, verifyToken, hashPassword, comparePasswords } from './auth';

describe('Authentication Utilities', () => {
  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const payload = { id: '123', username: 'testuser', email: 'test@example.com' };
      const token = await createToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should create token with partial payload', async () => {
      const payload = { id: '123' };
      const token = await createToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should create different tokens for different payloads', async () => {
      const payload1 = { id: '123', username: 'user1' };
      const payload2 = { id: '456', username: 'user2' };
      
      const token1 = await createToken(payload1);
      const token2 = await createToken(payload2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = { id: '123', username: 'testuser', email: 'test@example.com' };
      const token = await createToken(payload);
      
      const result = await verifyToken(token);
      
      expect(result).toBeDefined();
      expect('error' in result).toBe(false);
      expect(result.id).toBe('123');
      expect(result.username).toBe('testuser');
    });

    it('should reject invalid token', async () => {
      const result = await verifyToken('invalid.token.here');
      
      expect(result).toHaveProperty('error');
      expect(result.error).toBeTruthy();
    });

    it('should reject empty token', async () => {
      const result = await verifyToken('');
      
      expect(result).toHaveProperty('error');
      expect(result.error).toBeTruthy();
    });

    it('should reject malformed token', async () => {
      const result = await verifyToken('not-a-valid-jwt');
      
      expect(result).toHaveProperty('error');
      expect(result.error).toBeTruthy();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'mySecurePassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50); // Bcrypt hashes are long
    });

    it('should create different hashes for same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Bcrypt uses salts
    });

    it('should handle empty password', async () => {
      const hashed = await hashPassword('');
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });

    it('should handle special characters', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching password', async () => {
      const password = 'mySecurePassword123';
      const hashed = await hashPassword(password);
      
      const result = await comparePasswords(password, hashed);
      
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mySecurePassword123';
      const wrongPassword = 'wrongPassword456';
      const hashed = await hashPassword(password);
      
      const result = await comparePasswords(wrongPassword, hashed);
      
      expect(result).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'mySecurePassword123';
      const hashed = await hashPassword(password);
      
      const result = await comparePasswords('', hashed);
      
      expect(result).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'MyPassword';
      const hashed = await hashPassword(password);
      
      const result1 = await comparePasswords('MyPassword', hashed);
      const result2 = await comparePasswords('mypassword', hashed);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Token Expiration', () => {
    it('should create token that is initially valid', async () => {
      const payload = { id: '123', username: 'testuser' };
      const token = await createToken(payload);
      
      const result = await verifyToken(token);
      
      expect('error' in result).toBe(false);
      expect(result.id).toBe('123');
    });
  });

  describe('Integration: Create and Verify Flow', () => {
    it('should complete full authentication cycle', async () => {
      // 1. Hash password
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // 2. Create token after "login"
      const userPayload = { 
        id: '123', 
        username: 'testuser',
        email: 'test@example.com'
      };
      const token = await createToken(userPayload);
      
      // 3. Verify token
      const verified = await verifyToken(token);
      
      // 4. Verify password
      const passwordMatch = await comparePasswords(password, hashedPassword);
      
      expect(verified).toBeDefined();
      expect('error' in verified).toBe(false);
      expect(verified.id).toBe('123');
      expect(passwordMatch).toBe(true);
    });
  });
});
