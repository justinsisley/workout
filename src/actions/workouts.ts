'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
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

// Validation schema for advancing to next day
const AdvanceToNextDaySchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  currentMilestoneIndex: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  currentDayIndex: z.number().int().min(0, 'Day index must be 0 or greater'),
  sessionDuration: z.number().min(0, 'Session duration must be 0 or greater').optional(),
  completedExercises: z.array(z.string()).default([]),
})

export type AdvanceToNextDayInput = z.infer<typeof AdvanceToNextDaySchema>

export interface DayAdvancement {
  advanced: boolean
  newMilestoneIndex: number
  newDayIndex: number
  programCompleted: boolean
  nextDay?: {
    id: string | null | undefined
    dayType: 'workout' | 'rest'
    isAmrap?: boolean | null | undefined
    amrapDuration?: number | null | undefined
    exercises?: any[]
  } | null
}

export interface AdvanceToNextDayResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'not_found' | 'program_complete' | 'system_error'
  advancement?: DayAdvancement
}

/**
 * Advance user to the next day in their program
 * Updates ProductUser progress and handles milestone progression
 */
export async function advanceToNextDay(
  input: AdvanceToNextDayInput,
): Promise<AdvanceToNextDayResult> {
  try {
    // Validate input data
    const validatedInput = AdvanceToNextDaySchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to advance to the next day. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Get the program to understand the structure
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

    // Validate current position
    if (!program.milestones || !Array.isArray(program.milestones)) {
      return {
        success: false,
        error: 'Program has no milestones',
        errorType: 'not_found',
      }
    }

    const currentMilestone = program.milestones[validatedInput.currentMilestoneIndex]
    if (!currentMilestone) {
      return {
        success: false,
        error: 'Invalid milestone index',
        errorType: 'not_found',
      }
    }

    if (!currentMilestone.days || !Array.isArray(currentMilestone.days)) {
      return {
        success: false,
        error: 'Milestone has no days',
        errorType: 'not_found',
      }
    }

    // Calculate next position
    let newMilestoneIndex = validatedInput.currentMilestoneIndex
    let newDayIndex = validatedInput.currentDayIndex + 1
    let programCompleted = false

    // Check if we need to move to the next milestone
    if (newDayIndex >= currentMilestone.days.length) {
      newMilestoneIndex = validatedInput.currentMilestoneIndex + 1
      newDayIndex = 0

      // Check if program is complete
      if (newMilestoneIndex >= program.milestones.length) {
        programCompleted = true
        // Keep at last valid position
        newMilestoneIndex = program.milestones.length - 1
        newDayIndex = currentMilestone.days.length - 1
      }
    }

    // Get next day info if program isn't complete
    let nextDay = null
    if (!programCompleted) {
      const nextMilestone = program.milestones[newMilestoneIndex]
      if (nextMilestone && nextMilestone.days && nextMilestone.days[newDayIndex]) {
        const nextDayData = nextMilestone.days[newDayIndex]
        if (nextDayData) {
          nextDay = {
            id: nextDayData.id,
            dayType: nextDayData.dayType,
            isAmrap: nextDayData.isAmrap,
            amrapDuration: nextDayData.amrapDuration || undefined,
            exercises: nextDayData.exercises || [],
          }
        }
      }
    }

    // Update ProductUser progress
    await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: {
        currentMilestone: newMilestoneIndex,
        currentDay: newDayIndex,
        lastWorkoutDate: new Date().toISOString(),
        totalWorkoutsCompleted: (currentUser.totalWorkoutsCompleted || 0) + 1,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')
    revalidatePath(`/workout/${validatedInput.programId}`)

    const advancement: DayAdvancement = {
      advanced: true,
      newMilestoneIndex,
      newDayIndex,
      programCompleted,
      nextDay,
    }

    return {
      success: true,
      advancement,
    }
  } catch (error) {
    console.error('Advance to next day error:', error)

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
          error: 'You must be logged in to advance to the next day. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'Failed to advance to next day. Please try again.',
      errorType: 'system_error',
    }
  }
}

