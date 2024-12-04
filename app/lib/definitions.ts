import { QueryResultRow } from '@vercel/postgres';
import { DefaultSession } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

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
    onedrive_folder_id?: string | null;
    error?: string;
    lastFolderScan?: number;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
    onedrive_folder_id: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    isAdmin?: boolean;
    accessToken?: string;
    onedrive_folder_id?: string | null;
    error?: string;
    lastFolderScan?: number;
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

export interface FileActivity {
  id?: string;
  folder_id: string;
  folder_name: string;
  file_id: string;
  file_name: string;
  action_type: 'added' | 'modified' | 'deleted';
  created_at: string;
  user_id?: string;
}

export interface ExtendedUser extends Omit<User, 'onedrive_folder_id'> {
  isAdmin?: boolean;
  onedrive_folder_id: string | null;
}

export interface ExtendedJWT extends NextAuthJWT {
  userId: string;
  isAdmin?: boolean;
  onedrive_folder_id?: string | null;
  accessToken?: string;
  lastFolderScan?: number;
  error?: string;
}











