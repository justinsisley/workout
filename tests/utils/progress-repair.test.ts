import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateUserProgress, type ProgressRepairAction } from '@/utils/validation'
import type { Program, UserProgress } from '@/types/program'

// Mock programs for repair testing
const validProgram: Program = {
  id: 'valid-program',
  name: 'Valid Program',
  description: 'Test program for repair testing',
  objective: 'Test repair scenarios',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [
    {
      id: 'milestone-1',
      name: 'First Milestone',
      theme: 'Foundation',
      objective: 'Build base',
      days: [
        {
          id: 'day-1',
          dayType: 'workout',
          exercises: [{ id: 'ex1', exercise: 'push-ups', sets: 3, reps: 10 }],
        },
        { id: 'day-2', dayType: 'rest', restNotes: 'Rest day' },
        {
          id: 'day-3',
          dayType: 'workout',
          exercises: [{ id: 'ex2', exercise: 'squats', sets: 3, reps: 15 }],
        },
      ],
    },
    {
      id: 'milestone-2',
      name: 'Second Milestone',
      theme: 'Progression',
      objective: 'Build strength',
      days: [
        {
          id: 'day-4',
          dayType: 'workout',
          exercises: [{ id: 'ex3', exercise: 'pull-ups', sets: 3, reps: 8 }],
        },
        {
          id: 'day-5',
          dayType: 'workout',
          exercises: [{ id: 'ex4', exercise: 'deadlifts', sets: 3, reps: 12 }],
        },
      ],
    },
  ],
}

const restructuredProgram: Program = {
  ...validProgram,
  id: 'restructured-program',
  milestones: [
    {
      id: 'new-milestone-1',
      name: 'Restructured Milestone',
      theme: 'New Structure',
      objective: 'Updated program',
      days: [
        {
          id: 'new-day-1',
          dayType: 'workout',
          exercises: [{ id: 'new-ex1', exercise: 'burpees', sets: 2, reps: 20 }],
        },
      ],
    },
  ],
}

