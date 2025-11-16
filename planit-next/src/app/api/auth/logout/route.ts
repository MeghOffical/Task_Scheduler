import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear the custom auth token cookie
  const cookieStore = cookies();
  cookieStore.delete('auth_token');

  // Clear potential NextAuth session cookies
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.session-token');

  return NextResponse.json({ message: 'Logged out successfully' });
}