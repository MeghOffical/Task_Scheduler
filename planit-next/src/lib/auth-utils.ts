import { getServerSession } from 'next-auth';
import { authConfig } from './auth/config';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';

/**
 * Get the authenticated user ID from either custom auth_token or NextAuth session
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    // First, try to get user ID from custom auth_token (credentials login)
    const authToken = cookies().get('auth_token')?.value;
    if (authToken) {
      const verified = await verifyToken(authToken);
      if (!('error' in verified) && verified.id) {
        return verified.id;
      }
    }

    // If no auth_token, try to get user ID from NextAuth session (OAuth login)
    const session = await getServerSession(authConfig);
    if (session?.user?.id) {
      return session.user.id as string;
    }

    return null;
  } catch (error) {
    console.error('Error getting authenticated user ID:', error);
    return null;
  }
}

