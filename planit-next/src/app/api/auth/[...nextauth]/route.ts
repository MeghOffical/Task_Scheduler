import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

