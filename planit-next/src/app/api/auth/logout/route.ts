import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear the auth token cookie
  cookies().delete('auth_token');

  return NextResponse.json({ message: 'Logged out successfully' });
}