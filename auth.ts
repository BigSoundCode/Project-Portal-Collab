import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from "next-auth/providers/azure-ad";
import { sql } from '@vercel/postgres';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: process.env.TENANT_ID,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user?.email) {
        const result = await sql`
          SELECT is_admin FROM users WHERE email = ${user.email}
        `;
        if (result.rows.length > 0) {
          token.isAdmin = result.rows[0].is_admin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.isAdmin = token.isAdmin;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };