/**
 * Type-safe environment configuration
 * Access environment variables through this config object, never process.env directly
 */

interface EnvironmentConfig {
  // Frontend
  NEXT_PUBLIC_APP_URL: string

  // Backend
  DATABASE_URI: string
  JWT_SECRET: string
  PAYLOAD_SECRET: string

  // WebAuthN Configuration
  WEBAUTHN_RP_ID: string
  WEBAUTHN_RP_NAME: string

  // Shared
  NODE_ENV: 'development' | 'production' | 'test'
}

function getEnvVar(key: keyof EnvironmentConfig): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const config: EnvironmentConfig = {
  // Frontend
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL'),

  // Backend
  DATABASE_URI: getEnvVar('DATABASE_URI'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  PAYLOAD_SECRET: getEnvVar('PAYLOAD_SECRET'),

  // WebAuthN Configuration
  WEBAUTHN_RP_ID: getEnvVar('WEBAUTHN_RP_ID'),
  WEBAUTHN_RP_NAME: getEnvVar('WEBAUTHN_RP_NAME'),

  // Shared
  NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
}

// Validation function to check if all required environment variables are set
export function validateEnvironment(): void {
  const requiredVars: (keyof EnvironmentConfig)[] = [
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URI',
    'JWT_SECRET',
    'PAYLOAD_SECRET',
    'WEBAUTHN_RP_ID',
    'WEBAUTHN_RP_NAME',
  ]

  const missingVars: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.',
    )
  }
}

// Export individual config values for convenience
export const {
  NEXT_PUBLIC_APP_URL,
  DATABASE_URI,
  JWT_SECRET,
  PAYLOAD_SECRET,
  WEBAUTHN_RP_ID,
  WEBAUTHN_RP_NAME,
  NODE_ENV,
} = config
