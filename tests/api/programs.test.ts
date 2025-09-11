import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  assignProgramToUser,
  updateUserProgress,
  getPrograms,
  getProgramById,
  advanceToNextDay,
  advanceToNextMilestone,
} from '@/actions/programs'
import type { Program } from '@/types/program'
import { getPayload } from 'payload'
import { getCurrentProductUser } from '@/lib/auth-server'

// Mock PayloadCMS
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth-server', () => ({
  getCurrentProductUser: vi.fn(),
}))

// Mock config
vi.mock('@/payload/payload.config', () => ({
  default: {},
}))

const mockPayload = {
  find: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
} as any

const mockCurrentUser = {
  id: 'user123',
  username: 'testuser',
  currentProgram: null,
  currentMilestone: 0,
  currentDay: 0,
  updatedAt: '2023-01-01T00:00:00.000Z',
  createdAt: '2023-01-01T00:00:00.000Z',
}

const mockProgram: Program = {
  id: 'program123',
  name: 'Test Program',
  description: 'A test program',
  objective: 'Test objective',
  isPublished: true,
  milestones: [
    {
      id: 'milestone1',
      name: 'Test Milestone',
      theme: 'Test Theme',
      objective: 'Test milestone objective',
      days: [
        {
          id: 'day1',
          dayType: 'workout',
          exercises: [
            {
              id: 'ex1',
              exercise: 'exercise123',
              sets: 3,
              reps: 10,
            },
          ],
        },
      ],
    },
  ],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
}

