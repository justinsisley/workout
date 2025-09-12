'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { z } from 'zod'
import { getCurrentProductUser } from '@/lib/auth-server'
import type {
  ExerciseCompletion,
  PreviousExerciseData,
  SmartDefaults,
  GetPreviousExerciseDataResult,
} from '@/types/program'

// Validation schemas
const ExerciseIdSchema = z.string().min(1, 'Exercise ID is required')

/**
 * Calculate smart defaults based on historical performance data
 */
function calculateSmartDefaults(completions: ExerciseCompletion[]): SmartDefaults | undefined {
  if (completions.length === 0) {
    return undefined
  }

  // Sort completions by most recent first
  const sortedCompletions = completions.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )

  const recentCompletions = sortedCompletions.slice(0, 5) // Use last 5 sessions for smart defaults

  // Calculate averages and progression
  const totalSets = recentCompletions.reduce((sum, c) => sum + c.sets, 0)
  const totalReps = recentCompletions.reduce((sum, c) => sum + c.reps, 0)
  const avgSets = Math.round(totalSets / recentCompletions.length)
  const avgReps = Math.round(totalReps / recentCompletions.length)

  // Weight progression logic (if applicable)
  let suggestedWeight: number | undefined = undefined
  const weightEntries = recentCompletions.filter((c) => c.weight && c.weight > 0)
  if (weightEntries.length > 0) {
    const lastWeight = weightEntries[0]?.weight
    if (lastWeight) {
      const avgWeight =
        weightEntries.reduce((sum, c) => sum + (c.weight || 0), 0) / weightEntries.length

      // Suggest slight progression if recent performance is consistent
      if (weightEntries.length >= 3) {
        // Progressive overload: suggest 2.5-5% increase if last 3 sessions were consistent
        const last3Weights = weightEntries
          .slice(0, 3)
          .map((c) => c.weight!)
          .filter((w) => w !== undefined)
        const isConsistent =
          Math.max(...last3Weights) - Math.min(...last3Weights) <= avgWeight * 0.1

        if (isConsistent) {
          suggestedWeight = Math.round((lastWeight + avgWeight * 0.025) * 2) / 2 // Round to nearest 2.5lbs
        } else {
          suggestedWeight = lastWeight
        }
      } else {
        suggestedWeight = lastWeight
      }
    }
  }

  // Time suggestions (if applicable)
  let suggestedTime: number | undefined = undefined
  const timeEntries = recentCompletions.filter((c) => c.time && c.time > 0)
  if (timeEntries.length > 0) {
    suggestedTime = Math.round(
      timeEntries.reduce((sum, c) => sum + (c.time || 0), 0) / timeEntries.length,
    )
  }

  // Distance suggestions (if applicable)
  let suggestedDistance: number | undefined = undefined
  let suggestedDistanceUnit: 'meters' | 'miles' | undefined = undefined
  const distanceEntries = recentCompletions.filter((c) => c.distance && c.distance > 0)
  if (distanceEntries.length > 0) {
    suggestedDistance =
      Math.round(
        (distanceEntries.reduce((sum, c) => sum + (c.distance || 0), 0) / distanceEntries.length) *
          100,
      ) / 100 // Round to 2 decimal places
    suggestedDistanceUnit = distanceEntries[0]?.distanceUnit || 'meters'
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low'
  if (recentCompletions.length >= 5) {
    confidence = 'high'
  } else if (recentCompletions.length >= 3) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    suggestedSets: avgSets,
    suggestedReps: avgReps,
    suggestedWeight,
    suggestedTime,
    suggestedDistance,
    suggestedDistanceUnit,
    confidence,
    basedOnSessions: recentCompletions.length,
  }
}

/**
 * Get previous exercise data for auto-population and smart defaults
 */
export async function getPreviousExerciseData(
  exerciseId: string,
): Promise<GetPreviousExerciseDataResult> {
  try {
    const validatedExerciseId = ExerciseIdSchema.parse(exerciseId)

    // Get current authenticated user
    const currentUser = await getCurrentProductUser()
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to access exercise data. Please sign in and try again.',
      }
    }

    const payload = await getPayload({ config: configPromise })

    // Query exerciseCompletions collection for user's previous data on same exercise
    const completionResults = await payload.find({
      collection: 'exerciseCompletions',
      where: {
        and: [
          {
            productUser: { equals: currentUser.id },
          },
          {
            exercise: { equals: validatedExerciseId },
          },
        ],
      },
      sort: '-completedAt', // Most recent first
      limit: 10, // Get last 10 completions for analysis
    })

    // Convert PayloadCMS docs to our type structure
    const completions: ExerciseCompletion[] = []
    for (const doc of completionResults.docs) {
      const completion: ExerciseCompletion = {
        id: doc.id as string,
        productUser: doc.productUser as string,
        exercise: doc.exercise as string,
        program: doc.program as string,
        milestoneIndex: doc.milestoneIndex as number,
        dayIndex: doc.dayIndex as number,
        sets: doc.sets as number,
        reps: doc.reps as number,
        completedAt: new Date(doc.completedAt as string),
        createdAt: new Date(doc.createdAt as string),
        updatedAt: new Date(doc.updatedAt as string),
      }

      // Handle optional fields properly for exactOptionalPropertyTypes
      if (doc.weight != null) {
        completion.weight = doc.weight as number
      }
      if (doc.time != null) {
        completion.time = doc.time as number
      }
      if (doc.notes != null) {
        completion.notes = doc.notes as string
      }
      if ((doc as any).distance != null) {
        completion.distance = (doc as any).distance as number
      }
      if ((doc as any).distanceUnit != null) {
        completion.distanceUnit = (doc as any).distanceUnit as 'meters' | 'miles'
      }

      completions.push(completion)
    }

    // If no previous data exists, return success with no data (fallback defaults will be handled in component)
    if (completions.length === 0) {
      return {
        success: true,
      }
    }

    // Get most recent completion for immediate auto-population
    const mostRecentCompletion = completions[0]
    if (!mostRecentCompletion) {
      return {
        success: true,
      }
    }

    const previousData: PreviousExerciseData = {
      sets: mostRecentCompletion.sets,
      reps: mostRecentCompletion.reps,
      weight: mostRecentCompletion.weight,
      time: mostRecentCompletion.time,
      distance: mostRecentCompletion.distance,
      distanceUnit: mostRecentCompletion.distanceUnit,
      lastCompletedAt: mostRecentCompletion.completedAt,
    }

    // Calculate smart defaults based on historical performance
    const smartDefaults = calculateSmartDefaults(completions)

    return {
      success: true,
      previousData,
      smartDefaults,
    }
  } catch (error) {
    console.error('Get previous exercise data error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid exercise ID provided',
      }
    }

    // Handle specific PayloadCMS errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'You must be logged in to access exercise data. Please sign in and try again.',
        }
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve previous exercise data. Please try again.',
    }
  }
}
