// app/api/getUserFolderId/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  console.log('API called with email:', email);

  if (!email) {
    console.log('Email is missing in the request');
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    console.log('Executing SQL query for email:', email);
    const result = await sql`
      SELECT id, email, onedrive_folder_id 
      FROM users 
      WHERE email = ${email}
    `;

    console.log('SQL query result:', JSON.stringify(result, null, 2));

    if (result.rows.length === 0) {
      console.log('No user found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id, onedrive_folder_id } = result.rows[0];
    console.log('User found:', { id, email, onedrive_folder_id });
    
    if (!onedrive_folder_id) {
      console.log('No OneDrive folder assigned to user:', email);
      return NextResponse.json({ onedrive_folder_id: null, message: 'No OneDrive folder assigned to this user' }, { status: 200 });
    }

    console.log('Returning onedrive_folder_id:', onedrive_folder_id);
    return NextResponse.json({ onedrive_folder_id }, { status: 200 });
  } catch (error) {
    console.error('Error in getUserFolderId API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}