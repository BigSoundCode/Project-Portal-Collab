import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/dashboard';
const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

export async function POST(request: NextRequest) {
  console.log('Token exchange request received');

  const { code, codeVerifier } = await request.json();

  if (!code || !codeVerifier) {
    console.error('Missing code or codeVerifier');
    return NextResponse.json({ error: 'Missing code or codeVerifier' }, { status: 400 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error('Missing environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  console.log('Attempting to exchange code for token');

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed. Status:', response.status, 'Error:', errorData);
      return NextResponse.json({ error: 'Failed to exchange token', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log('Token exchange successful');
    return NextResponse.json({ accessToken: data.access_token });
  } catch (error) {
    console.error('Error during token exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: `Failed to exchange token: ${errorMessage}` }, { status: 500 });
  }
}