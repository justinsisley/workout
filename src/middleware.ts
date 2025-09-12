import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com", // Allow inline scripts for Next.js + YouTube API
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for styling
    "img-src 'self' data: https:", // Allow images from same origin, data URLs, and HTTPS
    "font-src 'self' data:",
    "connect-src 'self' https://www.youtube.com https://s.ytimg.com", // Allow YouTube connections
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com", // Allow YouTube iframes
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

/**
 * Verify JWT token using Edge Runtime compatible jose library
 */
async function verifyJWTTokenEdge(token: string): Promise<{ productUserId: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (payload.productUserId && typeof payload.productUserId === 'string') {
      return { productUserId: payload.productUserId }
    }
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
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
    const payload = await verifyJWTTokenEdge(token)
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
    const payload = await verifyJWTTokenEdge(token)
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, *.jpeg, *.gif, *.svg, *.ico (static images)
     * - *.css, *.js (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js)$).*)',
  ],
}
