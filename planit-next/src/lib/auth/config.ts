import { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { comparePasswords } from '@/lib/auth';

export const authConfig: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key-123',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await dbConnect();
          
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            return null;
          }

          const isValid = await comparePasswords(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  trustHost: true, // Allows NextAuth to work without explicit NEXTAUTH_URL in development
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user from Google OAuth (password not needed for OAuth users)
            const userData: any = {
              email: user.email!,
              name: user.name,
              image: user.image,
              provider: 'google',
              providerId: account.providerAccountId,
              username: user.email!.split('@')[0] + '_' + Date.now(), // Generate unique username
            };
            // Don't include password field for OAuth users
            const newUser = await User.create(userData);
            user.id = newUser._id.toString();
          } else {
            // User exists - check if they're using Google auth
            if (existingUser.provider === 'google') {
              // Update provider ID if needed
              if (existingUser.providerId !== account.providerAccountId) {
                existingUser.providerId = account.providerAccountId;
                await existingUser.save();
              }
              user.id = existingUser._id.toString();
            } else {
              // User exists with credentials auth - link accounts or return error
              // For now, we'll allow linking by updating the provider
              existingUser.provider = 'google';
              existingUser.providerId = account.providerAccountId;
              existingUser.name = user.name || existingUser.name;
              existingUser.image = user.image || existingUser.image;
              await existingUser.save();
              user.id = existingUser._id.toString();
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // After successful OAuth, redirect to dashboard
        if (url === baseUrl || url === `${baseUrl}/` || url.includes('/login') || url.includes('/register')) {
          return `${baseUrl}/dashboard`;
        }
        // Allow relative callback URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allow same-origin URLs
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
        return `${baseUrl}/dashboard`;
      } catch (error) {
        console.error('Redirect error:', error);
        return `${baseUrl}/dashboard`;
      }
    }
  }
};