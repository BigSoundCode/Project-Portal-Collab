import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log('Fetching notifications for user:', userId);  // Add this line

  try {
    const activities = await sql`
      SELECT fa.*, un.last_viewed_at
      FROM file_activities fa
      LEFT JOIN user_notifications un ON un.user_id = ${userId}
      WHERE fa.created_at > COALESCE(
        (SELECT last_viewed_at FROM user_notifications WHERE user_id = ${userId}),
        '1970-01-01'::timestamp
      )
      ORDER BY fa.created_at DESC
    `;

    console.log('Found activities:', activities.rows);  // Add this line

    return NextResponse.json({
      notifications: activities.rows,
      count: activities.rows.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}