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
  }
}











