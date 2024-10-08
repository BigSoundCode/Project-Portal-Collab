import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log('Middleware - Request URL:', request.url);

  const token = await getToken({ req: request });
  const isLoggedIn = !!token;
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isOnAdmin = request.nextUrl.pathname.startsWith('/admin');

  console.log('Is logged in:', isLoggedIn);
  console.log('Is admin:', token?.isAdmin);
  console.log('Is on admin route:', isOnAdmin);

  if (isOnDashboard && !isLoggedIn) {
    console.log('Redirecting to login from dashboard');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnAdmin && (!isLoggedIn || !token?.isAdmin)) {
    console.log('Redirecting to login from admin');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Proceeding to next middleware or route handler');
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};