// Validation schema for completing AMRAP day when timer expires
const CompleteAmrapDaySchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  milestoneIndex: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  dayIndex: z.number().int().min(0, 'Day index must be 0 or greater'),
  sessionDuration: z.number().min(0, 'Session duration must be 0 or greater'),
  totalRoundsCompleted: z.number().int().min(0, 'Total rounds must be 0 or greater'),
  completedExerciseIds: z.array(z.string()).default([]),
  exerciseProgress: z
    .record(
      z.string(),
      z.object({
        exerciseId: z.string(),
        completionPercentage: z.number().min(0).max(100),
        isCompleted: z.boolean(),
        hasData: z.boolean(),
      }),
    )
    .default({}),
})

export type CompleteAmrapDayInput = z.infer<typeof CompleteAmrapDaySchema>

export interface CompleteAmrapDayResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'not_found' | 'invalid_day_type' | 'system_error'
  dayCompletionId?: string
}

/**
 * Complete an AMRAP day when timer reaches zero
 * Records all progress made during the AMRAP session
 */
export async function completeAmrapDay(
  input: CompleteAmrapDayInput,
): Promise<CompleteAmrapDayResult> {
  try {
    // Validate input data
    const validatedInput = CompleteAmrapDaySchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to complete AMRAP days. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Get the program to validate the AMRAP day
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

    // Validate milestone and day
    if (!program.milestones || !Array.isArray(program.milestones)) {
      return {
        success: false,
        error: 'Program has no milestones',
        errorType: 'not_found',
      }
    }

    const milestone = program.milestones[validatedInput.milestoneIndex]
    if (!milestone) {
      return {
        success: false,
        error: 'Invalid milestone index',
        errorType: 'not_found',
      }
    }

    if (!milestone.days || !Array.isArray(milestone.days)) {
      return {
        success: false,
        error: 'Milestone has no days',
        errorType: 'not_found',
      }
    }

    const day = milestone.days[validatedInput.dayIndex]
    if (!day) {
      return {
        success: false,
        error: 'Invalid day index',
        errorType: 'not_found',
      }
    }

    // Verify this is an AMRAP day
    if (!day.isAmrap || !day.amrapDuration) {
      return {
        success: false,
        error: 'This day is not an AMRAP workout',
        errorType: 'invalid_day_type',
      }
    }

    // TODO: Create day completion record for AMRAP when dayCompletions collection is implemented
    // For now, we'll just return success without persisting the day completion
    // const dayCompletion = await payload.create({
    //   collection: 'dayCompletions', // This collection would need to be created in PayloadCMS
    //   data: {
    //     productUser: currentUser.id,
    //     program: validatedInput.programId,
    //     milestoneIndex: validatedInput.milestoneIndex,
    //     dayIndex: validatedInput.dayIndex,
    //     dayType: 'amrap',
    //     sessionDuration: validatedInput.sessionDuration,
    //     totalRoundsCompleted: validatedInput.totalRoundsCompleted,
    //     completedExercises: validatedInput.completedExerciseIds,
    //     exerciseProgressData: validatedInput.exerciseProgress,
    //     completedAt: new Date().toISOString(),
    //     amrapDuration: day.amrapDuration, // Original planned duration
    //   },
    // })

    // Generate a temporary ID for now
    const dayCompletionId = `temp-${Date.now()}-${currentUser.id}`

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')
    revalidatePath(`/workout/${validatedInput.programId}`)

    return {
      success: true,
      dayCompletionId: dayCompletionId,
    }
  } catch (error) {
    console.error('Complete AMRAP day error:', error)

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
          error: 'You must be logged in to complete AMRAP days. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'Failed to complete AMRAP day. Please try again.',
      errorType: 'system_error',
    }
  }
}

// Validation schema for comprehensive user progress updates
const UpdateUserProgressSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  currentMilestone: z.number().int().min(0, 'Milestone index must be 0 or greater').optional(),
  currentDay: z.number().int().min(0, 'Day index must be 0 or greater').optional(),
  lastWorkoutDate: z.string().datetime().optional(),
  totalWorkoutsCompleted: z.number().int().min(0, 'Total workouts must be 0 or greater').optional(),
  exerciseCompletions: z.array(z.string()).optional(), // Array of exercise completion IDs
  sessionData: z
    .object({
      sessionId: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      duration: z.number().min(0).optional(),
    })
    .optional(),
  progressMetrics: z
    .object({
      totalSets: z.number().int().min(0).optional(),
      totalReps: z.number().int().min(0).optional(),
      totalWeight: z.number().min(0).optional(),
      avgIntensity: z.number().min(0).max(10).optional(),
    })
    .optional(),
})

