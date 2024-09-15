// File: app/api/download-file/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId');
  const accessToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!fileId || !accessToken) {
    console.error('Missing fileId or access token');
    return NextResponse.json({ error: 'Missing fileId or access token' }, { status: 400 });
  }

  try {
    console.log(`Fetching file with ID: ${fileId}`);
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch file from OneDrive. Status: ${response.status}, Error: ${errorText}`);
      return NextResponse.json({ error: `Failed to fetch file from OneDrive: ${response.status} ${errorText}` }, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type');
    const contentDisposition = response.headers.get('Content-Disposition');
    console.log(`Content-Type: ${contentType}, Content-Disposition: ${contentDisposition}`);

    const fileContent = await response.arrayBuffer();
    console.log(`File content length: ${fileContent.byteLength} bytes`);
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': contentDisposition || 'attachment; filename="download"',
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: `Failed to download file: ${error.message}` }, { status: 500 });
  }
}
  