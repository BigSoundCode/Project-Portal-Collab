// /api/notifications/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await sql`
      WITH LastViewTime AS (
        SELECT COALESCE(
          (SELECT last_viewed_at 
           FROM user_notifications 
           WHERE user_id = ${session.user.id}::uuid),
          NOW() - INTERVAL '1 year'
        ) as last_view
      )
      SELECT fa.* 
      FROM file_activities fa, LastViewTime
      WHERE fa.created_at > LastViewTime.last_view
      ORDER BY fa.created_at DESC;
    `;

    return NextResponse.json({
      notifications: notifications.rows,
      count: notifications.rows.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notifications'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('No session or user ID found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Attempting to update notifications for user:', session.user.id);

    // First verify the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_notifications'
      );
    `;
    
    console.log('Table check result:', tableCheck.rows[0]);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating user_notifications table...');
      await sql`
        CREATE TABLE IF NOT EXISTS user_notifications (
          user_id UUID PRIMARY KEY REFERENCES users(id),
          last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }

    // Now try to insert/update the record
    console.log('Updating last_viewed_at for user:', session.user.id);
    const result = await sql`
      INSERT INTO user_notifications (user_id, last_viewed_at)
      VALUES (${session.user.id}::uuid, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET last_viewed_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    console.log('Update result:', result.rows[0]);

    return NextResponse.json({ 
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    // Log the full error details
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });

    return NextResponse.json({ 
      error: 'Failed to update notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}