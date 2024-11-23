import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { DriveItem } from '@/app/lib/definitions'; // Make sure to import DriveItem interface

const DRIVE_ID = 'b!3CDeSZQk6kmhOpofepSbi3Bisl7V60dOrZPFGDcFe-x-_lp0tX7dT4L9QfJKwP4t';

async function getValidToken(): Promise<string> {
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const tokenBody = new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
      cache: 'no-store'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

async function getFolderContents(driveId: string, folderId: string): Promise<DriveItem[]> {
  try {
    const accessToken = await getValidToken();
    
    const folderUrl = new URL(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}/children`);
    folderUrl.searchParams.append('$select', 'id,name,size,folder,file,webUrl,createdDateTime,lastModifiedDateTime');
    folderUrl.searchParams.append('$expand', 'thumbnails');
    folderUrl.searchParams.append('$orderby', 'name');

    console.log('Requesting folder contents:', {
      url: folderUrl.toString(),
      driveId,
      folderId
    });

    const response = await fetch(folderUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OneDrive API Error:', errorText);
      throw new Error(`Failed to fetch folder contents: ${response.status}`);
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error in getFolderContents:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  console.log('Full request URL:', request.url);
  console.log('API Route - Received params:', params);
  console.log('FolderId from params:', params.folderId);

  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!params.folderId) {
      console.error('No folder ID provided');
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    console.log('Processing request:', {
      folderId: params.folderId,
      driveId: DRIVE_ID,
      userEmail: session.user.email
    });

    const contents = await getFolderContents(DRIVE_ID, params.folderId);

    return NextResponse.json({
      id: params.folderId,
      parentReference: {
        driveId: DRIVE_ID
      },
      children: contents.map((item: DriveItem) => ({  // Added type annotation here
        id: item.id,
        name: item.name,
        type: item.folder ? 'folder' : 'file',
        size: item.size || 0,
        folder: item.folder,
        file: item.file,
        webUrl: item.webUrl,
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        thumbnails: item.thumbnails || []
      }))
    });

  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }, 
      { status: 500 }
    );
  }
}