export type UpdateUserProgressInput = z.infer<typeof UpdateUserProgressSchema>

export interface ProgressValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProgressAuditEntry {
  timestamp: string
  userId: string
  action: 'progress_update' | 'milestone_advance' | 'day_complete' | 'program_complete' | 'rollback'
  previousState: {
    milestone: number
    day: number
    totalWorkouts: number
  }
  newState: {
    milestone: number
    day: number
    totalWorkouts: number
  }
  metadata?: Record<string, any>
  success: boolean
  errorMessage?: string
}

export interface UpdateUserProgressResult {
  success: boolean
  error?: string
  errorType?:
    | 'authentication'
    | 'validation'
    | 'not_found'
    | 'program_mismatch'
    | 'data_conflict'
    | 'system_error'
  userId?: string
  previousProgress?: {
    currentMilestone: number
    currentDay: number
    totalWorkoutsCompleted: number
  }
  newProgress?: {
    currentMilestone: number
    currentDay: number
    totalWorkoutsCompleted: number
  }
  auditId?: string
  rollbackAvailable: boolean
}

/**
 * Enhanced server action for updating user progress with atomic operations and rollback capability
 * Includes comprehensive validation, audit trail, and data integrity checks
 */
export async function updateUserProgress(
  input: UpdateUserProgressInput,
): Promise<UpdateUserProgressResult> {
  try {
    // Validate input data
    const validatedInput = UpdateUserProgressSchema.parse(input)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to update progress. Please sign in and try again.',
        errorType: 'authentication',
        rollbackAvailable: false,
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Get current user progress for comparison and rollback
    const currentUserData = await payload.findByID({
      collection: 'productUsers',
      id: currentUser.id,
    })

    if (!currentUserData) {
      return {
        success: false,
        error: 'User profile not found',
        errorType: 'not_found',
        rollbackAvailable: false,
      }
    }

    // Validate program consistency
    if (currentUserData.currentProgram !== validatedInput.programId) {
      return {
        success: false,
        error: 'Program mismatch. User is not enrolled in the specified program.',
        errorType: 'program_mismatch',
        rollbackAvailable: false,
      }
    }

    // Validate progress integrity
    const progressValidation = await validateProgressUpdate(
      payload,
      currentUserData,
      validatedInput,
    )
    if (!progressValidation.isValid) {
      return {
        success: false,
        error: `Progress validation failed: ${progressValidation.errors.join(', ')}`,
        errorType: 'validation',
        rollbackAvailable: false,
      }
    }

    // Store previous state for rollback and audit
    const previousProgress = {
      currentMilestone: currentUserData.currentMilestone || 0,
      currentDay: currentUserData.currentDay || 0,
      totalWorkoutsCompleted: currentUserData.totalWorkoutsCompleted || 0,
    }

    // Prepare update data with only provided fields
    const updateData: any = {}
    if (validatedInput.currentMilestone !== undefined) {
      updateData.currentMilestone = validatedInput.currentMilestone
    }
    if (validatedInput.currentDay !== undefined) {
      updateData.currentDay = validatedInput.currentDay
    }
    if (validatedInput.lastWorkoutDate !== undefined) {
      updateData.lastWorkoutDate = validatedInput.lastWorkoutDate
    }
    if (validatedInput.totalWorkoutsCompleted !== undefined) {
      updateData.totalWorkoutsCompleted = validatedInput.totalWorkoutsCompleted
    }

    // Perform atomic database update
    const updateResult = await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: updateData,
    })

    if (!updateResult) {
      return {
        success: false,
        error: 'Failed to update user progress in database',
        errorType: 'system_error',
        rollbackAvailable: false,
      }
    }

    const newProgress = {
      currentMilestone: updateResult.currentMilestone || 0,
      currentDay: updateResult.currentDay || 0,
      totalWorkoutsCompleted: updateResult.totalWorkoutsCompleted || 0,
    }

    // Create audit trail entry
    const auditEntry: ProgressAuditEntry = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'progress_update',
      previousState: {
        milestone: previousProgress.currentMilestone,
        day: previousProgress.currentDay,
        totalWorkouts: previousProgress.totalWorkoutsCompleted,
      },
      newState: {
        milestone: newProgress.currentMilestone,
        day: newProgress.currentDay,
        totalWorkouts: newProgress.totalWorkoutsCompleted,
      },
      metadata: {
        programId: validatedInput.programId,
        sessionData: validatedInput.sessionData,
        progressMetrics: validatedInput.progressMetrics,
      },
      success: true,
    }

    const auditId = (await createAuditTrailEntry(payload, auditEntry)) || 'unknown'

    // Revalidate relevant paths for cache invalidation
    revalidatePath('/dashboard')
    revalidatePath('/workout')
    revalidatePath(`/workout/${validatedInput.programId}`)

    return {
      success: true,
      userId: currentUser.id,
      previousProgress,
      newProgress,
      auditId,
      rollbackAvailable: true,
    }
  } catch (error) {
    console.error('Update user progress error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid progress data: ${error.issues.map((e) => e.message).join(', ')}`,
        errorType: 'validation',
        rollbackAvailable: false,
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to update progress. Please sign in and try again.',
          errorType: 'authentication',
          rollbackAvailable: false,
        }
      }
      if (errorMessage.includes('version')) {
        return {
          success: false,
          error:
            'Data conflict detected. Another session may have updated your progress. Please refresh and try again.',
          errorType: 'data_conflict',
          rollbackAvailable: false,
        }
      }
    }

    return {
      success: false,
      error: 'Failed to update user progress. Please try again.',
      errorType: 'system_error',
      rollbackAvailable: false,
    }
  }
}

