import { NextResponse } from 'next/server';

interface DriveItem {
  id: string;
  name: string;
  size?: number;
  folder?: { childCount: number };
  file?: { mimeType: string };
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  children?: DriveItem[];
  thumbnails?: any[];
}

// Hardcoded folder ID for 100 Maple Lane
const PROJECT_FOLDER_ID = '01ENRKU6NNGIV4XLVPRVEKCORLFRH2BTV2';
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

async function fetchWithAuth(url: string): Promise<{ ok: boolean; data: any }> {
  try {
    const accessToken = await getValidToken();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch data');
    }
    
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return {
      ok: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function getFolderContents(): Promise<DriveItem[]> {
  try {
    // Get the main folder contents
    const folderUrl = new URL(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${PROJECT_FOLDER_ID}/children`);
    folderUrl.searchParams.append('$select', 'id,name,size,folder,file,webUrl,createdDateTime,lastModifiedDateTime');
    folderUrl.searchParams.append('$expand', 'thumbnails');
    folderUrl.searchParams.append('$orderby', 'name');
    
    const { ok, data } = await fetchWithAuth(folderUrl.toString());

    if (!ok) {
      throw new Error('Failed to fetch folder contents');
    }

    // Get contents of each subfolder
    const contents = await Promise.all(data.value.map(async (item: DriveItem) => {
      if (item.folder) {
        // Get contents of this subfolder
        const subfolderUrl = new URL(`https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${item.id}/children`);
        subfolderUrl.searchParams.append('$select', 'id,name,size,folder,file,webUrl,createdDateTime,lastModifiedDateTime');
        subfolderUrl.searchParams.append('$expand', 'thumbnails');
        subfolderUrl.searchParams.append('$orderby', 'name');
        
        const { data: subfolderData } = await fetchWithAuth(subfolderUrl.toString());
        
        return {
          ...item,
          children: subfolderData.value || []
        };
      }
      return item;
    }));

    return contents;
  } catch (error) {
    console.error('Error getting folder contents:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const contents = await getFolderContents();

    // Format the response to match the folder structure we want
    const formattedContents = contents.map(item => ({
      id: item.id,
      name: item.name,
      type: item.folder ? 'folder' : 'file',
      size: item.size || 0,
      webUrl: item.webUrl,
      createdAt: item.createdDateTime,
      modifiedAt: item.lastModifiedDateTime,
      thumbnails: item.thumbnails || [],
      mimeType: item.file?.mimeType,
      children: item.children?.map(child => ({
        id: child.id,
        name: child.name,
        type: child.folder ? 'folder' : 'file',
        size: child.size || 0,
        webUrl: child.webUrl,
        createdAt: child.createdDateTime,
        modifiedAt: child.lastModifiedDateTime,
        thumbnails: child.thumbnails || [],
        mimeType: child.file?.mimeType
      }))
    }));

    return NextResponse.json({
      success: true,
      folderName: "100 Maple Lane",
      contents: formattedContents
    });

  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}