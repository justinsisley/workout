import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import type { AuthToken, ProductUser } from '@/types/auth'
import { serverConfig } from '@/lib/config'
const JWT_EXPIRES_IN = '7d' // 7 days

/**
 * Generate a JWT token for authenticated product user
 */
export async function generateJWTToken(productUser: ProductUser): Promise<string> {
  const secret = new TextEncoder().encode(serverConfig().JWT_SECRET)

  const token = await new SignJWT({ productUserId: productUser.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)

  return token
}

/**
 * Verify and decode JWT token
 */
export async function verifyJWTToken(token: string): Promise<AuthToken | null> {
  try {
    const secret = new TextEncoder().encode(serverConfig().JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (payload.productUserId && typeof payload.productUserId === 'string') {
      return {
        productUserId: payload.productUserId,
        iat: payload.iat!,
        exp: payload.exp!,
      } as AuthToken
    }
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJwt(token)
    if (!decoded || !decoded.exp) return true

    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (_error) {
    return true
  }
}

/**
 * Get JWT token from localStorage (client-side only)
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('workout-app-jwt-token')
}

/**
 * Store JWT token in localStorage and cookies (client-side only)
 */
export function storeToken(token: string): void {
  if (typeof window === 'undefined') return

  // Store in localStorage
  localStorage.setItem('workout-app-jwt-token', token)

  // Store in cookie for middleware access
  // Set cookie with 7 days expiration (same as JWT)
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 7)

  document.cookie = `workout-app-jwt-token=${token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
}

/**
 * Remove JWT token from localStorage and cookies (client-side only)
 */
export function removeStoredToken(): void {
  if (typeof window === 'undefined') return

  // Remove from localStorage
  localStorage.removeItem('workout-app-jwt-token')

  // Remove from cookies
  document.cookie = 'workout-app-jwt-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

/**
 * Initialize auth state from stored token
 */
export async function initializeAuthFromToken(): Promise<{
  isValid: boolean
  payload?: AuthToken
}> {
  const token = getStoredToken()
  if (!token) return { isValid: false }

  if (isTokenExpired(token)) {
    removeStoredToken()
    return { isValid: false }
  }

  const payload = await verifyJWTToken(token)
  if (!payload) {
    removeStoredToken()
    return { isValid: false }
  }

  return { isValid: true, payload }
}

/**
 * Get current authenticated product user ID from request headers (server-side)
 * This is set by middleware after JWT verification
 */
export function getCurrentProductUserId(headers: Headers): string | null {
  return headers.get('x-user-id')
}

/**
 * Server-side authentication check helper
 */
export async function requireAuth(headers: Headers): Promise<string> {
  const productUserId = getCurrentProductUserId(headers)
  if (!productUserId) {
    throw new Error('Authentication required')
  }
  return productUserId
}

/**
 * Get current authenticated product user (server-side)
 * This checks the JWT token from cookies and returns the full user object
 */
export async function getCurrentProductUser(): Promise<ProductUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('workout-app-jwt-token')?.value

    if (!token) {
      return null
    }

    // Verify the JWT token
    const authToken = await verifyJWTToken(token)
    if (!authToken) {
      return null
    }

    // Get the user from the database
    const payload = await getPayload({ config: configPromise })
    const user = await payload.findByID({
      collection: 'productUsers',
      id: authToken.productUserId,
    })

    return user as ProductUser
  } catch (error) {
    console.error('Get current product user error:', error)
    return null
  }
}
