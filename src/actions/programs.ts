'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentProductUser } from '@/lib/auth'
import type { Program, GetProgramsResult, AssignProgramResult } from '@/types/program'

// Validation schemas
const ProgramIdSchema = z.string().min(1, 'Program ID is required')

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
        error: 'Authentication required',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Verify program exists and is published
    const program = await payload.findByID({
      collection: 'programs',
      id: validatedProgramId,
      depth: 0, // Just need basic info
    })

    if (!program || !program.isPublished) {
      return {
        success: false,
        error: 'Program not found or not available',
      }
    }

    // Update product user with new program assignment
    await payload.update({
      collection: 'productUsers',
      id: currentUser.id,
      data: {
        currentProgram: validatedProgramId,
        currentMilestone: null, // Will be properly indexed in Task 4
        currentDay: 1, // Reset to first day (1-based as per schema)
      },
    })

    // Revalidate relevant paths
    revalidatePath('/programs')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Assign program to user error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }

    return {
      success: false,
      error: 'Failed to assign program',
    }
  }
}
