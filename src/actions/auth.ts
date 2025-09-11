'use server'

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'
import { z } from 'zod'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { headers } from 'next/headers'

import { serverConfig, NEXT_PUBLIC_APP_URL } from '@/lib/config'
import { generateJWTToken } from '@/lib/auth'
import type {
  PasskeyRegistrationResult,
  PasskeyAuthenticationResult,
  UsernameCheckResult,
  RegistrationVerificationResult,
  AuthenticationVerificationResult,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@/types/auth'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limit settings
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5 // 5 attempts per 15 minutes

/**
 * Simple rate limiter for authentication endpoints
 */
function checkRateLimit(identifier: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const key = `auth:${identifier}`

  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    // First attempt or window expired, reset
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (current.count >= MAX_ATTEMPTS_PER_WINDOW) {
    const remainingTime = Math.ceil((current.resetTime - now) / 60000) // minutes
    return {
      allowed: false,
      error: `Too many authentication attempts. Please try again in ${remainingTime} minute(s).`,
    }
  }

  // Increment counter
  current.count++
  rateLimitMap.set(key, current)

  return { allowed: true }
}

/**
 * Get client identifier for rate limiting (IP address or fallback)
 */
async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')

    // Use forwarded IP, real IP, or fallback to generic identifier
    return forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown'
  } catch {
    return 'unknown'
  }
}

// Validation schemas
const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

const ProductUserIdSchema = z.string().min(1, 'Product user ID is required')

/**
 * Check if username is available for registration
 */
export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
  try {
    // Validate username format
    const validatedUsername = UsernameSchema.parse(username)

    const payload = await getPayload({ config: configPromise })

    // Check if username already exists
    const existingUser = await payload.find({
      collection: 'productUsers',
      where: {
        username: {
          equals: validatedUsername,
        },
      },
      limit: 1,
    })

    if (existingUser.docs.length > 0) {
      return { available: false, error: 'Username is already taken' }
    }

    return { available: true }
  } catch (error) {
    console.error('Username availability check error:', error)

    if (error instanceof z.ZodError) {
      return { available: false, error: error.issues[0]?.message || 'Invalid username format' }
    }

    return { available: false, error: 'Failed to check username availability' }
  }
}

/**
 * Generate registration options for WebAuthN passkey creation
 */
export async function generatePasskeyRegistrationOptions(
  username: string,
): Promise<PasskeyRegistrationResult> {
  try {
    // Check rate limit
    const clientId = await getClientIdentifier()
    const rateLimitResult = checkRateLimit(clientId)
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.error || 'Rate limit exceeded' }
    }

    // Validate username
    const validatedUsername = UsernameSchema.parse(username)

    const payload = await getPayload({ config: configPromise })

    // Check username availability again
    const usernameCheck = await checkUsernameAvailability(validatedUsername)
    if (!usernameCheck.available) {
      return { success: false, error: usernameCheck.error || 'Username not available' }
    }

    // Create preliminary product user record for progressive validation
    const productUser = await payload.create({
      collection: 'productUsers',
      data: {
        username: validatedUsername,
        // passkeyCredentials will be added after successful registration
      },
    })

    // Generate WebAuthN registration options
    const registrationOptions = await generateRegistrationOptions({
      rpName: serverConfig().WEBAUTHN_RP_NAME,
      rpID: serverConfig().WEBAUTHN_RP_ID,
      userName: validatedUsername,
      userID: isoUint8Array.fromUTF8String(productUser.id),
      userDisplayName: validatedUsername,
      attestationType: 'none',
      excludeCredentials: [], // No existing credentials to exclude for new user
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
      },
    })

    // Store challenge for verification
    await payload.update({
      collection: 'productUsers',
      id: productUser.id,
      data: {
        // Store challenge temporarily for verification
        webauthnChallenge: registrationOptions.challenge,
      },
    })

    return {
      success: true,
      registrationOptions,
      productUserId: productUser.id,
    }
  } catch (error) {
    console.error('Passkey registration options generation error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return { success: false, error: 'Failed to generate registration options' }
  }
}

/**
 * Verify passkey registration response and complete user registration
 */
export async function verifyPasskeyRegistration(
  productUserId: string,
  registrationResponse: RegistrationResponseJSON,
): Promise<RegistrationVerificationResult> {
  try {
    // Check rate limit
    const clientId = await getClientIdentifier()
    const rateLimitResult = checkRateLimit(clientId)
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.error || 'Rate limit exceeded' }
    }

    // Validate input
    const validatedProductUserId = ProductUserIdSchema.parse(productUserId)

    const payload = await getPayload({ config: configPromise })

    // Get user with stored challenge
    const productUser = await payload.findByID({
      collection: 'productUsers',
      id: validatedProductUserId,
    })

    if (!productUser) {
      return { success: false, error: 'User not found' }
    }

    if (!productUser.webauthnChallenge) {
      return { success: false, error: 'No active registration challenge' }
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: productUser.webauthnChallenge,
      expectedOrigin: NEXT_PUBLIC_APP_URL,
      expectedRPID: serverConfig().WEBAUTHN_RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: 'Registration verification failed' }
    }

    const { credential } = verification.registrationInfo

    // Store the credential in the user record
    await payload.update({
      collection: 'productUsers',
      id: validatedProductUserId,
      data: {
        passkeyCredentials: [
          {
            credentialID: credential.id as string,
            publicKey: isoBase64URL.fromBuffer(credential.publicKey),
            counter: credential.counter,
            deviceType: verification.registrationInfo.credentialDeviceType,
            backedUp: verification.registrationInfo.credentialBackedUp,
            transports:
              registrationResponse.response.transports?.map((transport) => ({ transport })) || [],
            registrationDate: new Date().toISOString(),
          },
        ],
        webauthnChallenge: null, // Clear the challenge
      },
    })

    // Fetch the updated user for JWT token generation
    const updatedUser = await payload.findByID({
      collection: 'productUsers',
      id: validatedProductUserId,
    })

    // Generate JWT token for authentication
    const token = await generateJWTToken(updatedUser)

    return {
      success: true,
      productUser: updatedUser,
      token,
    }
  } catch (error) {
    console.error('Passkey registration verification error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return { success: false, error: 'Registration verification failed' }
  }
}

