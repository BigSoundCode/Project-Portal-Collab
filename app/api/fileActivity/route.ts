import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const activity = await request.json();
    console.log('Received activity:', activity);
    
    try {
      const result = await sql`
        INSERT INTO file_activities (
          folder_id, 
          folder_name, 
          file_id, 
          file_name, 
          action_type, 
          created_at
        ) VALUES (
          ${activity.folder_id},
          ${activity.folder_name},
          ${activity.file_id},
          ${activity.file_name},
          ${activity.action_type},
          ${activity.created_at}::timestamp
        )
        ON CONFLICT (file_id) DO NOTHING
        RETURNING *
      `;
      console.log('SQL Result:', result);
      return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: unknown) {
      console.error('SQL Error:', error);
      return NextResponse.json({ 
        error: 'Failed to track file activity', 
        details: error instanceof Error ? error.message : 'Unknown database error' 
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Request Error:', error);
    return NextResponse.json({ 
      error: 'Failed to track file activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}