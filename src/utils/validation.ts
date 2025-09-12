// Validation utilities

import { z } from 'zod'
import type { Program, UserProgress } from '@/types/program'
import { validateProgressConsistency } from './progress'

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

// Enhanced exercise completion validation with comprehensive ranges and error messages
export const exerciseCompletionSchema = z.object({
  sets: z
    .number()
    .min(1, 'Sets must be at least 1')
    .max(99, 'Sets cannot exceed 99')
    .int('Sets must be a whole number'),
  reps: z
    .number()
    .min(1, 'Reps must be at least 1')
    .max(999, 'Reps cannot exceed 999')
    .int('Reps must be a whole number'),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .max(1000, 'Weight cannot exceed 1000 lbs')
    .optional(),
  time: z.number().min(0, 'Time cannot be negative').max(999, 'Time cannot exceed 999').optional(),
  distance: z
    .number()
    .min(0, 'Distance cannot be negative')
    .max(999, 'Distance cannot exceed 999')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

// Workout data entry validation (used by workout-data-entry component)
export const workoutDataEntrySchema = z.object({
  sets: z
    .number()
    .min(1, 'Sets must be at least 1')
    .max(99, 'Sets cannot exceed 99')
    .int('Sets must be a whole number'),
  reps: z
    .number()
    .min(1, 'Reps must be at least 1')
    .max(999, 'Reps cannot exceed 999')
    .int('Reps must be a whole number'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters'),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative')
    .max(1000, 'Weight cannot exceed 1000 lbs')
    .optional(),
  time: z.number().min(0, 'Time cannot be negative').max(999, 'Time cannot exceed 999').optional(),
  distance: z
    .number()
    .min(0, 'Distance cannot be negative')
    .max(999, 'Distance cannot exceed 999')
    .optional(),
  distanceUnit: z.enum(['meters', 'miles']).optional(),
  timeUnit: z.enum(['seconds', 'minutes', 'hours']).optional(),
})

// AMRAP data validation
export const amrapDataEntrySchema = z.object({
  totalRounds: z
    .number()
    .min(0, 'Total rounds cannot be negative')
    .max(99, 'Total rounds cannot exceed 99')
    .int('Total rounds must be a whole number'),
  partialRoundExercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1, 'Exercise ID is required'),
        reps: z
          .number()
          .min(0, 'Partial round reps cannot be negative')
          .max(999, 'Partial round reps cannot exceed 999')
          .int('Partial round reps must be a whole number'),
      }),
    )
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

// Individual field validation schemas for real-time validation
export const setsValidationSchema = z
  .number()
  .min(1, 'Sets must be at least 1')
  .max(99, 'Sets cannot exceed 99')
  .int('Sets must be a whole number')

export const repsValidationSchema = z
  .number()
  .min(1, 'Reps must be at least 1')
  .max(999, 'Reps cannot exceed 999')
  .int('Reps must be a whole number')

export const weightValidationSchema = z
  .number()
  .min(0, 'Weight cannot be negative')
  .max(1000, 'Weight cannot exceed 1000 lbs')

export const timeValidationSchema = z
  .number()
  .min(0, 'Time cannot be negative')
  .max(999, 'Time cannot exceed 999')

export const distanceValidationSchema = z
  .number()
  .min(0, 'Distance cannot be negative')
  .max(999, 'Distance cannot exceed 999')

export const roundsValidationSchema = z
  .number()
  .min(0, 'Total rounds cannot be negative')
  .max(99, 'Total rounds cannot exceed 99')
  .int('Total rounds must be a whole number')

export const notesValidationSchema = z.string().max(500, 'Notes cannot exceed 500 characters')

// Program assignment validation
export const programAssignmentSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  productUserId: z.string().min(1, 'Product User ID is required'),
})

export type ExerciseCompletionData = z.infer<typeof exerciseCompletionSchema>
export type WorkoutDataEntryData = z.infer<typeof workoutDataEntrySchema>
export type AmrapDataEntryData = z.infer<typeof amrapDataEntrySchema>
export type ProgramAssignmentData = z.infer<typeof programAssignmentSchema>

/**
 * Validation utility functions for real-time form validation
 */

