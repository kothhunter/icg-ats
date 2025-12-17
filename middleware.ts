import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the route is protected (starts with /dashboard)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Get the officer_session cookie
    const sessionCookie = request.cookies.get('officer_session');

    // If no session cookie exists, redirect to login
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      // Store the intended destination for redirect after login
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate the session cookie has content
    try {
      const session = JSON.parse(sessionCookie.value);

      // Check if session has required fields
      if (!session.id || !session.username || !session.display_name) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      // Invalid JSON in cookie, redirect to login
      console.error('Invalid session cookie:', error);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Session is valid, allow access
    return NextResponse.next();
  }

  // For non-protected routes, continue normally
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',  // Protect all dashboard routes
  ],
};
