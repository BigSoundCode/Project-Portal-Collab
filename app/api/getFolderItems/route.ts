import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('next-auth.session-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      accessToken?: string;
      onedriveFolderId?: string;
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!decodedToken.accessToken || !decodedToken.onedriveFolderId) {
    return NextResponse.json({ error: 'Missing access token or folder ID' }, { status: 401 });
  }

  const folderId = decodedToken.onedriveFolderId;
  const shareId = encodeURIComponent(`u!${btoa(folderId)}`);
  const endpoint = `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/children`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${decodedToken.accessToken}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Error fetching folder items:', error);
    return NextResponse.json({ error: 'Failed to fetch folder items' }, { status: 500 });
  }
}