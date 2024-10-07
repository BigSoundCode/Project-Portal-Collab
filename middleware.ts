import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log('Middleware - Request URL:', request.url);

  const token = await getToken({ req: request });
  const isLoggedIn = !!token;
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isOnAdmin = request.nextUrl.pathname.startsWith('/admin');

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnAdmin && (!isLoggedIn || !token?.is_admin)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};