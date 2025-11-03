import type { AuthResponse, UserData } from '@/types';
import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-123');

export async function createToken(payload: Partial<UserData>): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  
  return token;
}

export async function verifyToken(token: string): Promise<AuthResponse> {
  try {
    const verified = await jwtVerify(token, secret);
    return {
      message: 'Token verified',
      token: token,
      id: verified.payload.id as string,
      username: verified.payload.username as string
    };
  } catch (error) {
    return {
      message: 'Invalid token',
      error: 'Authentication failed'
    };
  }
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import('bcryptjs')).default;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(password, hashedPassword);
}