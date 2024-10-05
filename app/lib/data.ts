import { sql } from '@vercel/postgres';

import { User } from '@/app/lib/definitions';
import { QueryResultRow } from '@vercel/postgres';

import dotenv from 'dotenv';
dotenv.config();

console.log('POSTGRES_URL:', process.env.POSTGRES_URL);
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All environment variables:', process.env);




export async function fetchAllUsers(): Promise<User[]> {
  try {
    const users = await sql<User>`
      SELECT id, name, email, onedrive_folder_id, is_admin
      FROM users
      ORDER BY name ASC
    `;
    return users.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all users.');
  }
}




export async function addUser(name: string, email: string) {
  try {
    const data = await sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email
    `;
    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to add new user.');
  }
}

export async function removeUser(userId: string) {
  try {
    const data = await sql`
      DELETE FROM users
      WHERE id = ${userId}
      RETURNING id
    `;
    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to remove user.');
  }
}

export async function updateUserOneDriveFolderId(userId: string, folderId: string) {
  try {
    const data = await sql`
      UPDATE users
      SET onedrive_folder_id = ${folderId}
      WHERE id = ${userId}
      RETURNING id, name, email, onedrive_folder_id
    `;
    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update user OneDrive folder ID.');
  }
}

export async function checkUserExists(email: string) {
  try {
    const data = await sql`
      SELECT EXISTS(SELECT 1 FROM users WHERE email = ${email})
    `;
    return data.rows[0].exists;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to check if user exists.');
  }
}

export async function verifyDatabaseConnection() {
  try {
    console.log('Attempting to verify database connection...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL);
    const result = await sql`SELECT 1 as connected`;
    console.log('Database connection result:', result);
    return result.rows[0].connected === 1;
  } catch (error) {
    console.error('Database connection failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}




