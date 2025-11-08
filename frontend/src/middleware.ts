import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs before every request
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check if user is authenticated (in a real app, check for valid JWT token in cookies)
  const token = request.cookies.get('auth-token')?.value;

  // Redirect to login if accessing protected route without authentication
  if (!isPublicRoute && !token && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isPublicRoute && token) {
    // Extract role from token (in real app, decode JWT)
    const role = request.cookies.get('user-role')?.value || 'farmer';
    return NextResponse.redirect(new URL(`/${role}`, request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
