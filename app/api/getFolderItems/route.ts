import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getAppAccessToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID!,
        client_secret: process.env.CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting app access token:', error);
    throw error;
  }
}

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('next-auth.session-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Decode the session token to get the user's folder ID
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
      onedriveFolderId?: string;
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!decodedToken.onedriveFolderId) {
    return NextResponse.json({ error: 'Missing folder ID' }, { status: 401 });
  }

  try {
    // Get app access token instead of using user's token
    const appAccessToken = await getAppAccessToken();
    const folderId = decodedToken.onedriveFolderId;
    
    // First, get the drive item to ensure we have the correct information
    const shareResponse = await fetch(
      `https://graph.microsoft.com/v1.0/shares/${folderId}/driveItem`, 
      {
        headers: {
          'Authorization': `Bearer ${appAccessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!shareResponse.ok) {
      throw new Error(`Failed to fetch share info: ${shareResponse.status}`);
    }

    const shareData = await shareResponse.json();
    const driveId = shareData.parentReference?.driveId;
    const itemId = shareData.id;

    // Then get the children of that item
    const childrenResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/children`,
      {
        headers: {
          'Authorization': `Bearer ${appAccessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!childrenResponse.ok) {
      throw new Error(`Failed to fetch items: ${childrenResponse.status}`);
    }

    const data = await childrenResponse.json();
    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Error fetching folder items:', error);
    return NextResponse.json({ error: 'Failed to fetch folder items' }, { status: 500 });
  }
}