// Validate individual fields and return user-friendly error messages
export function validateWorkoutField(
  field: keyof WorkoutDataEntryData,
  value: unknown,
): string | null {
  try {
    switch (field) {
      case 'sets':
        setsValidationSchema.parse(value)
        break
      case 'reps':
        repsValidationSchema.parse(value)
        break
      case 'weight':
        if (value !== undefined && value !== null && value !== '') {
          weightValidationSchema.parse(value)
        }
        break
      case 'time':
        if (value !== undefined && value !== null && value !== '') {
          timeValidationSchema.parse(value)
        }
        break
      case 'distance':
        if (value !== undefined && value !== null && value !== '') {
          distanceValidationSchema.parse(value)
        }
        break
      case 'notes':
        if (value !== undefined && value !== null) {
          notesValidationSchema.parse(value)
        }
        break
      case 'distanceUnit':
      case 'timeUnit':
        // Units are validated as part of the schema
        return null
    }
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid value'
    }
    return 'Invalid value'
  }
}

// Validate AMRAP field data
export function validateAmrapField(field: keyof AmrapDataEntryData, value: unknown): string | null {
  try {
    switch (field) {
      case 'totalRounds':
        roundsValidationSchema.parse(value)
        break
      case 'notes':
        if (value !== undefined && value !== null) {
          notesValidationSchema.parse(value)
        }
        break
      case 'partialRoundExercises':
        // Handled separately for complex array validation
        return null
    }
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid value'
    }
    return 'Invalid value'
  }
}

// Validate complete workout data entry form
export function validateWorkoutDataEntry(data: unknown): {
  isValid: boolean
  errors: Record<string, string>
} {
  const result = workoutDataEntrySchema.safeParse(data)

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  result.error.issues.forEach((error: any) => {
    const field = error.path[0]?.toString()
    if (field) {
      errors[field] = error.message
    }
  })

  return { isValid: false, errors }
}

// Validate complete AMRAP data entry form
export function validateAmrapDataEntry(data: unknown): {
  isValid: boolean
  errors: Record<string, string>
} {
  const result = amrapDataEntrySchema.safeParse(data)

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  result.error.issues.forEach((error: any) => {
    const field = error.path[0]?.toString()
    if (field) {
      errors[field] = error.message
    }
  })

  return { isValid: false, errors }
}

// Sanitize input values to prevent injection and ensure data consistency
export function sanitizeWorkoutInput(value: string | number): string | number | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return undefined

    // Convert to number if it's a numeric string
    const numeric = parseFloat(trimmed)
    if (!isNaN(numeric) && isFinite(numeric)) {
      return numeric
    }

    // Return sanitized string (remove potentially harmful characters)
    return trimmed.replace(/[<>\"'&]/g, '')
  }

  if (typeof value === 'number') {
    // Ensure number is finite and not NaN
    return isFinite(value) ? value : undefined
  }

  return undefined
}

/**
 * Enhanced error types for detailed progress validation
 */
export type ProgressValidationErrorType =
  | 'corrupted_progress'
  | 'program_structure_changed'
  | 'milestone_index_invalid'
  | 'day_index_invalid'
  | 'program_not_found'
  | 'program_unpublished'
  | 'progress_inconsistent'
  | 'milestone_missing'
  | 'day_missing'

export interface ProgressValidationError {
  type: ProgressValidationErrorType
  message: string
  context?: Record<string, unknown>
  userFriendlyMessage: string
  suggested_action: string
  can_auto_repair: boolean
}

/**
 * Enhanced progress validation result with detailed errors and repair suggestions
 */
export interface EnhancedProgressValidationResult {
  isValid: boolean
  errors: ProgressValidationError[]
  warnings: ProgressValidationError[]
  canBeRepaired: boolean
  repairActions: ProgressRepairAction[]
}

export interface ProgressRepairAction {
  type: 'reset_to_start' | 'adjust_to_valid_position' | 'assign_new_program'
  description: string
  newMilestone?: number
  newDay?: number
  programId?: string
}

/**
 * Comprehensive progress validation with detailed error reporting
 */