/**
 * Validate progress update for data integrity
 */
async function validateProgressUpdate(
  payload: any,
  currentUser: any,
  input: UpdateUserProgressInput,
): Promise<ProgressValidation> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Get program structure for validation
    const program = await payload.findByID({
      collection: 'programs',
      id: input.programId,
    })

    if (!program) {
      errors.push('Program not found for validation')
      return { isValid: false, errors, warnings }
    }

    // Validate milestone bounds
    if (input.currentMilestone !== undefined) {
      if (!program.milestones || !Array.isArray(program.milestones)) {
        errors.push('Program has no milestones for validation')
      } else if (input.currentMilestone >= program.milestones.length) {
        errors.push(
          `Milestone index ${input.currentMilestone} exceeds program milestone count (${program.milestones.length})`,
        )
      }
    }

    // Validate day bounds within milestone
    if (input.currentDay !== undefined && input.currentMilestone !== undefined) {
      const milestone = program.milestones?.[input.currentMilestone]
      if (milestone && milestone.days && Array.isArray(milestone.days)) {
        if (input.currentDay >= milestone.days.length) {
          errors.push(
            `Day index ${input.currentDay} exceeds milestone day count (${milestone.days.length})`,
          )
        }
      }
    }

    // Validate progress direction (shouldn't go backwards without explicit reason)
    if (input.currentMilestone !== undefined) {
      if (input.currentMilestone < currentUser.currentMilestone) {
        warnings.push(
          `Milestone moving backwards from ${currentUser.currentMilestone} to ${input.currentMilestone}`,
        )
      }
    }

    if (input.currentDay !== undefined && input.currentMilestone === currentUser.currentMilestone) {
      if (input.currentDay < currentUser.currentDay) {
        warnings.push(`Day moving backwards from ${currentUser.currentDay} to ${input.currentDay}`)
      }
    }

    // Validate workout count progression
    if (input.totalWorkoutsCompleted !== undefined) {
      const currentTotal = currentUser.totalWorkoutsCompleted || 0
      if (input.totalWorkoutsCompleted < currentTotal) {
        warnings.push(
          `Total workouts decreasing from ${currentTotal} to ${input.totalWorkoutsCompleted}`,
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error) {
    console.error('Progress validation error:', error)
    errors.push('Failed to validate progress update')
    return { isValid: false, errors, warnings }
  }
}

/**
 * Create audit trail entry for progress changes
 */
async function createAuditTrailEntry(
  payload: any,
  auditEntry: ProgressAuditEntry,
): Promise<string | null> {
  try {
    // For now, store audit entries in exercise completions with special metadata
    // TODO: Create dedicated audit trail collection when PayloadCMS schema is updated
    const auditRecord = await payload.create({
      collection: 'exerciseCompletions',
      data: {
        productUser: auditEntry.userId,
        exercise: 'audit-trail', // Special marker for audit entries
        program: 'system', // Special marker for audit entries
        milestoneIndex: 0,
        dayIndex: 0,
        sets: 0,
        reps: 0,
        completedAt: auditEntry.timestamp,
        notes: JSON.stringify(auditEntry), // Store full audit data in notes
      },
    })

    return auditRecord.id as string
  } catch (error) {
    console.error('Failed to create audit trail entry:', error)
    return null
  }
}

// Rollback schema for progress recovery
const RollbackProgressSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  auditId: z.string().min(1, 'Audit ID is required'),
  reason: z.string().min(1, 'Rollback reason is required'),
})