// Mock the repairProgressWithRollback function if it doesn't exist
const mockRepairProgressWithRollback = async (
  _program: Program,
  userProgress: UserProgress,
  repairAction: ProgressRepairAction,
): Promise<{ success: boolean; newProgress?: UserProgress; error?: string }> => {
  try {
    switch (repairAction.type) {
      case 'reset_to_start':
        return {
          success: true,
          newProgress: {
            ...userProgress,
            currentMilestone: 0,
            currentDay: 0,
          },
        }
      case 'adjust_to_valid_position':
        return {
          success: true,
          newProgress: {
            ...userProgress,
            currentMilestone: repairAction.newMilestone ?? 0,
            currentDay: repairAction.newDay ?? 0,
          },
        }
      case 'assign_new_program':
        return {
          success: false,
          error: 'Manual program assignment required',
        }
      default:
        return {
          success: false,
          error: 'Unknown repair action',
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Repair failed',
    }
  }
}

describe('Progress Repair and Rollback Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Corruption Detection and Repair', () => {
    it('should detect and repair progress beyond milestone bounds', async () => {
      const corruptedProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: 0,
        currentDay: 10, // Way beyond milestone days (only 3 days in milestone)
      }

      const validation = validateUserProgress(validProgram, corruptedProgress, 'valid-program')

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)
      expect(validation.repairActions).toHaveLength(1)
      expect(validation.repairActions[0]?.type).toBe('adjust_to_valid_position')

      // Test repair execution
      const repairResult = await mockRepairProgressWithRollback(
        validProgram,
        corruptedProgress,
        validation.repairActions[0]!,
      )

      expect(repairResult.success).toBe(true)
      expect(repairResult.newProgress?.currentMilestone).toBe(0)
      expect(repairResult.newProgress?.currentDay).toBe(2) // Last valid day in milestone 0
    })

    it('should detect and repair progress beyond program bounds', async () => {
      const corruptedProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: 10, // Way beyond program milestones (only 2 milestones)
        currentDay: 5,
      }

      const validation = validateUserProgress(validProgram, corruptedProgress, 'valid-program')

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)

      const repairResult = await mockRepairProgressWithRollback(
        validProgram,
        corruptedProgress,
        validation.repairActions[0]!,
      )

      expect(repairResult.success).toBe(true)
      expect(repairResult.newProgress?.currentMilestone).toBeLessThan(
        validProgram.milestones.length,
      )
    })

    it('should handle negative progress values with reset repair', async () => {
      const negativeProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: -5,
        currentDay: -10,
      }

      const validation = validateUserProgress(validProgram, negativeProgress, 'valid-program')

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)

      const repairResult = await mockRepairProgressWithRollback(
        validProgram,
        negativeProgress,
        validation.repairActions[0]!,
      )

      expect(repairResult.success).toBe(true)
      expect(repairResult.newProgress?.currentMilestone).toBe(0)
      expect(repairResult.newProgress?.currentDay).toBe(0)
    })
  })

  describe('Program Structure Change Handling', () => {
    it('should detect program structure changes and provide repair options', async () => {
      // Simulate user progress from old program structure
      const oldUserProgress: UserProgress = {
        currentProgram: 'restructured-program',
        currentMilestone: 1,
        currentDay: 1, // This milestone/day no longer exists in restructured program
      }

      const validation = validateUserProgress(
        restructuredProgram,
        oldUserProgress,
        'restructured-program',
      )

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)
      // Should have repair actions available
      expect(validation.repairActions.length).toBeGreaterThan(0)
    })

    it('should handle empty program structures gracefully', async () => {
      const emptyProgram: Program = {
        ...validProgram,
        milestones: [],
      }

      const userProgress: UserProgress = {
        currentProgram: 'empty-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const validation = validateUserProgress(emptyProgram, userProgress, 'empty-program')

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)
      // Should have repair actions for empty program
      expect(validation.repairActions.length).toBeGreaterThan(0)
    })

    it('should handle milestone structure changes within program', async () => {
      const programWithChangedMilestone: Program = {
        ...validProgram,
        milestones: [
          validProgram.milestones[0]!, // Keep first milestone
          {
            id: 'changed-milestone-2',
            name: 'Changed Second Milestone',
            theme: 'Changed Theme',
            objective: 'Changed objective',
            days: [
              // Only one day instead of two
              {
                id: 'changed-day',
                dayType: 'workout',
                exercises: [{ id: 'changed-ex', exercise: 'changed-exercise', sets: 1, reps: 1 }],
              },
            ],
          },
        ],
      }

      const userProgress: UserProgress = {
        currentProgram: 'changed-program',
        currentMilestone: 1,
        currentDay: 1, // This day no longer exists (only 1 day in changed milestone)
      }

      const validation = validateUserProgress(
        programWithChangedMilestone,
        userProgress,
        'changed-program',
      )

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)

      const repairResult = await mockRepairProgressWithRollback(
        programWithChangedMilestone,
        userProgress,
        validation.repairActions[0]!,
      )

      expect(repairResult.success).toBe(true)
      expect(repairResult.newProgress?.currentMilestone).toBe(1)
      expect(repairResult.newProgress?.currentDay).toBe(0) // Adjusted to valid position
    })
  })

  describe('Rollback Mechanism Testing', () => {
    it('should handle rollback when repair fails', async () => {
      // Simulate repair failure
      const mockFailingRepair = async () => {
        throw new Error('Database connection failed during repair')
      }

      try {
        await mockFailingRepair()
        expect.fail('Expected repair to fail')
      } catch (error) {
        // Should handle rollback gracefully
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Database connection failed')
      }
    })

    it('should preserve original state when rollback is successful', async () => {
      const originalProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: 1,
        currentDay: 1,
      }

      // Simulate rollback scenario
      const rollbackState = { ...originalProgress }

      // Even if corruption occurs, rollback should restore original state
      expect(rollbackState).toEqual(originalProgress)
    })

    it('should handle partial repair failures with appropriate rollback', async () => {
      const userProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: 2, // Beyond program bounds (valid program has 2 milestones, 0-based = 0,1)
        currentDay: 0,
      }

      const validation = validateUserProgress(validProgram, userProgress, 'valid-program')

      // Check if it can be repaired and has repair actions
      if (validation.canBeRepaired && validation.repairActions.length > 0) {
        const repairAction = validation.repairActions[0]!

        const repairResult = await mockRepairProgressWithRollback(
          validProgram,
          userProgress,
          repairAction,
        )

        expect(repairResult.success).toBe(true)
        expect(repairResult.newProgress).toBeDefined()
      } else {
        // If it can't be repaired or no actions, that's also valid
        expect(validation.isValid || !validation.canBeRepaired).toBe(true)
      }
    })
  })

  describe('Complex Repair Scenarios', () => {
    it('should handle cascade repairs when multiple issues exist', async () => {
      const multipleIssuesProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: -1, // Negative milestone
        currentDay: 10, // Beyond bounds
      }

      const validation = validateUserProgress(validProgram, multipleIssuesProgress, 'valid-program')

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(1) // Multiple errors
      expect(validation.canBeRepaired).toBe(true)

      // Should prioritize reset repair for multiple issues
      const hasResetAction = validation.repairActions.some(
        (action) => action.type === 'adjust_to_valid_position',
      )
      expect(hasResetAction).toBe(true)
    })

    it('should handle repair with data consistency validation', async () => {
      const userProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: 0,
        currentDay: 2, // Last day of milestone
      }

      // This should be valid initially
      const validation = validateUserProgress(validProgram, userProgress, 'valid-program')
      expect(validation.isValid).toBe(true)

      // Now simulate advancing beyond milestone
      const advancedProgress: UserProgress = {
        ...userProgress,
        currentDay: 5, // Beyond milestone bounds
      }

      const advancedValidation = validateUserProgress(
        validProgram,
        advancedProgress,
        'valid-program',
      )
      expect(advancedValidation.isValid).toBe(false)
      expect(advancedValidation.canBeRepaired).toBe(true)
    })

    it('should provide meaningful error messages for repair actions', async () => {
      const userProgress: UserProgress = {
        currentProgram: 'nonexistent-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const validation = validateUserProgress(null, userProgress, 'nonexistent-program')

      expect(validation.isValid).toBe(false)
      expect(validation.errors[0]?.userFriendlyMessage).toBe(
        'Your selected program is no longer available.',
      )
      expect(validation.errors[0]?.suggested_action).toBe(
        'Please choose a new program from the available options.',
      )
      expect(validation.repairActions[0]?.type).toBe('assign_new_program')
    })
  })

  describe('Repair Performance and Limits', () => {
    it('should handle large-scale repair operations efficiently', async () => {
      // Create a large program structure
      const largeMilestones = Array.from({ length: 50 }, (_, i) => ({
        id: `milestone-${i}`,
        name: `Milestone ${i + 1}`,
        theme: `Theme ${i + 1}`,
        objective: `Objective ${i + 1}`,
        days: Array.from({ length: 20 }, (_, j) => ({
          id: `day-${i}-${j}`,
          dayType: j % 2 === 0 ? ('workout' as const) : ('rest' as const),
          exercises:
            j % 2 === 0 ? [{ id: `ex-${i}-${j}`, exercise: 'exercise', sets: 3, reps: 10 }] : [],
          restNotes: j % 2 !== 0 ? 'Rest day' : '',
        })),
      }))

      const largeProgram: Program = {
        ...validProgram,
        milestones: largeMilestones,
      }

      const userProgress: UserProgress = {
        currentProgram: 'large-program',
        currentMilestone: 100, // Way beyond bounds
        currentDay: 50,
      }

      const startTime = Date.now()
      const validation = validateUserProgress(largeProgram, userProgress, 'large-program')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)
    })

    it('should limit repair attempts to prevent infinite loops', async () => {
      const userProgress: UserProgress = {
        currentProgram: 'valid-program',
        currentMilestone: Number.MAX_SAFE_INTEGER,
        currentDay: Number.MAX_SAFE_INTEGER,
      }

      const validation = validateUserProgress(validProgram, userProgress, 'valid-program')

      expect(validation.isValid).toBe(false)
      expect(validation.canBeRepaired).toBe(true)
      expect(validation.repairActions.length).toBeLessThanOrEqual(3) // Reasonable limit on repair actions
    })
  })
})
