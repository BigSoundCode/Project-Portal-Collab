import type { NextAuthOptions, DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Extend the Session type
interface ExtendedSession extends DefaultSession {
  user: {
    isAdmin?: boolean;
  } & DefaultSession["user"]
}

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          isAdmin: token.isAdmin as boolean | undefined,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin;
      }
      return token;
    },
  },
  providers: [], // Add providers with an empty array for now
};

// Add these type declarations at the end of the file
declare module "next-auth" {
  interface Session extends ExtendedSession {}
  interface User {
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}