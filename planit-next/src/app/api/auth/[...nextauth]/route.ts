import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// NextAuth handler for the App Router
// Provides endpoints the next-auth client expects under /api/auth/*
const handler = NextAuth(authConfig as any);

export { handler as GET, handler as POST };
