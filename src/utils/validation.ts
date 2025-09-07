// Validation utilities

import { z } from 'zod'

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be no more than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Passkey credential validation
export const passkeyCredentialSchema = z.object({
  credentialID: z.string(),
  publicKey: z.string(),
  counter: z.number(),
  deviceType: z.string().optional(),
  backedUp: z.boolean().default(false),
  transports: z.array(z.string()).optional(),
})

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
