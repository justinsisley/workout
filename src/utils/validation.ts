// Validation utilities

import { z } from 'zod'

// Phone number validation
export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format')

// OTP validation
export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers')

// Exercise completion validation
export const exerciseCompletionSchema = z.object({
  sets: z.number().min(1, 'Sets must be at least 1'),
  reps: z.number().min(1, 'Reps must be at least 1'),
  weight: z.number().min(0).optional(),
  time: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// Program assignment validation
export const programAssignmentSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  productUserId: z.string().min(1, 'Product User ID is required'),
})

export type ExerciseCompletionData = z.infer<typeof exerciseCompletionSchema>
export type ProgramAssignmentData = z.infer<typeof programAssignmentSchema>
