'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentProductUser } from '@/lib/auth-server'
import type {
  Program,
  GetProgramsResult,
  AssignProgramResult,
  UpdateProgressResult,
} from '@/types/program'

// Validation schemas
const ProgramIdSchema = z.string().min(1, 'Program ID is required')
const ProgressUpdateSchema = z.object({
  currentMilestone: z.number().int().min(0, 'Milestone index must be 0 or greater'),
  currentDay: z.number().int().min(0, 'Day index must be 0 or greater'),
})

/**
 * Get all published programs for program selection
 */
export async function getPrograms(): Promise<GetProgramsResult> {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'programs',
      where: {
        isPublished: { equals: true },
      },
      depth: 2, // Populate milestones and exercises
      sort: 'name',
    })

    return {
      success: true,
      programs: result.docs as Program[],
    }
  } catch (error) {
    console.error('Get programs error:', error)
    return {
      success: false,
      error: 'Failed to load programs',
    }
  }
}

/**
 * Get program by ID with full details
 */
export async function getProgramById(programId: string): Promise<GetProgramsResult> {
  try {
    const validatedProgramId = ProgramIdSchema.parse(programId)
    const payload = await getPayload({ config: configPromise })

    const program = await payload.findByID({
      collection: 'programs',
      id: validatedProgramId,
      depth: 2,
    })

    if (!program || !program.isPublished) {
      return {
        success: false,
        error: 'Program not found or not published',
      }
    }

    return {
      success: true,
      programs: [program as Program],
    }
  } catch (error) {
    console.error('Get program by ID error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid program ID' }
    }

    return {
      success: false,
      error: 'Failed to load program',
    }
  }
}

/**
 * Validate program structure for assignment compatibility
 */
async function validateProgramStructure(
  program: Program,
): Promise<{ isValid: boolean; error?: string }> {
  // Check basic structure
  if (!program.milestones || !Array.isArray(program.milestones)) {
    return { isValid: false, error: 'Program structure is invalid - missing milestones.' }
  }

  // Ensure program has at least one milestone
  if (program.milestones.length === 0) {
    return { isValid: false, error: 'Program must have at least one milestone.' }
  }

  // Validate each milestone has proper structure and at least one day
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

    // Validate day structure
    for (let j = 0; j < milestone.days.length; j++) {
      const day = milestone.days[j]

      if (!day || !day.dayType || !['workout', 'rest'].includes(day.dayType)) {
        return {
          isValid: false,
          error: `Day ${j + 1} in milestone ${i + 1} has invalid day type.`,
        }
      }

      // Workout days should have exercises (unless it's AMRAP with duration only)
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
 * Assign program to authenticated user
 */
export async function assignProgramToUser(programId: string): Promise<AssignProgramResult> {
  try {
    const validatedProgramId = ProgramIdSchema.parse(programId)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to select a program. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Verify program exists, is published, and get full structure for validation
    const program = await payload.findByID({
      collection: 'programs',
      id: validatedProgramId,
      depth: 2, // Need full structure for validation
    })

    if (!program) {
      return {
        success: false,
        error: 'The selected program could not be found. Please choose a different program.',
        errorType: 'not_found',
      }
    }

    // Validate program is published (publishedStatus check)
    if (!program.isPublished) {
      return {
        success: false,
        error:
          'The selected program is not available for enrollment. Please choose a different program.',
        errorType: 'not_found',
      }
    }

    // Comprehensive program structure validation
    const structureValidation = await validateProgramStructure(program as Program)
    if (!structureValidation.isValid) {
      return {
        success: false,
        error: `Program structure validation failed: ${structureValidation.error}`,
        errorType: 'validation',
      }
    }

    // Check if user already has this program assigned (edge case handling)
    if (currentUser.currentProgram === validatedProgramId) {
      return {
        success: false,
        error: 'You are already enrolled in this program. Continue with your current workouts!',
        errorType: 'already_assigned',
      }
    }

    // Update product user with new program assignment and initialize progress tracking
    // Using proper 0-based indexing for milestone and day tracking
    await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: {
        currentProgram: validatedProgramId,
        currentMilestone: 0, // 0-based milestone index (first milestone)
        currentDay: 0, // 0-based day index (first day of first milestone)
      },
    })

    // Revalidate relevant paths
    revalidatePath('/programs')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Assign program to user error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid program selection. Please try again with a different program.',
        errorType: 'validation',
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('duplicate')) {
        return {
          success: false,
          error: 'There was a conflict with your program assignment. Please refresh and try again.',
          errorType: 'already_assigned',
        }
      }
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to select a program. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'We encountered an issue assigning your program. Please try again in a moment.',
      errorType: 'system_error',
    }
  }
}

/**
 * Advance user to the next day in their current program
 */
