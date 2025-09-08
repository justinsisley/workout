// Authentication types for the workout app

export interface ProductUser {
  id: string
  username: string
  displayName?: string
  currentProgram?: string
  currentMilestone?: number // 0-based index instead of relationship
  currentDay: number
  lastWorkoutDate?: Date
  // totalWorkoutsCompleted removed - calculated dynamically from exercise completions
  createdAt: Date
  updatedAt: Date
}

export interface AdminUser {
  id: string
  email: string
  password: string // Hashed by PayloadCMS
  createdAt: Date
  updatedAt: Date
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
