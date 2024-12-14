import NextAuth, { NextAuthOptions, Session, User } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/app/lib/auth-actions";
import { ExtendedJWT, ExtendedUser } from '@/app/lib/definitions';
import { sql } from '@vercel/postgres';

async function getAzureAccessToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  });

  if (!response.ok) {
    throw new Error('Failed to get Azure access token');
  }

  const data = await response.json();
  return data.access_token;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "email@example.com"
        },
        password: { 
          label: "Password", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const user = await authenticateUser(
            credentials.email,
            credentials.password
          );

          if (!user) {
            return null;
          }

          console.log('Authorized user:', user); // Add this log

          // Convert to standard User type that NextAuth expects
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.is_admin || false,
            onedrive_folder_id: user.onedrive_folder_id || null
          } as User;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;
      
      try {
        // Record login time in UTC
        await sql`
          INSERT INTO user_logins (user_id, login_time)
          VALUES (
            ${user.id}::uuid, 
            (SELECT NOW() AT TIME ZONE 'UTC')
          );
        `;
        
        return true;
      } catch (error) {
        console.error('Error recording login time:', error);
        return true; // Still allow login even if recording fails
      }
    },
  

    async jwt({ token, user }): Promise<ExtendedJWT> {
      if (user) {
        token.userId = user.id;
        token.isAdmin = user.isAdmin || false;
        token.onedrive_folder_id = user.onedrive_folder_id;
        token.lastFolderScan = Date.now();
        
        try {
          const azureToken = await getAzureAccessToken();
          token.accessToken = azureToken;
        } catch (error) {
          console.error('Failed to get Azure token:', error);
        }
      }
      return token as ExtendedJWT;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.userId;
        session.user.isAdmin = token.isAdmin || false;
        session.accessToken = token.accessToken;
        session.onedrive_folder_id = token.onedrive_folder_id;
        session.lastFolderScan = token.lastFolderScan;
        session.error = token.error;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  debug: true
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };