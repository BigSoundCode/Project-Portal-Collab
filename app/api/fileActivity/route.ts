// /api/fileActivity/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const activity = await request.json();
    console.log('Received file activity:', activity);
    
    // Ensure timestamp is in UTC
    const timestamp = new Date(activity.created_at).toISOString();
    console.log('Processing timestamp:', timestamp);
    
    try {
      // Check if file already exists
      const existing = await sql`
        SELECT * FROM file_activities 
        WHERE file_id = ${activity.file_id};
      `;
      console.log('Existing activity:', existing.rows[0]);

      // Only insert if it's a new file or update if the timestamp is newer
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
          ${timestamp}::timestamp
        )
        ON CONFLICT (file_id) DO UPDATE 
        SET 
          action_type = 
            CASE 
              WHEN EXCLUDED.created_at > file_activities.created_at 
              THEN 'modified'
              ELSE file_activities.action_type
            END,
          created_at = 
            CASE 
              WHEN EXCLUDED.created_at > file_activities.created_at 
              THEN EXCLUDED.created_at
              ELSE file_activities.created_at
            END
        RETURNING *;
      `;
      
      console.log('Activity tracked:', result.rows[0]);
      return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('SQL Error:', error);
      return NextResponse.json({ 
        error: 'Failed to track file activity', 
        details: error instanceof Error ? error.message : 'Unknown database error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request Error:', error);
    return NextResponse.json({ 
      error: 'Failed to track file activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}