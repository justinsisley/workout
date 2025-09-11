import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import type { ProductUser } from '@/types/auth'
import { verifyJWTToken } from './auth'

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
