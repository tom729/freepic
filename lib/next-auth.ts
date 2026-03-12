import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

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
        if (!email) return false;

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!existingUser) {
          // Create new user from Google OAuth
          const newUserId = crypto.randomUUID();
          await db.insert(users).values({
            id: newUserId,
            email: email,
            name: user.name || profile?.name || email.split('@')[0],
            avatar: user.image,
            isActive: true, // OAuth users are auto-activated
            isAdmin: false,
            createdAt: new Date(),
          });
          user.id = newUserId;
        } else {
          // Update existing user's avatar if changed
          if (user.image && existingUser.avatar !== user.image) {
            await db
              .update(users)
              .set({ avatar: user.image, updatedAt: new Date() })
              .where(eq(users.id, existingUser.id));
          }
          user.id = existingUser.id;
        }
        return true;
      }
      return false;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
