import { describe, it, expect, vi, beforeEach } from 'vitest'
import { advanceToNextMilestone, completeProgramAndReset } from '@/actions/programs'
import type { Program } from '@/types/program'
import type { ProductUser } from '@/payload/payload-types'

// Mock dependencies
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@/payload/payload.config', () => ({
  default: {},
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  getCurrentProductUser: vi.fn(),
}))

vi.mock('@/utils/validation', () => ({
  validateUserProgress: vi.fn(),
  getProgressErrorMessage: vi.fn(),
  getRepairInstructions: vi.fn(),
  isValidProgressPosition: vi.fn(),
}))

const { getPayload } = await import('payload')
const { getCurrentProductUser } = await import('@/lib/auth-server')
const { validateUserProgress } = await import('@/utils/validation')

const mockPayload = {
  findByID: vi.fn(),
  update: vi.fn(),
}

const mockUser: ProductUser = {
  id: 'user-1',
  username: 'testuser',
  currentProgram: 'program-1',
  currentMilestone: 2, // Last milestone (0-indexed)
  currentDay: 0,
  totalWorkoutsCompleted: 15,
  updatedAt: '2023-01-01T00:00:00Z',
  createdAt: '2023-01-01T00:00:00Z',
}

const mockProgram: Program = {
  id: 'program-1',
  name: 'Test Program',
  description: 'Test program description',
  objective: 'Build strength and endurance',
  isPublished: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  milestones: [
    {
      id: 'milestone-1',
      name: 'Foundation',
      theme: 'Foundation Phase',
      objective: 'Build basic fitness foundation',
      days: [
        { id: 'day-1', dayType: 'workout' as const, exercises: [] },
        { id: 'day-2', dayType: 'rest' as const, restNotes: 'Complete rest day' },
      ],
    },
    {
      id: 'milestone-2',
      name: 'Intermediate',
      theme: 'Intermediate Phase',
      objective: 'Build intermediate strength',
      days: [{ id: 'day-3', dayType: 'workout' as const, exercises: [] }],
    },
  ],
}

