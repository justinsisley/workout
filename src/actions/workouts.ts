'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { z } from 'zod'
import { getCurrentProductUser } from '@/lib/auth-server'

// Validation schema for saving exercise completion
const SaveExerciseCompletionSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  programId: z.string().min(1, 'Program ID is required'),
  milestoneIndex: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  dayIndex: z.number().int().min(0, 'Day index must be 0 or greater'),
  sets: z.number().int().min(1, 'Sets must be at least 1').max(99, 'Sets cannot exceed 99'),
  reps: z.number().int().min(1, 'Reps must be at least 1').max(999, 'Reps cannot exceed 999'),
  weight: z.number().min(0).max(1000).optional(),
  time: z.number().min(0).max(999).optional(),
  distance: z.number().min(0).max(999).optional(),
  distanceUnit: z.enum(['meters', 'miles']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export type SaveExerciseCompletionInput = z.infer<typeof SaveExerciseCompletionSchema>

export interface SaveExerciseCompletionResult {
  success: boolean
  error?: string
  exerciseCompletionId?: string
}

/**
 * Save exercise completion data to the database
 * Creates a new exercise completion record with program context
 */
export async function saveExerciseCompletion(
  input: SaveExerciseCompletionInput,
): Promise<SaveExerciseCompletionResult> {
  try {
    // Validate input data
    const validatedInput = SaveExerciseCompletionSchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to save workout data. Please sign in and try again.',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Check if this exact exercise completion already exists for this user/exercise/program/milestone/day
    // This prevents duplicate entries when users save multiple times
    const existingCompletion = await payload.find({
      collection: 'exerciseCompletions',
      where: {
        and: [
          {
            productUser: { equals: currentUser.id },
          },
          {
            exercise: { equals: validatedInput.exerciseId },
          },
          {
            program: { equals: validatedInput.programId },
          },
          {
            milestoneIndex: { equals: validatedInput.milestoneIndex },
          },
          {
            dayIndex: { equals: validatedInput.dayIndex },
          },
        ],
      },
      limit: 1,
    })

    const now = new Date()

    let exerciseCompletionId: string

    if (existingCompletion.docs.length > 0) {
      // Update existing completion record
      const existingDoc = existingCompletion.docs[0]
      if (!existingDoc?.id) {
        return {
          success: false,
          error: 'Failed to update existing exercise completion. Please try again.',
        }
      }

      const updateData = {
        sets: validatedInput.sets,
        reps: validatedInput.reps,
        completedAt: now.toISOString(),
        ...(validatedInput.weight !== undefined && { weight: validatedInput.weight }),
        ...(validatedInput.time !== undefined && { time: validatedInput.time }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
      }

      const updateResult = await payload.update({
        collection: 'exerciseCompletions',
        id: existingDoc.id,
        data: updateData,
      })

      exerciseCompletionId = updateResult.id as string
    } else {
      // Create new completion record
      const createData = {
        productUser: currentUser.id,
        exercise: validatedInput.exerciseId,
        program: validatedInput.programId,
        milestoneIndex: validatedInput.milestoneIndex,
        dayIndex: validatedInput.dayIndex,
        sets: validatedInput.sets,
        reps: validatedInput.reps,
        completedAt: now.toISOString(),
        ...(validatedInput.weight !== undefined && { weight: validatedInput.weight }),
        ...(validatedInput.time !== undefined && { time: validatedInput.time }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
      }

      const createResult = await payload.create({
        collection: 'exerciseCompletions',
        data: createData,
      })

      exerciseCompletionId = createResult.id as string
    }

    return {
      success: true,
      exerciseCompletionId,
    }
  } catch (error) {
    console.error('Save exercise completion error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid workout data: ${error.issues.map((e) => e.message).join(', ')}`,
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to save workout data. Please sign in and try again.',
        }
      }
      if (errorMessage.includes('validation')) {
        return {
          success: false,
          error: 'Invalid workout data provided. Please check your inputs and try again.',
        }
      }
    }

    return {
      success: false,
      error: 'Failed to save workout data. Please try again.',
    }
  }
}

// Auto-save validation schema (more lenient for partial saves)
const AutoSaveExerciseDataSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  programId: z.string().min(1, 'Program ID is required'),
  milestoneIndex: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  dayIndex: z.number().int().min(0, 'Day index must be 0 or greater'),
  sets: z.number().int().min(0).max(99).optional(), // Allow 0 for auto-save
  reps: z.number().int().min(0).max(999).optional(), // Allow 0 for auto-save
  weight: z.number().min(0).max(1000).optional(),
  time: z.number().min(0).max(999).optional(),
  distance: z.number().min(0).max(999).optional(),
  distanceUnit: z.enum(['meters', 'miles']).optional(),
  notes: z.string().max(500).optional(),
})

export type AutoSaveExerciseDataInput = z.infer<typeof AutoSaveExerciseDataSchema>

export interface AutoSaveExerciseDataResult {
  success: boolean
  error?: string
  saved?: boolean // Indicates if auto-save actually occurred
}

/**
 * Auto-save exercise data as user types (for preventing data loss)
 * Uses more lenient validation and doesn't require complete data
 */
export async function autoSaveExerciseData(
  input: AutoSaveExerciseDataInput,
): Promise<AutoSaveExerciseDataResult> {
  try {
    // Validate input data with lenient schema
    const validatedInput = AutoSaveExerciseDataSchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'Authentication required for auto-save',
      }
    }

    // Only auto-save if we have meaningful data to save
    const hasMeaningfulData =
      (validatedInput.sets !== undefined && validatedInput.sets > 0) ||
      (validatedInput.reps !== undefined && validatedInput.reps > 0) ||
      (validatedInput.weight !== undefined && validatedInput.weight > 0) ||
      (validatedInput.time !== undefined && validatedInput.time > 0) ||
      (validatedInput.distance !== undefined && validatedInput.distance > 0) ||
      (validatedInput.notes !== undefined && validatedInput.notes.length > 0)

    if (!hasMeaningfulData) {
      return {
        success: true,
        saved: false, // No meaningful data to save
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Check for existing auto-save record (use a special collection or flag for auto-saves)
    // For now, we'll use the same collection but mark it as incomplete
    const existingAutoSave = await payload.find({
      collection: 'exerciseCompletions',
      where: {
        and: [
          {
            productUser: { equals: currentUser.id },
          },
          {
            exercise: { equals: validatedInput.exerciseId },
          },
          {
            program: { equals: validatedInput.programId },
          },
          {
            milestoneIndex: { equals: validatedInput.milestoneIndex },
          },
          {
            dayIndex: { equals: validatedInput.dayIndex },
          },
        ],
      },
      limit: 1,
    })

    const now = new Date()

    if (existingAutoSave.docs.length > 0) {
      // Update existing auto-save record
      const existingDoc = existingAutoSave.docs[0]
      if (!existingDoc?.id) {
        return {
          success: false,
          error: 'Failed to auto-save workout data',
        }
      }

      const updateData = {
        ...(validatedInput.sets !== undefined &&
          validatedInput.sets > 0 && { sets: validatedInput.sets }),
        ...(validatedInput.reps !== undefined &&
          validatedInput.reps > 0 && { reps: validatedInput.reps }),
        ...(validatedInput.weight !== undefined && { weight: validatedInput.weight }),
        ...(validatedInput.time !== undefined && { time: validatedInput.time }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
      }

      await payload.update({
        collection: 'exerciseCompletions',
        id: existingDoc.id,
        data: updateData,
      })
    } else {
      // Create new auto-save record with partial data
      const createData = {
        productUser: currentUser.id,
        exercise: validatedInput.exerciseId,
        program: validatedInput.programId,
        milestoneIndex: validatedInput.milestoneIndex,
        dayIndex: validatedInput.dayIndex,
        sets: validatedInput.sets || 0,
        reps: validatedInput.reps || 0,
        completedAt: now.toISOString(),
        ...(validatedInput.weight !== undefined && { weight: validatedInput.weight }),
        ...(validatedInput.time !== undefined && { time: validatedInput.time }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
      }

      await payload.create({
        collection: 'exerciseCompletions',
        data: createData,
      })
    }

    return {
      success: true,
      saved: true,
    }
  } catch (error) {
    console.error('Auto-save exercise data error:', error)

    // Auto-save failures should be silent to avoid disrupting user experience
    return {
      success: false,
      error: 'Auto-save failed silently',
    }
  }
}

// Validation schema for exercise completion and advancement
const CompleteExerciseAndAdvanceSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  programId: z.string().min(1, 'Program ID is required'),
  milestoneIndex: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  dayIndex: z.number().int().min(0, 'Day index must be 0 or greater'),
  currentExerciseIndex: z.number().int().min(0, 'Exercise index must be 0 or greater'),
  sets: z.number().int().min(1, 'Sets must be at least 1').max(99, 'Sets cannot exceed 99'),
  reps: z.number().int().min(1, 'Reps must be at least 1').max(999, 'Reps cannot exceed 999'),
  weight: z.number().min(0).max(1000).optional(),
  time: z.number().min(0).max(999).optional(),
  distance: z.number().min(0).max(999).optional(),
  distanceUnit: z.enum(['meters', 'miles']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  isAmrapDay: z.boolean().default(false),
  amrapTimeRemaining: z.number().min(0).optional(), // seconds remaining for AMRAP
})

export type CompleteExerciseAndAdvanceInput = z.infer<typeof CompleteExerciseAndAdvanceSchema>

export interface ExerciseAdvancement {
  exerciseCompleted: boolean
  nextExerciseIndex: number | null // null means no more exercises
  roundCompleted: boolean // for AMRAP workouts
  dayCompleted: boolean
  amrapTimeExpired: boolean
}

export interface CompleteExerciseAndAdvanceResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'not_found' | 'system_error' | 'program_mismatch'
  exerciseCompletionId?: string | undefined
  advancement?: ExerciseAdvancement
}

