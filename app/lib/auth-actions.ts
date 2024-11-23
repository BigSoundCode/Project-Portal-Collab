'use server';

import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';

export async function authenticateUser(email: string, password: string) {
  try {
    const result = await sql`
      SELECT id, name, email, password_hash, is_admin, onedrive_folder_id 
      FROM users 
      WHERE email = ${email}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    // Remove password_hash before returning
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
    
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}