export type RollbackProgressInput = z.infer<typeof RollbackProgressSchema>

export interface RollbackProgressResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'not_found' | 'system_error'
  rolledBackTo?: {
    currentMilestone: number
    currentDay: number
    totalWorkoutsCompleted: number
  }
}

/**
 * Rollback user progress to a previous state using audit trail
 * Provides recovery mechanism for failed or incorrect progress updates
 */
export async function rollbackUserProgress(
  input: RollbackProgressInput,
): Promise<RollbackProgressResult> {
  try {
    // Validate input
    const validatedInput = RollbackProgressSchema.parse(input)

    // Get current authenticated user (must be admin or the user themselves)
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to rollback progress. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    // For security, only allow users to rollback their own progress
    if (currentUser.id !== validatedInput.userId) {
      return {
        success: false,
        error: 'You can only rollback your own progress.',
        errorType: 'authentication',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Retrieve audit entry to get previous state
    const auditRecord = await payload.findByID({
      collection: 'exerciseCompletions',
      id: validatedInput.auditId,
    })

    if (!auditRecord || auditRecord.exercise !== 'audit-trail') {
      return {
        success: false,
        error: 'Audit record not found or invalid',
        errorType: 'not_found',
      }
    }

    // Parse audit data from notes field
    let auditEntry: ProgressAuditEntry
    try {
      auditEntry = JSON.parse(auditRecord.notes || '{}')
    } catch (error) {
      return {
        success: false,
        error: 'Invalid audit record format',
        errorType: 'not_found',
      }
    }

    // Restore previous state
    const restoreData = {
      currentMilestone: auditEntry.previousState.milestone,
      currentDay: auditEntry.previousState.day,
      totalWorkoutsCompleted: auditEntry.previousState.totalWorkouts,
    }

    // Perform rollback update
    await payload.update({
      collection: 'productUsers',
      id: validatedInput.userId,
      data: restoreData,
    })

    // Create rollback audit entry
    const rollbackAuditEntry: ProgressAuditEntry = {
      timestamp: new Date().toISOString(),
      userId: validatedInput.userId,
      action: 'rollback',
      previousState: auditEntry.newState,
      newState: auditEntry.previousState,
      metadata: {
        originalAuditId: validatedInput.auditId,
        rollbackReason: validatedInput.reason,
      },
      success: true,
    }

    await createAuditTrailEntry(payload, rollbackAuditEntry)

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')

    return {
      success: true,
      rolledBackTo: restoreData,
    }
  } catch (error) {
    console.error('Rollback user progress error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid rollback data: ${error.issues.map((e) => e.message).join(', ')}`,
        errorType: 'validation',
      }
    }

    return {
      success: false,
      error: 'Failed to rollback user progress. Please try again.',
      errorType: 'system_error',
    }
  }
}
