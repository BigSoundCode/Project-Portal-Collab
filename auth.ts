import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from "next-auth/providers/azure-ad";
import { sql } from '@vercel/postgres';

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    isAdmin?: boolean;
    onedriveFolderId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    isAdmin?: boolean;
    onedriveFolderId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: 'common',
      authorization: {
        params: {
          scope: "openid profile email offline_access https://graph.microsoft.com/Files.Read.All"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user?.email) {
        const result = await sql`
          SELECT is_admin, onedrive_folder_id FROM users WHERE email = ${user.email}
        `;
        if (result.rows.length > 0) {
          token.isAdmin = result.rows[0].is_admin;
          token.onedriveFolderId = result.rows[0].onedrive_folder_id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.isAdmin = token.isAdmin;
      session.onedriveFolderId = token.onedriveFolderId;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };