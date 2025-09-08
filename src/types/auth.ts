// Authentication types for the workout app
// Import user types from PayloadCMS generated types

export type { ProductUser, User as AdminUser } from '../payload/payload-types'

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
