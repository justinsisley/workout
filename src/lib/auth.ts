import jwt from 'jsonwebtoken'
import type { AuthToken, ProductUser } from '@/types/auth'
import { JWT_SECRET } from '@/lib/config'
const JWT_EXPIRES_IN = '7d' // 7 days

/**
 * Generate a JWT token for authenticated product user
 */
export function generateJWTToken(productUser: ProductUser): string {
  const payload: Omit<AuthToken, 'iat' | 'exp'> = {
    productUserId: productUser.id,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify and decode JWT token
 */
export function verifyJWTToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken
    return decoded
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
    const decoded = jwt.decode(token) as AuthToken
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
 * Store JWT token in localStorage (client-side only)
 */
export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('workout-app-jwt-token', token)
}

/**
 * Remove JWT token from localStorage (client-side only)
 */
export function removeStoredToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('workout-app-jwt-token')
}

/**
 * Initialize auth state from stored token
 */
export function initializeAuthFromToken(): { isValid: boolean; payload?: AuthToken } {
  const token = getStoredToken()
  if (!token) return { isValid: false }

  if (isTokenExpired(token)) {
    removeStoredToken()
    return { isValid: false }
  }

  const payload = verifyJWTToken(token)
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
