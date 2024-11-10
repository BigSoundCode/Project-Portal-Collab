// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
import { QueryResultRow } from '@vercel/postgres';
import { DefaultSession } from 'next-auth';

export interface User extends QueryResultRow {
  id: string;
  name: string;
  email: string;
  onedrive_folder_id: string | null;
  is_admin: boolean;
}

// Extend the built-in Session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    isAdmin?: boolean;
    driveId?: string;

  }
}

export interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { 
    mimeType?: string;
    thumbnails?: Array<{
      large?: {
        url: string;
      };
    }>;
  };
  remoteItem?: {
    id: string;
    parentReference: {
      driveId: string;
    };
  };
}

export interface FolderReference {
  id: string;
  name: string;
  driveId: string;
}