export function validateUserProgress(
  program: Program | null,
  userProgress: UserProgress,
  programId?: string,
): EnhancedProgressValidationResult {
  const errors: ProgressValidationError[] = []
  const warnings: ProgressValidationError[] = []
  const repairActions: ProgressRepairAction[] = []

  // Check if program exists
  if (!program) {
    errors.push({
      type: 'program_not_found',
      message: `Program with ID ${programId || 'unknown'} not found`,
      context: { programId },
      userFriendlyMessage: 'Your selected program is no longer available.',
      suggested_action: 'Please choose a new program from the available options.',
      can_auto_repair: false,
    })

    repairActions.push({
      type: 'assign_new_program',
      description: 'Select a new program from available options',
    })

    return {
      isValid: false,
      errors,
      warnings,
      canBeRepaired: true,
      repairActions,
    }
  }

  // Check program publication status
  if (!program.isPublished) {
    warnings.push({
      type: 'program_unpublished',
      message: 'User is assigned to unpublished program',
      context: { programId: program.id, programName: program.name },
      userFriendlyMessage: 'Your current program is temporarily unavailable.',
      suggested_action: 'Contact support or choose a different program.',
      can_auto_repair: false,
    })
  }

  // Validate program structure
  const structureValidation = validateProgramStructure(program)
  if (!structureValidation.isValid) {
    errors.push({
      type: 'program_structure_changed',
      message: `Program structure invalid: ${structureValidation.error}`,
      context: { programId: program.id, structureError: structureValidation.error },
      userFriendlyMessage: 'Your current program has been updated and may have structural changes.',
      suggested_action: 'Your progress may need to be reset. Contact support if you need help.',
      can_auto_repair: true,
    })

    repairActions.push({
      type: 'reset_to_start',
      description: 'Reset progress to beginning of program',
      newMilestone: 0,
      newDay: 0,
    })
  }

  // Use existing progress consistency validation
  const consistencyValidation = validateProgressConsistency(program, userProgress)

  // Convert consistency errors to enhanced format
  consistencyValidation.errors.forEach((error) => {
    let errorType: ProgressValidationErrorType = 'progress_inconsistent'
    const canAutoRepair = true
    let suggestedAction = 'Your progress will be automatically corrected.'

    if (error.includes('milestone index')) {
      errorType = 'milestone_index_invalid'
      if (error.includes('negative')) {
        suggestedAction = 'Your progress will be reset to the beginning.'
      } else if (error.includes('exceeds')) {
        suggestedAction = 'Your progress appears to be corrupted and will be corrected.'
      }
    } else if (error.includes('day index')) {
      errorType = 'day_index_invalid'
      if (error.includes('negative')) {
        suggestedAction = 'Your progress will be reset to the beginning.'
      } else if (error.includes('exceeds')) {
        suggestedAction = 'Your progress appears to be corrupted and will be corrected.'
      }
    }

    errors.push({
      type: errorType,
      message: error,
      context: {
        currentMilestone: userProgress.currentMilestone,
        currentDay: userProgress.currentDay,
        totalMilestones: program.milestones?.length || 0,
      },
      userFriendlyMessage: "There's an issue with your current progress position.",
      suggested_action: suggestedAction,
      can_auto_repair: canAutoRepair,
    })
  })

  // Convert consistency warnings to enhanced format
  consistencyValidation.warnings.forEach((warning) => {
    let warningType: ProgressValidationErrorType = 'progress_inconsistent'

    if (warning.includes('no days defined')) {
      warningType = 'milestone_missing'
    } else if (warning.includes('unpublished')) {
      warningType = 'program_unpublished'
    }

    warnings.push({
      type: warningType,
      message: warning,
      context: {
        currentMilestone: userProgress.currentMilestone,
        programId: program.id,
      },
      userFriendlyMessage: 'There may be an issue with your program structure.',
      suggested_action: 'Continue normally, but contact support if you encounter problems.',
      can_auto_repair: false,
    })
  })

  // Generate repair actions for fixable errors
  const hasCorruptedProgress = errors.some((e) =>
    ['corrupted_progress', 'milestone_index_invalid', 'day_index_invalid'].includes(e.type),
  )

  if (hasCorruptedProgress) {
    // Try to find a valid position to repair to
    const validPosition = findValidProgressPosition(program, userProgress)
    if (validPosition) {
      repairActions.push({
        type: 'adjust_to_valid_position',
        description: 'Adjust progress to nearest valid position',
        newMilestone: validPosition.milestone,
        newDay: validPosition.day,
      })
    } else {
      repairActions.push({
        type: 'reset_to_start',
        description: 'Reset progress to beginning of program',
        newMilestone: 0,
        newDay: 0,
      })
    }
  }

  const canBeRepaired = repairActions.length > 0

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canBeRepaired,
    repairActions,
  }
}

