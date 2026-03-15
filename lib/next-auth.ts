import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      isAdmin?: boolean;
    };
  }

  interface User {
    id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase().trim();
        if (!email) {
          console.error('[NextAuth] No email provided by Google');
          return false;
        }

        try {
          // Check if user exists
          let existingUser = null;
          try {
            existingUser = await db.query.users.findFirst({
              where: eq(users.email, email),
            });
          } catch (dbError) {
            console.error('[NextAuth] Database query error:', dbError);
            // Try one more time after a short delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            existingUser = await db.query.users.findFirst({
              where: eq(users.email, email),
            });
          }

          if (!existingUser) {
            // Create new user from Google OAuth
            const newUserId = crypto.randomUUID();
            await db.insert(users).values({
              id: newUserId,
              email: email,
              name: user.name || profile?.name || email.split('@')[0],
              avatar: user.image,
              isActive: true,
              isAdmin: false,
              createdAt: new Date(),
            });
            user.id = newUserId;
            console.log('[NextAuth] Created new user:', newUserId);
          } else {
            // Update existing user's avatar if changed
            if (user.image && existingUser.avatar !== user.image) {
              await db
                .update(users)
                .set({ avatar: user.image, updatedAt: new Date() })
                .where(eq(users.id, existingUser.id));
            }
            user.id = existingUser.id;
            console.log('[NextAuth] Existing user logged in:', existingUser.id);
          }
          return true;
        } catch (error) {
          console.error('[NextAuth] Error in signIn callback:', error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.email = user.email || '';
        token.name = user.name || '';
        token.picture = user.image || '';
      }
      // Fetch isAdmin from database
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id),
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id || '';
        session.user.email = token.email || '';
        session.user.name = token.name || '';
        session.user.image = token.picture || '';
        session.user.isAdmin = token.isAdmin || false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

