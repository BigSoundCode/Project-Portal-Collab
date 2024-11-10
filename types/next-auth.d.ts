import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    isAdmin?: boolean;
    onedriveFolderId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    isAdmin?: boolean;
    onedriveFolderId?: string;
  }
}