'use server'

import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'
import { z } from 'zod'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

import { WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME, NEXT_PUBLIC_APP_URL } from '@/lib/config'
import type {
  PasskeyRegistrationResult,
  UsernameCheckResult,
  RegistrationVerificationResult,
  RegistrationResponseJSON,
} from '@/types/auth'

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
      rpName: WEBAUTHN_RP_NAME,
      rpID: WEBAUTHN_RP_ID,
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
      expectedRPID: WEBAUTHN_RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: 'Registration verification failed' }
    }

    const { credential } = verification.registrationInfo

    // Store the credential in the user record
    const updatedUser = await payload.update({
      collection: 'productUsers',
      id: validatedProductUserId,
      data: {
        passkeyCredentials: [
          {
            credentialID: isoBase64URL.fromBuffer(credential.id as unknown as Uint8Array),
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

    // TODO: Generate JWT token for authentication
    // This will be implemented in the session management task

    return {
      success: true,
      productUser: updatedUser,
      // token will be added when JWT implementation is complete
    }
  } catch (error) {
    console.error('Passkey registration verification error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return { success: false, error: 'Registration verification failed' }
  }
}
