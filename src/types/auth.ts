// Authentication types for the workout app
// Import user types from PayloadCMS generated types
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'

import type { ProductUser as PayloadProductUser, User } from '../payload/payload-types'

export type ProductUser = PayloadProductUser
export type AdminUser = User

// Re-export SimpleWebAuthN types for consistency
export type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
}

export interface AuthToken {
  productUserId: string
  iat: number
  exp: number
}

export interface PasskeyCredential {
  credentialID: string
  publicKey: string
  counter: number
  deviceType?: string
  backedUp: boolean
  transports?: string[]
}

// Auth state interface for Zustand store
export interface AuthState {
  productUser: ProductUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setProductUser: (productUser: ProductUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

// Server action response types
export interface PasskeyRegistrationResult {
  success: boolean
  error?: string
  registrationOptions?: PublicKeyCredentialCreationOptionsJSON
  productUserId?: string
}

export interface PasskeyAuthenticationResult {
  success: boolean
  error?: string
  authenticationOptions?: PublicKeyCredentialRequestOptionsJSON
  productUser?: ProductUser
  token?: string
}

export interface UsernameCheckResult {
  available: boolean
  error?: string
}

export interface RegistrationVerificationResult {
  success: boolean
  error?: string
  productUser?: ProductUser
  token?: string
}

export interface AuthenticationVerificationResult {
  success: boolean
  error?: string
  productUser?: ProductUser
  token?: string
}