/**
 * Generate authentication options for WebAuthN passkey login
 */
export async function generatePasskeyAuthenticationOptions(
  username: string,
): Promise<PasskeyAuthenticationResult> {
  try {
    // Check rate limit
    const clientId = await getClientIdentifier()
    const rateLimitResult = checkRateLimit(clientId)
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.error || 'Rate limit exceeded' }
    }

    // Validate username
    const validatedUsername = UsernameSchema.parse(username)

    const payload = await getPayload({ config: configPromise })

    // Find user by username
    const existingUsers = await payload.find({
      collection: 'productUsers',
      where: {
        username: {
          equals: validatedUsername,
        },
      },
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      return { success: false, error: 'Username not found' }
    }

    const productUser = existingUsers.docs[0]

    if (!productUser) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has registered passkeys
    if (!productUser.passkeyCredentials || productUser.passkeyCredentials.length === 0) {
      return { success: false, error: 'No passkeys registered for this user' }
    }

    // Prepare allowCredentials from stored credentials
    const allowCredentials = productUser.passkeyCredentials.map((cred) => ({
      id: cred.credentialID,
      transports: (cred.transports?.map((t) => t.transport).filter((t): t is string => t != null) ||
        []) as AuthenticatorTransportFuture[],
    }))

    // Generate WebAuthN authentication options
    const authenticationOptions = await generateAuthenticationOptions({
      rpID: serverConfig().WEBAUTHN_RP_ID,
      allowCredentials,
      userVerification: 'preferred',
    })

    // Store challenge for verification
    await payload.update({
      collection: 'productUsers',
      id: productUser.id,
      data: {
        webauthnChallenge: authenticationOptions.challenge,
      },
    })

    return {
      success: true,
      authenticationOptions,
      productUser,
    }
  } catch (error) {
    console.error('Passkey authentication options generation error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return { success: false, error: 'Failed to generate authentication options' }
  }
}

/**
 * Verify passkey authentication response and complete user login
 */
export async function verifyPasskeyAuthentication(
  username: string,
  authenticationResponse: AuthenticationResponseJSON,
): Promise<AuthenticationVerificationResult> {
  try {
    // Check rate limit
    const clientId = await getClientIdentifier()
    const rateLimitResult = checkRateLimit(clientId)
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.error || 'Rate limit exceeded' }
    }

    // Validate username
    const validatedUsername = UsernameSchema.parse(username)

    const payload = await getPayload({ config: configPromise })

    // Find user by username
    const existingUsers = await payload.find({
      collection: 'productUsers',
      where: {
        username: {
          equals: validatedUsername,
        },
      },
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const productUser = existingUsers.docs[0]

    if (!productUser) {
      return { success: false, error: 'User not found' }
    }

    if (!productUser.webauthnChallenge) {
      return { success: false, error: 'No active authentication challenge' }
    }

    if (!productUser.passkeyCredentials || productUser.passkeyCredentials.length === 0) {
      return { success: false, error: 'No passkeys registered for this user' }
    }

    // Find the credential being used
    const credentialID = authenticationResponse.id
    const credential = productUser.passkeyCredentials.find(
      (cred) => cred.credentialID === credentialID,
    )

    if (!credential) {
      return { success: false, error: 'Credential not found for this user' }
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: productUser.webauthnChallenge,
      expectedOrigin: NEXT_PUBLIC_APP_URL,
      expectedRPID: serverConfig().WEBAUTHN_RP_ID,
      credential: {
        id: credential.credentialID,
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: credential.counter,
      },
    })

    if (!verification.verified) {
      return { success: false, error: 'Authentication verification failed' }
    }

    // Update credential counter
    const updatedCredentials = productUser.passkeyCredentials.map((cred) => {
      if (cred.credentialID === credentialID) {
        return {
          ...cred,
          counter: verification.authenticationInfo.newCounter,
        }
      }
      return cred
    })

    // Update user record with new counter and clear challenge
    const updatedUser = await payload.update({
      collection: 'productUsers',
      id: productUser.id,
      data: {
        passkeyCredentials: updatedCredentials,
        webauthnChallenge: null, // Clear the challenge
      },
    })

    // Generate JWT token for session management
    const token = await generateJWTToken(updatedUser)

    return {
      success: true,
      productUser: updatedUser,
      token,
    }
  } catch (error) {
    console.error('Passkey authentication verification error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return { success: false, error: 'Authentication verification failed' }
  }
}
