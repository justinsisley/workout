// Authentication types for the workout app

export interface ProductUser {
  id: string
  phoneNumber: string
  displayName?: string
  currentProgram?: string
  currentMilestone?: string
  currentDay: number
  lastWorkoutDate?: Date
  totalWorkoutsCompleted: number
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

export interface OTPVerification {
  phoneNumber: string
  otp: string
  expiresAt: Date
}
