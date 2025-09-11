/**
 * Type-safe environment configuration
 * Following Next.js best practices for environment variables
 */

interface ServerConfig {
  // Backend (only available on server)
  DATABASE_URI: string
  JWT_SECRET: string
  PAYLOAD_SECRET: string
  WEBAUTHN_RP_ID: string
  WEBAUTHN_RP_NAME: string
}

function getServerEnvVar(key: keyof ServerConfig): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Server-side config (only available on server)
export function serverConfig(): ServerConfig {
  if (typeof window !== 'undefined') {
    throw new Error('Server config should not be accessed on the client side')
  }

  return {
    DATABASE_URI: getServerEnvVar('DATABASE_URI'),
    JWT_SECRET: getServerEnvVar('JWT_SECRET'),
    PAYLOAD_SECRET: getServerEnvVar('PAYLOAD_SECRET'),
    WEBAUTHN_RP_ID: getServerEnvVar('WEBAUTHN_RP_ID'),
    WEBAUTHN_RP_NAME: getServerEnvVar('WEBAUTHN_RP_NAME'),
  }
}

// Client-side environment variables - access directly via process.env
// These are automatically available on both client and server
export const NEXT_PUBLIC_APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const NODE_ENV = process.env.NODE_ENV as 'development' | 'production' | 'test'

// Validation function to check if all required environment variables are set
export function validateEnvironment(): void {
  const missingVars: string[] = []

  // Check client vars (always available) - NEXT_PUBLIC_APP_URL has fallback
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('NEXT_PUBLIC_APP_URL not set, using fallback value')
  }

  // Check server vars only on server side
  if (typeof window === 'undefined') {
    const serverVars: (keyof ServerConfig)[] = [
      'DATABASE_URI',
      'JWT_SECRET',
      'PAYLOAD_SECRET',
      'WEBAUTHN_RP_ID',
      'WEBAUTHN_RP_NAME',
    ]

    for (const varName of serverVars) {
      if (!process.env[varName]) {
        missingVars.push(varName)
      }
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.',
    )
  }
}
