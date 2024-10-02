import { sql } from '@vercel/postgres';

import { User } from '@/app/lib/definitions';

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
    const result = await sql`SELECT 1 as connected`;
    console.log('Database connection successful:', result.rows[0].connected === 1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
