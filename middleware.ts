import { NextRequest, NextResponse } from 'next/server'
import { verifyJWTToken } from '@/lib/auth'

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/app', '/dashboard', '/workouts', '/programs', '/profile']

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/api/auth']

// Security headers for enhanced protection
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Enforce HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for styling
    "img-src 'self' data: https:", // Allow images from same origin, data URLs, and HTTPS
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Same as X-Frame-Options: DENY
  ].join('; '),
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API routes except auth-protected ones to pass through
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/protected')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Allow PayloadCMS admin routes to pass through (separate auth system)
  if (pathname.startsWith('/admin')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Check if current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  // Check if current path is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  )

  // Get JWT token from Authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.replace('Bearer ', '')
  const tokenFromCookie = request.cookies.get('workout-app-jwt-token')?.value
  const token = tokenFromHeader || tokenFromCookie

  // If accessing a protected route
  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }

    // Verify token
    const payload = verifyJWTToken(token)
    if (!payload) {
      // Redirect to login if invalid token
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }

    // Add user info to request headers for server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.productUserId)

    return addSecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
    )
  }

  // If accessing a public route while authenticated, allow but add user info
  if (isPublicRoute && token) {
    const payload = verifyJWTToken(token)
    if (payload) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.productUserId)

      return addSecurityHeaders(
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        }),
      )
    }
  }

  // Allow all other routes to pass through
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