/**
 * Validate program structure (similar to existing function but enhanced)
 */
function validateProgramStructure(program: Program): { isValid: boolean; error?: string } {
  if (!program.milestones || !Array.isArray(program.milestones)) {
    return { isValid: false, error: 'Program structure is invalid - missing milestones.' }
  }

  if (program.milestones.length === 0) {
    return { isValid: false, error: 'Program must have at least one milestone.' }
  }

  for (let i = 0; i < program.milestones.length; i++) {
    const milestone = program.milestones[i]

    if (!milestone || !milestone.days || !Array.isArray(milestone.days)) {
      return {
        isValid: false,
        error: `Milestone ${i + 1} is missing days structure.`,
      }
    }

    if (milestone.days.length === 0) {
      return {
        isValid: false,
        error: `Milestone ${i + 1} must have at least one day.`,
      }
    }

    for (let j = 0; j < milestone.days.length; j++) {
      const day = milestone.days[j]

      if (!day || !day.dayType || !['workout', 'rest'].includes(day.dayType)) {
        return {
          isValid: false,
          error: `Day ${j + 1} in milestone ${i + 1} has invalid day type.`,
        }
      }

      if (
        day.dayType === 'workout' &&
        !day.isAmrap &&
        (!day.exercises || day.exercises.length === 0)
      ) {
        return {
          isValid: false,
          error: `Workout day ${j + 1} in milestone ${i + 1} must have at least one exercise.`,
        }
      }
    }
  }

  return { isValid: true }
}

/**
 * Find the nearest valid progress position for repair
 */
function findValidProgressPosition(
  program: Program,
  userProgress: UserProgress,
): { milestone: number; day: number } | null {
  const milestones = program.milestones || []

  // If current milestone is valid, try to find valid day within it
  if (userProgress.currentMilestone >= 0 && userProgress.currentMilestone < milestones.length) {
    const milestone = milestones[userProgress.currentMilestone]
    const maxDay = (milestone?.days?.length || 1) - 1

    if (userProgress.currentDay >= 0 && userProgress.currentDay <= maxDay) {
      // Current position is valid
      return { milestone: userProgress.currentMilestone, day: userProgress.currentDay }
    } else if (maxDay >= 0) {
      // Adjust to last day of current milestone
      return { milestone: userProgress.currentMilestone, day: maxDay }
    }
  }

  // If current milestone is beyond program, set to last day of last milestone
  if (userProgress.currentMilestone >= milestones.length && milestones.length > 0) {
    const lastMilestone = milestones[milestones.length - 1]
    const lastDay = Math.max(0, (lastMilestone?.days?.length || 1) - 1)
    return { milestone: milestones.length - 1, day: lastDay }
  }

  // If all else fails, return beginning
  return { milestone: 0, day: 0 }
}

/**
 * Check if a specific progress position is valid
 */
export function isValidProgressPosition(program: Program, milestone: number, day: number): boolean {
  if (!program.milestones || milestone < 0 || milestone >= program.milestones.length) {
    return false
  }

  const milestoneData = program.milestones[milestone]
  if (!milestoneData?.days) {
    return false
  }

  return day >= 0 && day < milestoneData.days.length
}

/**
 * Generate user-friendly error messages for specific scenarios
 */
export function getProgressErrorMessage(errors: ProgressValidationError[]): string {
  if (errors.length === 0) return ''

  // Prioritize the most critical errors
  const criticalError = errors.find((e) =>
    ['program_not_found', 'program_structure_changed', 'corrupted_progress'].includes(e.type),
  )

  if (criticalError) {
    return criticalError.userFriendlyMessage
  }

  // Return first error if no critical ones
  return errors[0]?.userFriendlyMessage || ''
}

/**
 * Generate repair instructions for users
 */
export function getRepairInstructions(repairActions: ProgressRepairAction[]): string {
  if (repairActions.length === 0) return ''

  const primaryAction = repairActions[0]
  if (!primaryAction) return ''

  switch (primaryAction.type) {
    case 'reset_to_start':
      return 'Your progress will be reset to the beginning of your program.'
    case 'adjust_to_valid_position':
      return 'Your progress will be adjusted to the nearest valid position.'
    case 'assign_new_program':
      return 'Please select a new program to continue your fitness journey.'
    default:
      return 'Your progress will be automatically corrected.'
  }
}