/**
 * Complete an exercise and advance to the next exercise in the day sequence
 * Handles both regular workouts and AMRAP round cycling logic
 */
export async function completeExerciseAndAdvance(
  input: CompleteExerciseAndAdvanceInput,
): Promise<CompleteExerciseAndAdvanceResult> {
  try {
    // Validate input data
    const validatedInput = CompleteExerciseAndAdvanceSchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to complete exercises. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // First, save the exercise completion using existing logic
    const completionResult = await saveExerciseCompletion({
      exerciseId: validatedInput.exerciseId,
      programId: validatedInput.programId,
      milestoneIndex: validatedInput.milestoneIndex,
      dayIndex: validatedInput.dayIndex,
      sets: validatedInput.sets,
      reps: validatedInput.reps,
      weight: validatedInput.weight,
      time: validatedInput.time,
      distance: validatedInput.distance,
      distanceUnit: validatedInput.distanceUnit,
      notes: validatedInput.notes,
    })

    if (!completionResult.success) {
      return {
        success: false,
        error: completionResult.error || 'Failed to save exercise completion',
        errorType: 'system_error',
      }
    }

    // Get the program to understand the day structure
    const program = await payload.findByID({
      collection: 'programs',
      id: validatedInput.programId,
    })

    if (!program) {
      return {
        success: false,
        error: 'Program not found',
        errorType: 'not_found',
      }
    }

    // Validate milestone and day indices
    if (!program.milestones || !Array.isArray(program.milestones)) {
      return {
        success: false,
        error: 'Program has no milestones',
        errorType: 'program_mismatch',
      }
    }

    const milestone = program.milestones[validatedInput.milestoneIndex]
    if (!milestone) {
      return {
        success: false,
        error: 'Invalid milestone index',
        errorType: 'program_mismatch',
      }
    }

    if (!milestone.days || !Array.isArray(milestone.days)) {
      return {
        success: false,
        error: 'Milestone has no days',
        errorType: 'program_mismatch',
      }
    }

    const day = milestone.days[validatedInput.dayIndex]
    if (!day || day.dayType !== 'workout') {
      return {
        success: false,
        error: 'Invalid day index or day is not a workout day',
        errorType: 'program_mismatch',
      }
    }

    // Calculate exercise advancement
    const totalExercises = day.exercises?.length || 0
    const currentIndex = validatedInput.currentExerciseIndex
    let nextExerciseIndex: number | null = null
    let roundCompleted = false
    let dayCompleted = false
    let amrapTimeExpired = false

    if (validatedInput.isAmrapDay) {
      // AMRAP logic: cycle through exercises until time expires
      amrapTimeExpired = (validatedInput.amrapTimeRemaining || 0) <= 0

      if (amrapTimeExpired) {
        // Time expired - day is complete
        dayCompleted = true
        nextExerciseIndex = null
      } else {
        // Check if we've completed the last exercise in the round
        if (currentIndex >= totalExercises - 1) {
          // Round completed - restart at first exercise
          roundCompleted = true
          nextExerciseIndex = 0
        } else {
          // Move to next exercise in current round
          nextExerciseIndex = currentIndex + 1
        }
      }
    } else {
      // Regular workout logic: linear progression through exercises
      if (currentIndex >= totalExercises - 1) {
        // Last exercise completed - day is complete
        dayCompleted = true
        nextExerciseIndex = null
      } else {
        // Move to next exercise
        nextExerciseIndex = currentIndex + 1
      }
    }

    const advancement: ExerciseAdvancement = {
      exerciseCompleted: true,
      nextExerciseIndex,
      roundCompleted,
      dayCompleted,
      amrapTimeExpired,
    }

    return {
      success: true,
      exerciseCompletionId: completionResult.exerciseCompletionId,
      advancement,
    }
  } catch (error) {
    console.error('Complete exercise and advance error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid input data: ${error.issues.map((e) => e.message).join(', ')}`,
        errorType: 'validation',
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to complete exercises. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'Failed to complete exercise and advance. Please try again.',
      errorType: 'system_error',
    }
  }
}