describe('Program Completion Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getPayload as any).mockResolvedValue(mockPayload)
    ;(getCurrentProductUser as any).mockResolvedValue(mockUser)
    ;(validateUserProgress as any).mockReturnValue({ isValid: true, errors: [] })
  })

  describe('advanceToNextMilestone', () => {
    it('successfully advances to next milestone when current milestone is not last', async () => {
      const userOnFirstMilestone = {
        ...mockUser,
        currentMilestone: 0,
        currentDay: 1, // Last day of first milestone
      }
      ;(getCurrentProductUser as any).mockResolvedValue(userOnFirstMilestone)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user-1' })

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user-1',
        data: {
          currentMilestone: 1,
          currentDay: 0,
        },
      })
    })

    it('prevents advancement when already on final milestone', async () => {
      const userOnFinalMilestone = {
        ...mockUser,
        currentMilestone: 1, // Last milestone (0-indexed)
      }
      ;(getCurrentProductUser as any).mockResolvedValue(userOnFinalMilestone)
      mockPayload.findByID.mockResolvedValue(mockProgram)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toBe('You are already on the final milestone of your program.')
      expect(result.errorType).toBe('validation')
    })

    it('handles user not authenticated', async () => {
      ;(getCurrentProductUser as any).mockResolvedValue(null)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('handles user without active program', async () => {
      const userWithoutProgram = { ...mockUser, currentProgram: null }
      ;(getCurrentProductUser as any).mockResolvedValue(userWithoutProgram)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('select a program')
      expect(result.errorType).toBe('no_active_program')
    })

    it('handles program not found', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
      expect(result.errorType).toBe('not_found')
    })

    it('handles unpublished program', async () => {
      const unpublishedProgram = { ...mockProgram, isPublished: false }
      mockPayload.findByID.mockResolvedValue(unpublishedProgram)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
      expect(result.errorType).toBe('not_found')
    })

    it('handles database update failure with rollback', async () => {
      const userOnFirstMilestone = {
        ...mockUser,
        currentMilestone: 0,
        currentDay: 1,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(userOnFirstMilestone)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockRejectedValueOnce(new Error('Database error'))

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('previous progress has been restored')
      expect(result.errorType).toBe('system_error')
    })

    it('handles progress validation errors with repair', async () => {
      const invalidUser = {
        ...mockUser,
        currentMilestone: 0,
        currentDay: 5, // Invalid day index
      }
      ;(getCurrentProductUser as any).mockResolvedValue(invalidUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)

      const validationErrors = [
        {
          type: 'day_index_invalid',
          message: 'Day index is invalid',
          can_auto_repair: true,
        },
      ]
      ;(validateUserProgress as any).mockReturnValue({
        isValid: false,
        errors: validationErrors,
      })

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('day_index_invalid')
    })
  })

  describe('completeProgramAndReset', () => {
    it('successfully completes program when all milestones are finished', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2, // Beyond last milestone (program complete)
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user-1' })

      const result = await completeProgramAndReset()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user-1',
        data: expect.objectContaining({
          currentProgram: null,
          currentMilestone: 0,
          currentDay: 0,
          totalWorkoutsCompleted: 16, // Incremented
        }),
      })
    })

    it('prevents completion when program is not actually complete', async () => {
      const incompleteUser = {
        ...mockUser,
        currentMilestone: 1, // Still on last milestone
      }
      ;(getCurrentProductUser as any).mockResolvedValue(incompleteUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)

      const result = await completeProgramAndReset()

      expect(result.success).toBe(false)
      expect(result.error).toContain('not yet complete')
      expect(result.errorType).toBe('validation')
      expect(mockPayload.update).not.toHaveBeenCalled()
    })

    it('handles user not authenticated', async () => {
      ;(getCurrentProductUser as any).mockResolvedValue(null)

      const result = await completeProgramAndReset()

      expect(result.success).toBe(false)
      expect(result.error).toContain('must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('handles user without active program', async () => {
      const userWithoutProgram = { ...mockUser, currentProgram: null }
      ;(getCurrentProductUser as any).mockResolvedValue(userWithoutProgram)

      const result = await completeProgramAndReset()

      expect(result.success).toBe(false)
      expect(result.error).toContain('active program')
      expect(result.errorType).toBe('no_active_program')
    })

    it('handles program not found', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(null)

      const result = await completeProgramAndReset()

      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
      expect(result.errorType).toBe('not_found')
    })

    it('handles database update failure', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockRejectedValue(new Error('Database error'))

      const result = await completeProgramAndReset()

      expect(result.success).toBe(false)
      expect(result.error).toContain('encountered an issue')
      expect(result.errorType).toBe('system_error')
    })

    it('increments workout completion count correctly', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2,
        totalWorkoutsCompleted: 10,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user-1' })

      await completeProgramAndReset()

      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user-1',
        data: expect.objectContaining({
          totalWorkoutsCompleted: 11, // 10 + 1
        }),
      })
    })

    it('handles missing totalWorkoutsCompleted field', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2,
        totalWorkoutsCompleted: undefined,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user-1' })

      await completeProgramAndReset()

      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user-1',
        data: expect.objectContaining({
          totalWorkoutsCompleted: 1, // 0 + 1
        }),
      })
    })

    it('sets lastWorkoutDate to current date', async () => {
      const completedUser = {
        ...mockUser,
        currentMilestone: 2,
      }
      ;(getCurrentProductUser as any).mockResolvedValue(completedUser)
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user-1' })

      const beforeTime = new Date().toISOString()
      await completeProgramAndReset()
      const afterTime = new Date().toISOString()

      const updateCall = mockPayload.update.mock.calls[0]?.[0]
      const lastWorkoutDate = updateCall?.data.lastWorkoutDate

      expect(updateCall).toBeDefined()

      expect(lastWorkoutDate).toBeTypeOf('string')
      expect(lastWorkoutDate >= beforeTime).toBe(true)
      expect(lastWorkoutDate <= afterTime).toBe(true)
    })
  })
})
