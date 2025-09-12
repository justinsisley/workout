import { describe, it, expect, vi, beforeEach } from 'vitest'
import { completeExerciseAndAdvance } from '@/actions/workouts'
import type { CompleteExerciseAndAdvanceInput } from '@/actions/workouts'

// Mock PayloadCMS and dependencies
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@/payload/payload.config', () => ({
  default: {},
}))

vi.mock('@/lib/auth-server', () => ({
  getCurrentProductUser: vi.fn(),
}))

vi.mock('@/actions/workouts', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    saveExerciseCompletion: vi.fn(),
  }
})

const mockCurrentUser = { id: 'user-123' }
const mockProgram = {
  id: 'program-123',
  milestones: [
    {
      id: 'milestone-1',
      days: [
        {
          id: 'day-1',
          dayType: 'workout',
          isAmrap: false,
          exercises: [
            { id: 'exercise-1', exercise: 'ex-1', sets: 3, reps: 10 },
            { id: 'exercise-2', exercise: 'ex-2', sets: 3, reps: 12 },
            { id: 'exercise-3', exercise: 'ex-3', sets: 3, reps: 8 },
          ],
        },
        {
          id: 'day-2',
          dayType: 'workout',
          isAmrap: true,
          amrapDuration: 1200, // 20 minutes
          exercises: [
            { id: 'exercise-4', exercise: 'ex-4', sets: 1, reps: 5 },
            { id: 'exercise-5', exercise: 'ex-5', sets: 1, reps: 10 },
          ],
        },
      ],
    },
  ],
}

describe('completeExerciseAndAdvance', async () => {
  const { getPayload } = await import('payload')
  const { getCurrentProductUser } = await import('@/lib/auth-server')
  const { saveExerciseCompletion } = await import('@/actions/workouts')

  const mockGetPayload = getPayload as ReturnType<typeof vi.fn>
  const mockGetCurrentUser = getCurrentProductUser as ReturnType<typeof vi.fn>
  const mockSaveCompletion = saveExerciseCompletion as ReturnType<typeof vi.fn>

  const mockPayloadInstance = {
    findByID: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayload.mockResolvedValue(mockPayloadInstance)
    mockGetCurrentUser.mockResolvedValue(mockCurrentUser)
    mockSaveCompletion.mockResolvedValue({ success: true, exerciseCompletionId: 'completion-123' })
    mockPayloadInstance.findByID.mockResolvedValue(mockProgram)
  })

  describe('Regular Workout Progression', () => {
    it('should advance to next exercise in regular workout', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-1',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        weight: 135,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(true)
      expect(result.advancement?.exerciseCompleted).toBe(true)
      expect(result.advancement?.nextExerciseIndex).toBe(1)
      expect(result.advancement?.roundCompleted).toBe(false)
      expect(result.advancement?.dayCompleted).toBe(false)
      expect(result.advancement?.amrapTimeExpired).toBe(false)
    })

    it('should complete day when last exercise is finished in regular workout', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-3',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 0,
        currentExerciseIndex: 2, // Last exercise (index 2 of 3 exercises)
        sets: 3,
        reps: 8,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(true)
      expect(result.advancement?.exerciseCompleted).toBe(true)
      expect(result.advancement?.nextExerciseIndex).toBe(null) // No next exercise
      expect(result.advancement?.roundCompleted).toBe(false)
      expect(result.advancement?.dayCompleted).toBe(true)
      expect(result.advancement?.amrapTimeExpired).toBe(false)
    })
  })

  describe('AMRAP Workout Progression', () => {
    it('should advance to next exercise in AMRAP round', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-4',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 1, // AMRAP day
        currentExerciseIndex: 0,
        sets: 1,
        reps: 5,
        isAmrapDay: true,
        amrapTimeRemaining: 600, // 10 minutes left
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(true)
      expect(result.advancement?.exerciseCompleted).toBe(true)
      expect(result.advancement?.nextExerciseIndex).toBe(1)
      expect(result.advancement?.roundCompleted).toBe(false)
      expect(result.advancement?.dayCompleted).toBe(false)
      expect(result.advancement?.amrapTimeExpired).toBe(false)
    })

    it('should complete round and restart at first exercise in AMRAP', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-5',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 1, // AMRAP day
        currentExerciseIndex: 1, // Last exercise in round
        sets: 1,
        reps: 10,
        isAmrapDay: true,
        amrapTimeRemaining: 400, // Time still remaining
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(true)
      expect(result.advancement?.exerciseCompleted).toBe(true)
      expect(result.advancement?.nextExerciseIndex).toBe(0) // Restart at first exercise
      expect(result.advancement?.roundCompleted).toBe(true)
      expect(result.advancement?.dayCompleted).toBe(false)
      expect(result.advancement?.amrapTimeExpired).toBe(false)
    })

    it('should complete day when AMRAP time expires', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-4',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 1, // AMRAP day
        currentExerciseIndex: 0,
        sets: 1,
        reps: 5,
        isAmrapDay: true,
        amrapTimeRemaining: 0, // Time expired
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(true)
      expect(result.advancement?.exerciseCompleted).toBe(true)
      expect(result.advancement?.nextExerciseIndex).toBe(null)
      expect(result.advancement?.roundCompleted).toBe(false)
      expect(result.advancement?.dayCompleted).toBe(true)
      expect(result.advancement?.amrapTimeExpired).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should return authentication error when user not logged in', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null)

      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-1',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('authentication')
      expect(result.error).toContain('logged in')
    })

    it('should return validation error for invalid input', async () => {
      const input = {
        exerciseId: '', // Invalid - empty string
        programId: 'program-123',
        milestoneIndex: -1, // Invalid - negative
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        isAmrapDay: false,
      } as CompleteExerciseAndAdvanceInput

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('validation')
    })

    it('should return not_found error when program does not exist', async () => {
      mockPayloadInstance.findByID.mockResolvedValueOnce(null)

      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-1',
        programId: 'nonexistent-program',
        milestoneIndex: 0,
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('not_found')
      expect(result.error).toContain('Program not found')
    })

    it('should return program_mismatch error for invalid milestone index', async () => {
      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-1',
        programId: 'program-123',
        milestoneIndex: 999, // Invalid index
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('program_mismatch')
      expect(result.error).toContain('Invalid milestone index')
    })

    it('should handle exercise completion failure gracefully', async () => {
      mockSaveCompletion.mockResolvedValueOnce({ success: false, error: 'Database error' })

      const input: CompleteExerciseAndAdvanceInput = {
        exerciseId: 'exercise-1',
        programId: 'program-123',
        milestoneIndex: 0,
        dayIndex: 0,
        currentExerciseIndex: 0,
        sets: 3,
        reps: 10,
        isAmrapDay: false,
      }

      const result = await completeExerciseAndAdvance(input)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('system_error')
      expect(result.error).toContain('Database error')
    })
  })
})