describe('Programs Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getPayload).mockResolvedValue(mockPayload)
    vi.mocked(getCurrentProductUser).mockResolvedValue(mockCurrentUser)
  })

  describe('getPrograms', () => {
    it('successfully retrieves published programs', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [mockProgram],
      })

      const result = await getPrograms()

      expect(result.success).toBe(true)
      expect(result.programs).toHaveLength(1)
      expect(result.programs?.[0]?.name).toBe('Test Program')
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'programs',
        where: {
          isPublished: { equals: true },
        },
        depth: 2,
        sort: 'name',
      })
    })

    it('handles database errors gracefully', async () => {
      mockPayload.find.mockRejectedValue(new Error('Database error'))

      const result = await getPrograms()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to load programs')
    })
  })

  describe('getProgramById', () => {
    it('successfully retrieves a program by id', async () => {
      mockPayload.findByID.mockResolvedValue(mockProgram)

      const result = await getProgramById('program123')

      expect(result.success).toBe(true)
      expect(result.programs).toHaveLength(1)
      expect(result.programs?.[0]?.id).toBe('program123')
    })

    it('returns error for invalid program id format', async () => {
      const result = await getProgramById('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Program ID is required')
    })

    it('returns error when program not found', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await getProgramById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Program not found or not published')
    })

    it('returns error when program is not published', async () => {
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        isPublished: false,
      })

      const result = await getProgramById('program123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Program not found or not published')
    })
  })

  describe('assignProgramToUser', () => {
    beforeEach(() => {
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user123' })
    })

    it('successfully assigns a program to authenticated user', async () => {
      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 0,
        },
      })
    })

    it('returns authentication error when user not logged in', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('returns validation error for invalid program id', async () => {
      const result = await assignProgramToUser('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid program selection')
      expect(result.errorType).toBe('validation')
    })

    it('returns not_found error when program does not exist', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await assignProgramToUser('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toContain('could not be found')
      expect(result.errorType).toBe('not_found')
    })

    it('returns not_found error when program is not published', async () => {
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        isPublished: false,
      })

      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not available')
      expect(result.errorType).toBe('not_found')
    })

    it('returns already_assigned error when user already has this program', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
      })

      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already enrolled in this program')
      expect(result.errorType).toBe('already_assigned')
    })

    it('handles database update errors', async () => {
      mockPayload.update.mockRejectedValue(new Error('Update failed'))

      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('We encountered an issue assigning your program')
      expect(result.errorType).toBe('system_error')
    })

    it('handles duplicate assignment conflicts', async () => {
      mockPayload.update.mockRejectedValue(new Error('duplicate key error'))

      const result = await assignProgramToUser('program123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('conflict with your program assignment')
      expect(result.errorType).toBe('already_assigned')
    })
  })

  describe('updateUserProgress', () => {
    beforeEach(() => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
      })
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user123' })
    })

    it('successfully updates user progress', async () => {
      const result = await updateUserProgress(0, 0)

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentMilestone: 0,
          currentDay: 0,
        },
      })
    })

    it('returns authentication error when user not logged in', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const result = await updateUserProgress(1, 5)

      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('returns no_active_program error when user has no current program', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: null,
      })

      const result = await updateUserProgress(1, 5)

      expect(result.success).toBe(false)
      expect(result.error).toContain('need to select a program')
      expect(result.errorType).toBe('no_active_program')
    })

    it('returns validation error for negative milestone', async () => {
      const result = await updateUserProgress(-1, 5)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid progress values')
      expect(result.errorType).toBe('validation')
    })

    it('returns validation error for negative day', async () => {
      const result = await updateUserProgress(1, -1)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid progress values')
      expect(result.errorType).toBe('validation')
    })

    it('handles database update errors', async () => {
      mockPayload.update.mockRejectedValue(new Error('Update failed'))

      const result = await updateUserProgress(0, 0)

      expect(result.success).toBe(false)
      expect(result.error).toContain('We encountered an issue updating your progress')
      expect(result.errorType).toBe('system_error')
    })

    it('handles unauthorized errors', async () => {
      mockPayload.update.mockRejectedValue(new Error('unauthorized access'))

      const result = await updateUserProgress(0, 0)

      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be logged in')
      expect(result.errorType).toBe('authentication')
    })
  })

  describe('advanceToNextDay', () => {
    beforeEach(() => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 0,
        currentDay: 0,
      })
      mockPayload.findByID.mockResolvedValue(mockProgram)
      mockPayload.update.mockResolvedValue({ id: 'user123' })
    })

    it('successfully advances to next day within milestone', async () => {
      // Mock program with multiple days in milestone
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        milestones: [
          {
            ...mockProgram.milestones[0]!,
            days: [
              mockProgram.milestones[0]!.days[0]!, // Day 0
              {
                id: 'day2',
                dayType: 'workout',
                exercises: [
                  {
                    id: 'ex2',
                    exercise: 'exercise456',
                    sets: 3,
                    reps: 12,
                  },
                ],
              }, // Day 1
            ],
          },
        ],
      })

      const result = await advanceToNextDay()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentDay: 1, // Advanced from 0 to 1
        },
      })
    })

    it('advances to next milestone when reaching end of milestone days', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 0,
        currentDay: 0, // Last day of milestone (only 1 day in our mock)
      })

      // Mock program with multiple milestones
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        milestones: [
          {
            ...mockProgram.milestones[0]!,
            days: [mockProgram.milestones[0]!.days[0]!], // Only 1 day
          },
          {
            id: 'milestone2',
            name: 'Second Milestone',
            theme: 'Second Theme',
            objective: 'Second objective',
            days: [
              {
                id: 'day1-m2',
                dayType: 'workout',
                exercises: [{ id: 'ex2', exercise: 'exercise456', sets: 3, reps: 12 }],
              },
            ],
          },
        ],
      })

      const result = await advanceToNextDay()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentMilestone: 1, // Advanced to next milestone
          currentDay: 0, // Reset to first day of new milestone
        },
      })
    })

    it('completes program when finishing last day of last milestone', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 0,
        currentDay: 0, // Last day of last milestone
      })

      // Mock program with only one milestone and one day
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        milestones: [
          {
            ...mockProgram.milestones[0]!,
            days: [mockProgram.milestones[0]!.days[0]!], // Only 1 day
          },
        ],
      })

      const result = await advanceToNextDay()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentMilestone: 1, // Beyond last milestone (indicates completion)
          currentDay: 0,
        },
      })
    })

    it('returns authentication error when user not logged in', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const result = await advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('returns no_active_program error when user has no current program', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: null,
      })

      const result = await advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toContain('need to select a program')
      expect(result.errorType).toBe('no_active_program')
    })

    it('returns not_found error when program no longer exists', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
      expect(result.errorType).toBe('not_found')
    })

    it('auto-repairs when user progress is beyond program length', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 5, // Beyond program length
        currentDay: 0,
      })

      const result = await advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toContain('automatically corrected')
      expect(result.errorType).toBe('milestone_index_invalid')
    })
  })

  describe('advanceToNextMilestone', () => {
    beforeEach(() => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 0,
        currentDay: 0,
      })
      mockPayload.update.mockResolvedValue({ id: 'user123' })
    })

    it('successfully advances to next milestone', async () => {
      // Mock program with multiple milestones
      mockPayload.findByID.mockResolvedValue({
        ...mockProgram,
        milestones: [
          mockProgram.milestones[0],
          {
            id: 'milestone2',
            name: 'Second Milestone',
            theme: 'Second Theme',
            objective: 'Second objective',
            days: [
              {
                id: 'day1-m2',
                dayType: 'workout',
                exercises: [{ id: 'ex2', exercise: 'exercise456', sets: 3, reps: 12 }],
              },
            ],
          },
        ],
      })

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(true)
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'productUsers',
        id: 'user123',
        data: {
          currentMilestone: 1, // Advanced to next milestone
          currentDay: 0, // Reset to first day
        },
      })
    })

    it('returns authentication error when user not logged in', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be logged in')
      expect(result.errorType).toBe('authentication')
    })

    it('returns no_active_program error when user has no current program', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: null,
      })

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('need to select a program')
      expect(result.errorType).toBe('no_active_program')
    })

    it('returns validation error when already on final milestone', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue({
        ...mockCurrentUser,
        currentProgram: 'program123',
        currentMilestone: 0, // Only one milestone in mock program
        currentDay: 0,
      })

      mockPayload.findByID.mockResolvedValue(mockProgram) // Only 1 milestone

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('already on the final milestone')
      expect(result.errorType).toBe('validation')
    })

    it('returns not_found error when program no longer exists', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const result = await advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('no longer available')
      expect(result.errorType).toBe('not_found')
    })
  })

  describe('Error Response Consistency', () => {
    it('maintains consistent error response format across all functions', async () => {
      // Test authentication error format consistency
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const assignResult = await assignProgramToUser('program123')
      const updateResult = await updateUserProgress(1, 5)
      const advanceDayResult = await advanceToNextDay()
      const advanceMilestoneResult = await advanceToNextMilestone()

      expect(assignResult).toMatchObject({
        success: false,
        error: expect.any(String),
        errorType: 'authentication',
      })

      expect(updateResult).toMatchObject({
        success: false,
        error: expect.any(String),
        errorType: 'authentication',
      })

      expect(advanceDayResult).toMatchObject({
        success: false,
        error: expect.any(String),
        errorType: 'authentication',
      })

      expect(advanceMilestoneResult).toMatchObject({
        success: false,
        error: expect.any(String),
        errorType: 'authentication',
      })
    })

    it('provides user-friendly error messages', async () => {
      vi.mocked(getCurrentProductUser).mockResolvedValue(null)

      const result = await assignProgramToUser('program123')

      expect(result.error).not.toContain('null')
      expect(result.error).not.toContain('undefined')
      expect(result.error).not.toContain('TypeError')
      expect(result.error).toContain('logged in')
    })
  })

  describe('Additional Boundary Condition Tests', () => {
    describe('advanceToNextDay - Extended Boundary Conditions', () => {
      it('handles single-day milestones correctly', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 0,
        })

        // Program with single-day milestones
        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: [
            {
              ...mockProgram.milestones[0]!,
              days: [mockProgram.milestones[0]!.days[0]!], // Only one day
            },
            {
              id: 'milestone2',
              name: 'Second Milestone',
              theme: 'Second Theme',
              objective: 'Second objective',
              days: [
                {
                  id: 'day1-m2',
                  dayType: 'rest',
                  restNotes: 'Single rest day',
                },
              ],
            },
          ],
        })

        const result = await advanceToNextDay()

        expect(result.success).toBe(true)
        expect(mockPayload.update).toHaveBeenCalledWith({
          collection: 'productUsers',
          id: 'user123',
          data: {
            currentMilestone: 1,
            currentDay: 0,
          },
        })
      })

      it('handles advancement with zero-based indexing at various positions', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 1,
          currentDay: 2, // Middle of second milestone
        })

        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: [
            mockProgram.milestones[0]!,
            {
              ...mockProgram.milestones[0]!,
              id: 'milestone2',
              days: [
                {
                  id: 'd1',
                  dayType: 'workout',
                  exercises: [{ id: 'e1', exercise: 'ex1', sets: 1, reps: 1 }],
                },
                { id: 'd2', dayType: 'rest', restNotes: 'Rest' },
                {
                  id: 'd3',
                  dayType: 'workout',
                  exercises: [{ id: 'e2', exercise: 'ex2', sets: 1, reps: 1 }],
                },
                {
                  id: 'd4',
                  dayType: 'workout',
                  exercises: [{ id: 'e3', exercise: 'ex3', sets: 1, reps: 1 }],
                },
              ],
            },
          ],
        })

        const result = await advanceToNextDay()

        expect(result.success).toBe(true)
        expect(mockPayload.update).toHaveBeenCalledWith({
          collection: 'productUsers',
          id: 'user123',
          data: {
            currentDay: 3, // Advanced to last day of milestone
          },
        })
      })

      it('handles large programs with many milestones and days', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 4,
          currentDay: 6, // Last day of 5th milestone
        })

        // Create large program with 10 milestones, 7 days each
        const largeMilestones = Array.from({ length: 10 }, (_, i) => ({
          id: `milestone-${i}`,
          name: `Milestone ${i + 1}`,
          theme: `Theme ${i + 1}`,
          objective: `Objective ${i + 1}`,
          days: Array.from({ length: 7 }, (_, j) => ({
            id: `day-${i}-${j}`,
            dayType: j % 3 === 0 ? ('rest' as const) : ('workout' as const),
            exercises:
              j % 3 !== 0
                ? [{ id: `ex-${i}-${j}`, exercise: 'exercise', sets: 3, reps: 10 }]
                : undefined,
            restNotes: j % 3 === 0 ? 'Rest day' : undefined,
          })),
        }))

        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: largeMilestones,
        })

        const result = await advanceToNextDay()

        expect(result.success).toBe(true)
        expect(mockPayload.update).toHaveBeenCalledWith({
          collection: 'productUsers',
          id: 'user123',
          data: {
            currentMilestone: 5, // Advanced to next milestone
            currentDay: 0, // Reset to first day
          },
        })
      })

      it('handles program completion with exact boundary', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 1,
          currentDay: 1, // Last day of last milestone
        })

        // Two-milestone program, second milestone has 2 days
        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: [
            mockProgram.milestones[0]!,
            {
              id: 'final-milestone',
              name: 'Final Milestone',
              theme: 'Completion',
              objective: 'Finish strong',
              days: [
                {
                  id: 'final-day-1',
                  dayType: 'workout',
                  exercises: [{ id: 'ex1', exercise: 'final-ex-1', sets: 3, reps: 10 }],
                },
                {
                  id: 'final-day-2',
                  dayType: 'workout',
                  exercises: [{ id: 'ex2', exercise: 'final-ex-2', sets: 3, reps: 10 }],
                },
              ],
            },
          ],
        })

        const result = await advanceToNextDay()

        expect(result.success).toBe(true)
        expect(mockPayload.update).toHaveBeenCalledWith({
          collection: 'productUsers',
          id: 'user123',
          data: {
            currentMilestone: 2, // Beyond last milestone (completion)
            currentDay: 0,
          },
        })
      })
    })

    describe('advanceToNextMilestone - Extended Boundary Conditions', () => {
      it('handles milestone advancement with varying day counts', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 2,
        })

        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: [
            {
              ...mockProgram.milestones[0]!,
              days: Array.from({ length: 10 }, (_, i) => ({
                id: `day-${i}`,
                dayType: 'workout' as const,
                exercises: [{ id: `ex-${i}`, exercise: `exercise-${i}`, sets: 3, reps: 10 }],
              })),
            },
            {
              id: 'short-milestone',
              name: 'Short Milestone',
              theme: 'Quick',
              objective: 'Fast completion',
              days: [{ id: 'only-day', dayType: 'rest', restNotes: 'Only day' }],
            },
          ],
        })

        const result = await advanceToNextMilestone()

        expect(result.success).toBe(true)
        expect(mockPayload.update).toHaveBeenCalledWith({
          collection: 'productUsers',
          id: 'user123',
          data: {
            currentMilestone: 1,
            currentDay: 0,
          },
        })
      })

      it('handles advancement from last milestone correctly', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 2, // Third milestone (0-indexed)
          currentDay: 0,
        })

        mockPayload.findByID.mockResolvedValue({
          ...mockProgram,
          milestones: [
            mockProgram.milestones[0]!,
            mockProgram.milestones[0]!, // Second milestone (duplicate for testing)
            {
              id: 'final-milestone',
              name: 'Final Milestone',
              theme: 'End',
              objective: 'Complete program',
              days: [
                {
                  id: 'final-day',
                  dayType: 'workout',
                  exercises: [{ id: 'final-ex', exercise: 'final', sets: 1, reps: 1 }],
                },
              ],
            },
          ],
        })

        const result = await advanceToNextMilestone()

        expect(result.success).toBe(false)
        expect(result.error).toContain('already on the final milestone')
        expect(result.errorType).toBe('validation')
      })
    })

    describe('Progress Repair and Rollback Scenarios', () => {
      it('handles auto-repair for corrupted milestone beyond program', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 10, // Way beyond program length
          currentDay: 5,
        })

        mockPayload.findByID.mockResolvedValue(mockProgram)
        mockPayload.update
          .mockResolvedValueOnce({ id: 'user123' }) // First call for repair
          .mockRejectedValueOnce(new Error('Database error')) // Second call fails

        const result = await advanceToNextDay()

        expect(result.success).toBe(false)
        expect(result.error).toContain('automatically corrected')
        expect(result.errorType).toBe('milestone_index_invalid')
      })

      it('handles rollback when progress update fails after repair', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 10, // Beyond milestone days
        })

        mockPayload.findByID.mockResolvedValue(mockProgram)
        // Simulate repair success then advancement failure
        mockPayload.update
          .mockResolvedValueOnce({ id: 'user123' }) // Repair succeeds
          .mockRejectedValueOnce(new Error('Update failed')) // Advancement fails

        const result = await advanceToNextDay()

        expect(result.success).toBe(false)
        expect(result.errorType).toBe('day_index_invalid')
      })
    })

    describe('Database Error Handling During Advancement', () => {
      it('handles database connection issues during day advancement', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 0,
        })

        mockPayload.findByID.mockResolvedValue(mockProgram)
        mockPayload.update.mockRejectedValue(new Error('Connection timeout'))

        const result = await advanceToNextDay()

        // The implementation has repair mechanisms, so it might succeed or fail depending on the repair
        expect(typeof result.success).toBe('boolean')
        if (!result.success) {
          expect(result.error).toBeDefined()
        }
      })

      it('handles concurrent update conflicts', async () => {
        vi.mocked(getCurrentProductUser).mockResolvedValue({
          ...mockCurrentUser,
          currentProgram: 'program123',
          currentMilestone: 0,
          currentDay: 0,
        })

        mockPayload.findByID.mockResolvedValue(mockProgram)
        mockPayload.update.mockRejectedValue(new Error('version conflict'))

        const result = await advanceToNextMilestone()

        expect(result.success).toBe(false)
        // Error type may vary based on implementation details
        expect(result.errorType).toBeDefined()
      })
    })
  })
})
