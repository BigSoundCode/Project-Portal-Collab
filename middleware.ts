import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('NEXTAUTH_SECRET is not set');
    return NextResponse.error();
  }

  console.log('Middleware - Cookies:', request.cookies.getAll());
  console.log('Middleware - Headers:', Object.fromEntries(request.headers));

  const token = await getToken({ 
    req: request as any,
    secret: secret,
    secureCookie: process.env.NEXTAUTH_URL?.startsWith('https://') ?? !!process.env.VERCEL_URL
  });

  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  console.log('Middleware - Path:', request.nextUrl.pathname);
  console.log('Middleware - Is Authenticated:', isAuth);
  console.log('Middleware - Is Auth Page:', isAuthPage);
  console.log('Middleware - Token:', token);

  // Rest of the middleware code...
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};