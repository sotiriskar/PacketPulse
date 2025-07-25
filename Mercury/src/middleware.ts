import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function middleware(request: NextRequest) {
  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add CORS headers for API routes
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  // Check authentication for protected routes
  const authToken = request.cookies.get('auth-token')?.value;

  // Allow access to auth-related pages and API routes
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api/auth/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/images/')
  ) {
    return NextResponse.next();
  }

  // If no auth token, redirect to login
  if (!authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Verify the JWT token
    await jwtVerify(authToken, new TextEncoder().encode(JWT_SECRET));
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon files
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|images/favicon.png).*)',
  ],
}; 