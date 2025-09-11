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

// New types for Story 2.2 user management server actions
export interface CreateProductUserResult {
  success: boolean
  productUserId?: string
  error?: string
}

export interface FindProductUserResult {
  success: boolean
  productUser?: ProductUser
  error?: string
}

export interface UpdateUserStatusResult {
  success: boolean
  productUser?: ProductUser
  error?: string
}

export interface TrackAuthenticationStatusResult {
  success: boolean
  error?: string
}

export interface AuthenticationErrorResult {
  success: boolean
  message: string
  shouldRetry: boolean
}

export interface UserStatusUpdate {
  currentProgram?: string
  currentMilestone?: string
  currentDay?: number
  lastWorkoutDate?: string
  totalWorkoutsCompleted?: number
}

export interface AuthenticationEvent {
  eventType: 'login' | 'logout' | 'registration' | 'authentication_failure'
  timestamp?: string
  details?: string
}

export type AuthenticationErrorType =
  | 'duplicate_user'
  | 'authentication_failure'
  | 'invalid_credentials'
  | 'rate_limit_exceeded'
