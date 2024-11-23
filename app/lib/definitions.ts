import { QueryResultRow } from '@vercel/postgres';
import { DefaultSession } from 'next-auth';

export interface User extends QueryResultRow {
  id: string;
  name: string;
  email: string;
  onedrive_folder_id: string | null;
  is_admin: boolean | undefined;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      isAdmin?: boolean;
    } & DefaultSession['user'];
    accessToken?: string;
    onedriveFolderId?: string;
    error?: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    isAdmin?: boolean;
    accessToken?: string;
    onedriveFolderId?: string;
    error?: string;
  }
}

export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  folder?: { childCount: number };
  file?: { 
    mimeType?: string;
    thumbnails?: any[];
  };
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  children?: DriveItem[];
  thumbnails?: any[];
  parentReference?: {
    driveId?: string;
  };
  remoteItem?: {
    parentReference?: {
      driveId?: string;
    };
  };
}

export interface FolderReference {
  id: string;
  name: string;
  driveId: string;
}