export async function advanceToNextDay(): Promise<UpdateProgressResult> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to advance your progress. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    if (!currentUser.currentProgram) {
      return {
        success: false,
        error:
          'You need to select a program before advancing progress. Please choose a program first.',
        errorType: 'no_active_program',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Get current program with full structure
    const program = await payload.findByID({
      collection: 'programs',
      id: currentUser.currentProgram as string,
      depth: 2,
    })

    if (!program || !program.isPublished) {
      return {
        success: false,
        error: 'Your current program is no longer available. Please select a new program.',
        errorType: 'not_found',
      }
    }

    const typedProgram = program as Program
    const currentMilestone = currentUser.currentMilestone ?? 0
    const currentDay = currentUser.currentDay ?? 0

    // Validate current milestone exists
    if (currentMilestone >= typedProgram.milestones.length) {
      return {
        success: false,
        error: 'Program completed! You have finished all milestones.',
        errorType: 'validation',
      }
    }

    const milestone = typedProgram.milestones[currentMilestone]
    if (!milestone) {
      return {
        success: false,
        error: 'Invalid milestone data. Please restart your program.',
        errorType: 'validation',
      }
    }

    const nextDay = currentDay + 1

    // Check if we need to advance to next milestone
    if (nextDay >= milestone.days.length) {
      // This was the last day of the milestone, advance to next milestone
      const nextMilestone = currentMilestone + 1

      if (nextMilestone >= typedProgram.milestones.length) {
        // Program completed!
        await payload.update({
          collection: 'productUsers',
          id: currentUser.id,
          data: {
            currentMilestone: nextMilestone,
            currentDay: 0,
            // Could add programCompletedDate: new Date() here if we had that field
          },
        })

        revalidatePath('/dashboard')
        revalidatePath('/workout')

        return {
          success: true,
          // Could return completion status here
        }
      } else {
        // Advance to first day of next milestone
        await payload.update({
          collection: 'productUsers',
          id: currentUser.id,
          data: {
            currentMilestone: nextMilestone,
            currentDay: 0,
          },
        })
      }
    } else {
      // Advance to next day in current milestone
      await payload.update({
        collection: 'productUsers',
        id: currentUser.id,
        data: {
          currentDay: nextDay,
        },
      })
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')

    return { success: true }
  } catch (error) {
    console.error('Advance to next day error:', error)

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to advance your progress. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'We encountered an issue advancing your progress. Please try again in a moment.',
      errorType: 'system_error',
    }
  }
}

/**
 * Advance user to the next milestone in their current program
 */
export async function advanceToNextMilestone(): Promise<UpdateProgressResult> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to advance your progress. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    if (!currentUser.currentProgram) {
      return {
        success: false,
        error:
          'You need to select a program before advancing progress. Please choose a program first.',
        errorType: 'no_active_program',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Get current program with full structure
    const program = await payload.findByID({
      collection: 'programs',
      id: currentUser.currentProgram as string,
      depth: 2,
    })

    if (!program || !program.isPublished) {
      return {
        success: false,
        error: 'Your current program is no longer available. Please select a new program.',
        errorType: 'not_found',
      }
    }

    const typedProgram = program as Program
    const currentMilestone = currentUser.currentMilestone ?? 0
    const nextMilestone = currentMilestone + 1

    // Check if next milestone exists
    if (nextMilestone >= typedProgram.milestones.length) {
      return {
        success: false,
        error: 'You are already on the final milestone of your program.',
        errorType: 'validation',
      }
    }

    // Advance to first day of next milestone
    await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: {
        currentMilestone: nextMilestone,
        currentDay: 0, // Start at first day of new milestone
      },
    })

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')

    return { success: true }
  } catch (error) {
    console.error('Advance to next milestone error:', error)

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to advance your progress. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'We encountered an issue advancing your progress. Please try again in a moment.',
      errorType: 'system_error',
    }
  }
}

/**
 * Update user progress tracking for current program
 */
export async function updateUserProgress(
  currentMilestone: number,
  currentDay: number,
): Promise<UpdateProgressResult> {
  try {
    const validatedProgress = ProgressUpdateSchema.parse({ currentMilestone, currentDay })

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to update your progress. Please sign in and try again.',
        errorType: 'authentication',
      }
    }

    if (!currentUser.currentProgram) {
      return {
        success: false,
        error:
          'You need to select a program before tracking progress. Please choose a program first.',
        errorType: 'no_active_program',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Update user progress
    await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: {
        currentMilestone: validatedProgress.currentMilestone,
        currentDay: validatedProgress.currentDay,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/workout')

    return { success: true }
  } catch (error) {
    console.error('Update user progress error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid progress values. Please check your milestone and day numbers.',
        errorType: 'validation',
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to update your progress. Please sign in and try again.',
          errorType: 'authentication',
        }
      }
    }

    return {
      success: false,
      error: 'We encountered an issue updating your progress. Please try again in a moment.',
      errorType: 'system_error',
    }
  }
}
