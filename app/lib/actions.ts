'use server';

import { authOptions } from '@/auth';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      // User is already authenticated
      redirect('/dashboard');
    }

    // If not authenticated, redirect to the Azure AD sign-in page
    redirect('/api/auth/signin/azure-ad');

  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    console.error('Authentication error:', error);
    return 'An unexpected error occurred.';
  }
}

export async function createUser(name: string, email: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email
    `;
    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create user');
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const data = await sql`
      UPDATE users
      SET password_hash = ${hashedPassword}
      WHERE id = ${userId}
      RETURNING id, name, email
    `;
    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to reset password');
  }
}

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
    
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
    
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}