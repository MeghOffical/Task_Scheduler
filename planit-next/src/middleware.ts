import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-123')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to home if authenticated
  if (pathname === '/') {
    const authToken = request.cookies.get('auth_token')?.value
    const sessionTokenNames = ['__Secure-next-auth.session-token', 'next-auth.session-token']
    const hasSession = sessionTokenNames.some(name => request.cookies.get(name)?.value)
    
    if (authToken || hasSession) {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Public routes that don't require authentication
  if (pathname.startsWith('/_next') || 
      pathname === '/login' || 
      pathname === '/register' || 
      pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check for custom auth_token (credentials login)
  const authToken = request.cookies.get('auth_token')?.value
  if (authToken) {
    try {
      await jwtVerify(authToken, jwtSecret)
      return NextResponse.next()
    } catch (error) {
      // Token invalid, continue to check NextAuth session
    }
  }

  // Check for NextAuth session token (OAuth login)
  // Try both production and development cookie names
  const sessionTokenNames = [
    '__Secure-next-auth.session-token',
    'next-auth.session-token'
  ]
  
  for (const cookieName of sessionTokenNames) {
    const sessionToken = request.cookies.get(cookieName)?.value
    // If NextAuth session cookie exists, allow access
    // NextAuth will verify the session when it's actually accessed
    if (sessionToken) {
      return NextResponse.next()
    }
  }

  // No valid authentication found
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}