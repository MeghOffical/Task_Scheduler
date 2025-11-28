import { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { comparePasswords } from '@/lib/auth';
import {
  getCookieName,
  getCookieOptions,
  buildOAuthUserData,
  getRedirectUrl,
  hasValidCredentials,
} from './config-helpers';

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
          
          if (!hasValidCredentials(credentials)) {
            return null;
          }

          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            return null;
          }

          // --- START FIX ---
          // 1. Check if the user object has a password (OAuth users will not).
          if (!user.password) {
            return null;
          }

          // 2. Use non-null assertion (!) because we've confirmed it exists.
          const isValid = await comparePasswords(credentials.password, user.password!);
          // --- END FIX ---
          
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
      name: getCookieName('next-auth.session-token'),
      options: getCookieOptions(),
    },
    callbackUrl: {
      name: getCookieName('next-auth.callback-url'),
      options: getCookieOptions(),
    },
    csrfToken: {
      name: getCookieName('next-auth.csrf-token', 'host'),
      options: getCookieOptions(),
    },
    pkceCodeVerifier: {
      name: getCookieName('next-auth.pkce.code_verifier'),
      options: getCookieOptions(60 * 15), // 15 minutes
    },
    state: {
      name: getCookieName('next-auth.state'),
      options: getCookieOptions(60 * 15), // 15 minutes
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  // Removed unsupported 'trustHost' option to match AuthOptions type; set NEXTAUTH_URL in development if needed.
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user from Google OAuth (password not needed for OAuth users)
            const userData = buildOAuthUserData(
              user.email!,
              user.name,
              user.image,
              'google',
              account.providerAccountId
            );
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
      return getRedirectUrl(url, baseUrl);
    }
  }
};
