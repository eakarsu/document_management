import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/documents', '/folders', '/search', '/analytics', '/users', '/settings', '/profile'];

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/verify-email'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get authentication token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasValidToken = Boolean(accessToken);

  // Prevent redirect loops - don't redirect if already on login with redirect param
  const hasRedirectParam = request.nextUrl.searchParams.has('redirect');
  const isAlreadyOnLogin = pathname === '/login';
  
  if (isAlreadyOnLogin && hasRedirectParam && !hasValidToken) {
    // Already on login page with redirect, let it proceed
    return NextResponse.next();
  }

  // If accessing a protected route without a valid token, redirect to login
  if (isProtectedRoute && !hasValidToken) {
    // Don't redirect if already on login page to prevent loops
    if (isAlreadyOnLogin) {
      return NextResponse.next();
    }
    
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return to original destination after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing a public route with a valid token, redirect to dashboard
  if (isPublicRoute && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For API routes, add CORS headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-src 'self' http://localhost:4000 https://localhost:4000",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};