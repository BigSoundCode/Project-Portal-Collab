import type { NextAuthOptions, DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Extend the Session type
interface ExtendedSession extends DefaultSession {
  user: {
    is_admin?: boolean;
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
          is_admin: token.is_admin as boolean | undefined,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.is_admin = (user as { is_admin?: boolean }).is_admin;
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
    is_admin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    is_admin?: boolean;
  }
}