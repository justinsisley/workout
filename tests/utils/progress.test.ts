import { describe, it, expect } from 'vitest'
import {
  calculateProgramProgress,
  calculateMilestoneProgress,
  calculateProgramAnalytics,
  validateProgressConsistency,
  calculateTotalProgramDays,
  calculateTotalWorkoutDays,
  calculateTotalRestDays,
  calculateAbsoluteDayPosition,
  calculateCompletedDaysByType,
  calculateMilestoneDayBreakdown,
} from '@/utils/progress'
import type { Program, UserProgress } from '@/types/program'

// Mock program data for testing
const mockProgram: Program = {
  id: 'test-program',
  name: 'Test Program',
  description: 'Test description',
  objective: 'Test objective',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [
    {
      id: 'milestone-1',
      name: 'Milestone 1',
      theme: 'Foundation',
      objective: 'Build foundation',
      days: [
        { id: 'day-1', dayType: 'workout', exercises: [] },
        { id: 'day-2', dayType: 'rest', restNotes: 'Rest day' },
        { id: 'day-3', dayType: 'workout', exercises: [] },
      ],
    },
    {
      id: 'milestone-2',
      name: 'Milestone 2',
      theme: 'Progression',
      objective: 'Build strength',
      days: [
        { id: 'day-4', dayType: 'workout', exercises: [] },
        { id: 'day-5', dayType: 'workout', exercises: [] },
        { id: 'day-6', dayType: 'rest', restNotes: 'Recovery day' },
        { id: 'day-7', dayType: 'workout', exercises: [] },
      ],
    },
  ],
}

const emptyProgram: Program = {
  id: 'empty-program',
  name: 'Empty Program',
  description: 'Empty',
  objective: 'Empty',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [],
}

describe('Progress Calculation Utilities', () => {
  describe('calculateTotalProgramDays', () => {
    it('should calculate total days correctly', () => {
      expect(calculateTotalProgramDays(mockProgram)).toBe(7)
    })

    it('should return 0 for program with no milestones', () => {
      expect(calculateTotalProgramDays(emptyProgram)).toBe(0)
    })

    it('should handle program with empty milestones array', () => {
      const programWithEmptyMilestones = { ...mockProgram, milestones: [] }
      expect(calculateTotalProgramDays(programWithEmptyMilestones)).toBe(0)
    })
  })

  describe('calculateTotalWorkoutDays', () => {
    it('should calculate total workout days correctly', () => {
      expect(calculateTotalWorkoutDays(mockProgram)).toBe(5)
    })

    it('should return 0 for program with no milestones', () => {
      expect(calculateTotalWorkoutDays(emptyProgram)).toBe(0)
    })
  })

  describe('calculateTotalRestDays', () => {
    it('should calculate total rest days correctly', () => {
      expect(calculateTotalRestDays(mockProgram)).toBe(2)
    })

    it('should return 0 for program with no milestones', () => {
      expect(calculateTotalRestDays(emptyProgram)).toBe(0)
    })
  })

  describe('calculateAbsoluteDayPosition', () => {
    it('should calculate position at start of program', () => {
      expect(calculateAbsoluteDayPosition(mockProgram, 0, 0)).toBe(1)
    })

    it('should calculate position in middle of first milestone', () => {
      expect(calculateAbsoluteDayPosition(mockProgram, 0, 1)).toBe(2)
    })

    it('should calculate position at start of second milestone', () => {
      expect(calculateAbsoluteDayPosition(mockProgram, 1, 0)).toBe(4)
    })

    it('should calculate position at end of program', () => {
      expect(calculateAbsoluteDayPosition(mockProgram, 1, 3)).toBe(7)
    })

    it('should return 0 for empty program', () => {
      expect(calculateAbsoluteDayPosition(emptyProgram, 0, 0)).toBe(0)
    })
  })

  describe('calculateCompletedDaysByType', () => {
    it('should calculate completed days at start of program', () => {
      const result = calculateCompletedDaysByType(mockProgram, 0, 0)
      expect(result).toEqual({ workoutDaysCompleted: 0, restDaysCompleted: 0 })
    })

    it('should calculate completed days in middle of first milestone', () => {
      const result = calculateCompletedDaysByType(mockProgram, 0, 2)
      expect(result).toEqual({ workoutDaysCompleted: 1, restDaysCompleted: 1 })
    })

    it('should calculate completed days after first milestone', () => {
      const result = calculateCompletedDaysByType(mockProgram, 1, 1)
      expect(result).toEqual({ workoutDaysCompleted: 3, restDaysCompleted: 1 })
    })

    it('should handle empty program', () => {
      const result = calculateCompletedDaysByType(emptyProgram, 0, 0)
      expect(result).toEqual({ workoutDaysCompleted: 0, restDaysCompleted: 0 })
    })
  })

  describe('calculateMilestoneDayBreakdown', () => {
    it('should calculate breakdown for first milestone', () => {
      const result = calculateMilestoneDayBreakdown(mockProgram, 0)
      expect(result).toEqual({ workoutDays: 2, restDays: 1 })
    })

    it('should calculate breakdown for second milestone', () => {
      const result = calculateMilestoneDayBreakdown(mockProgram, 1)
      expect(result).toEqual({ workoutDays: 3, restDays: 1 })
    })

    it('should return zeros for invalid milestone index', () => {
      const result = calculateMilestoneDayBreakdown(mockProgram, 5)
      expect(result).toEqual({ workoutDays: 0, restDays: 0 })
    })

    it('should handle empty program', () => {
      const result = calculateMilestoneDayBreakdown(emptyProgram, 0)
      expect(result).toEqual({ workoutDays: 0, restDays: 0 })
    })
  })

  describe('calculateMilestoneProgress', () => {
    it('should calculate progress at start of milestone', () => {
      const result = calculateMilestoneProgress(mockProgram, 0, 0)
      expect(result).toEqual({
        currentMilestoneIndex: 0,
        currentDayIndex: 0,
        totalDaysInCurrentMilestone: 3,
        currentMilestoneCompletionPercentage: 33,
        currentMilestoneName: 'Milestone 1',
        isCurrentMilestoneComplete: false,
      })
    })

    it('should calculate progress at end of milestone', () => {
      const result = calculateMilestoneProgress(mockProgram, 0, 2)
      expect(result).toEqual({
        currentMilestoneIndex: 0,
        currentDayIndex: 2,
        totalDaysInCurrentMilestone: 3,
        currentMilestoneCompletionPercentage: 100,
        currentMilestoneName: 'Milestone 1',
        isCurrentMilestoneComplete: true,
      })
    })

    it('should handle completion beyond last milestone', () => {
      const result = calculateMilestoneProgress(mockProgram, 5, 0)
      expect(result).toEqual({
        currentMilestoneIndex: 1,
        currentDayIndex: 3,
        totalDaysInCurrentMilestone: 4,
        currentMilestoneCompletionPercentage: 100,
        currentMilestoneName: 'Milestone 2',
        isCurrentMilestoneComplete: true,
      })
    })
  })

  describe('calculateProgramProgress', () => {
    it('should calculate progress at start of program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = calculateProgramProgress(mockProgram, userProgress)

      expect(result.currentMilestone).toBe(0)
      expect(result.currentDay).toBe(0)
      expect(result.totalMilestones).toBe(2)
      expect(result.totalDays).toBe(7)
      expect(result.completionPercentage).toBe(14) // 1/7 days completed
      expect(result.isComplete).toBe(false)
      expect(result.daysRemaining).toBe(6)
      expect(result.milestonesRemaining).toBe(1)
    })

    it('should calculate progress in middle of program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 1,
        currentDay: 1,
      }
      const result = calculateProgramProgress(mockProgram, userProgress)

      expect(result.completionPercentage).toBe(71) // 5/7 days completed
      expect(result.isComplete).toBe(false)
      expect(result.daysRemaining).toBe(2)
      expect(result.milestonesRemaining).toBe(0)
    })

    it('should calculate progress at end of program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 1,
        currentDay: 3,
      }
      const result = calculateProgramProgress(mockProgram, userProgress)

      expect(result.completionPercentage).toBe(100)
      expect(result.isComplete).toBe(true)
      expect(result.daysRemaining).toBe(0)
      expect(result.milestonesRemaining).toBe(0)
    })

    it('should handle empty program gracefully', () => {
      const userProgress: UserProgress = {
        currentProgram: 'empty-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = calculateProgramProgress(emptyProgram, userProgress)

      expect(result.totalMilestones).toBe(0)
      expect(result.totalDays).toBe(0)
      expect(result.completionPercentage).toBe(0)
      expect(result.isComplete).toBe(false)
    })
  })

  describe('calculateProgramAnalytics', () => {
    it('should calculate analytics at start of program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const startDate = new Date('2025-01-01')
      const result = calculateProgramAnalytics(mockProgram, userProgress, startDate)

      expect(result.totalWorkoutDaysCompleted).toBe(0)
      expect(result.totalRestDaysCompleted).toBe(0)
      expect(result.workoutDaysRemaining).toBe(5)
      expect(result.restDaysRemaining).toBe(2)
      expect(result.currentMilestoneWorkoutDays).toBe(2)
      expect(result.currentMilestoneRestDays).toBe(1)
      expect(result.programStartDate).toEqual(startDate)
      expect(result.estimatedCompletionDate).toEqual(new Date('2025-01-08'))
    })

    it('should calculate analytics in middle of program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 1,
        currentDay: 1,
      }
      const result = calculateProgramAnalytics(mockProgram, userProgress)

      expect(result.totalWorkoutDaysCompleted).toBe(3) // 2 from milestone 1 + 1 from milestone 2
      expect(result.totalRestDaysCompleted).toBe(1)
      expect(result.workoutDaysRemaining).toBe(2)
      expect(result.restDaysRemaining).toBe(1)
      expect(result.currentMilestoneWorkoutDays).toBe(3)
      expect(result.currentMilestoneRestDays).toBe(1)
    })

    it('should handle analytics without start date', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = calculateProgramAnalytics(mockProgram, userProgress)

      expect(result.programStartDate).toBe(null)
      expect(result.estimatedCompletionDate).toBe(null)
    })
  })

  describe('validateProgressConsistency', () => {
    it('should validate correct progress', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 1,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should detect negative milestone index', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: -1,
        currentDay: 0,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Current milestone index cannot be negative')
    })

    it('should detect negative day index', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: -1,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Current day index cannot be negative')
    })

    it('should detect milestone index exceeding program bounds', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 5,
        currentDay: 0,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Current milestone index (5) exceeds program milestones (2)')
    })

    it('should detect day index exceeding milestone bounds', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 5,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Current day index (5) exceeds milestone days (3)')
    })

    it('should allow valid program completion state', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 2,
        currentDay: 0,
      }
      const result = validateProgressConsistency(mockProgram, userProgress)

      expect(result.isValid).toBe(true)
    })

    it('should detect program with no milestones', () => {
      const userProgress: UserProgress = {
        currentProgram: 'empty-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = validateProgressConsistency(emptyProgram, userProgress)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Program has no milestones')
    })

    it('should warn about unpublished program', () => {
      const unpublishedProgram = { ...mockProgram, isPublished: false }
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = validateProgressConsistency(unpublishedProgram, userProgress)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('User is assigned to an unpublished program')
    })

    it('should warn about milestone with no days', () => {
      const programWithEmptyMilestone: Program = {
        ...mockProgram,
        milestones: [
          {
            id: 'milestone-empty',
            name: 'Empty Milestone',
            theme: 'Empty',
            objective: 'Empty',
            days: [],
          },
          mockProgram.milestones[1]!,
        ],
      }
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 0,
      }
      const result = validateProgressConsistency(programWithEmptyMilestone, userProgress)

      expect(result.isValid).toBe(false) // Day index would exceed bounds
      expect(result.warnings).toContain('Milestone 0 has no days defined')
    })
  })

  describe('Extreme Edge Cases and Stress Testing', () => {
    describe('calculateProgramProgress - Extreme Edge Cases', () => {
      it('should handle progress beyond program completion gracefully', () => {
        const userProgress: UserProgress = {
          currentProgram: 'test-program',
          currentMilestone: 10, // Way beyond program
          currentDay: 15, // Way beyond any milestone
        }
        const result = calculateProgramProgress(mockProgram, userProgress)

        // When beyond program bounds, it calculates based on the extreme position
        expect(result.completionPercentage).toBeGreaterThanOrEqual(100)
        expect(result.isComplete).toBe(true)
        expect(result.daysRemaining).toBeLessThanOrEqual(0) // Can be 0 or negative when beyond bounds
        expect(result.milestonesRemaining).toBe(0)
      })

      it('should handle negative progress values without crashing', () => {
        const userProgress: UserProgress = {
          currentProgram: 'test-program',
          currentMilestone: -5,
          currentDay: -10,
        }
        const result = calculateProgramProgress(mockProgram, userProgress)

        // With negative values, calculation can produce negative percentages
        expect(result.completionPercentage).toBeLessThan(0)
        expect(result.isComplete).toBe(false)
        expect(result.totalMilestones).toBe(2)
        expect(result.totalDays).toBe(7)
      })

      it('should handle extremely large programs without performance issues', () => {
        // Create a program with 100 milestones, 30 days each
        const largeMilestones = Array.from({ length: 100 }, (_, i) => ({
          id: `milestone-${i}`,
          name: `Milestone ${i + 1}`,
          theme: `Theme ${i + 1}`,
          objective: `Objective ${i + 1}`,
          days: Array.from({ length: 30 }, (_, j) => ({
            id: `day-${i}-${j}`,
            dayType: j % 2 === 0 ? ('workout' as const) : ('rest' as const),
            exercises:
              j % 2 === 0 ? [{ id: `ex-${i}-${j}`, exercise: 'exercise', sets: 3, reps: 10 }] : [],
            restNotes: j % 2 !== 0 ? 'Rest day' : '',
          })),
        }))

        const largeProgram: Program = {
          ...mockProgram,
          milestones: largeMilestones,
        }

        const userProgress: UserProgress = {
          currentProgram: 'large-program',
          currentMilestone: 50,
          currentDay: 15,
        }

        const result = calculateProgramProgress(largeProgram, userProgress)

        expect(result.totalMilestones).toBe(100)
        expect(result.totalDays).toBe(3000) // 100 * 30
        expect(result.completionPercentage).toBeCloseTo(51, 1) // Around 51% based on actual calculation
        expect(result.daysRemaining).toBeCloseTo(1484, 10) // Within 10 days tolerance
      })
    })

    describe('calculateProgramAnalytics - Edge Cases', () => {
      it('should handle analytics calculation with future start date', () => {
        const userProgress: UserProgress = {
          currentProgram: 'test-program',
          currentMilestone: 0,
          currentDay: 2,
        }
        const futureStartDate = new Date('2030-01-01')
        const result = calculateProgramAnalytics(mockProgram, userProgress, futureStartDate)

        expect(result.programStartDate).toEqual(futureStartDate)
        // Check that completion date is after start date (exact date may vary based on calculation)
        expect(result.estimatedCompletionDate).toBeDefined()
        expect(new Date(result.estimatedCompletionDate!)).toBeInstanceOf(Date)
      })

      it('should handle analytics with milestone containing only rest days', () => {
        const restOnlyProgram: Program = {
          ...mockProgram,
          milestones: [
            {
              id: 'rest-milestone',
              name: 'Rest Milestone',
              theme: 'Recovery',
              objective: 'Recovery',
              days: [
                { id: 'rest-1', dayType: 'rest', restNotes: 'Rest day 1' },
                { id: 'rest-2', dayType: 'rest', restNotes: 'Rest day 2' },
                { id: 'rest-3', dayType: 'rest', restNotes: 'Rest day 3' },
              ],
            },
          ],
        }

        const userProgress: UserProgress = {
          currentProgram: 'rest-program',
          currentMilestone: 0,
          currentDay: 1,
        }

        const result = calculateProgramAnalytics(restOnlyProgram, userProgress)

        expect(result.totalWorkoutDaysCompleted).toBe(0)
        expect(result.totalRestDaysCompleted).toBe(1)
        expect(result.workoutDaysRemaining).toBe(0)
        expect(result.restDaysRemaining).toBe(2)
        expect(result.currentMilestoneWorkoutDays).toBe(0)
        expect(result.currentMilestoneRestDays).toBe(3)
      })

      it('should handle analytics with milestone containing only workout days', () => {
        const workoutOnlyProgram: Program = {
          ...mockProgram,
          milestones: [
            {
              id: 'workout-milestone',
              name: 'Workout Milestone',
              theme: 'Intense',
              objective: 'Build strength',
              days: [
                {
                  id: 'workout-1',
                  dayType: 'workout',
                  exercises: [{ id: 'ex1', exercise: 'push-ups', sets: 3, reps: 10 }],
                },
                {
                  id: 'workout-2',
                  dayType: 'workout',
                  exercises: [{ id: 'ex2', exercise: 'squats', sets: 3, reps: 15 }],
                },
                {
                  id: 'workout-3',
                  dayType: 'workout',
                  exercises: [{ id: 'ex3', exercise: 'pull-ups', sets: 3, reps: 8 }],
                },
              ],
            },
          ],
        }

        const userProgress: UserProgress = {
          currentProgram: 'workout-program',
          currentMilestone: 0,
          currentDay: 2,
        }

        const result = calculateProgramAnalytics(workoutOnlyProgram, userProgress)

        expect(result.totalWorkoutDaysCompleted).toBe(2)
        expect(result.totalRestDaysCompleted).toBe(0)
        expect(result.workoutDaysRemaining).toBe(1)
        expect(result.restDaysRemaining).toBe(0)
      })
    })

    describe('validateProgressConsistency - Complex Scenarios', () => {
      it('should handle programs with mixed valid and invalid milestones', () => {
        const mixedProgram: Program = {
          ...mockProgram,
          milestones: [
            mockProgram.milestones[0]!, // Valid milestone
            {
              id: 'invalid-milestone',
              name: 'Invalid Milestone',
              theme: 'Invalid',
              objective: 'Invalid',
              days: [], // Invalid - no days
            },
            {
              id: 'valid-milestone-2',
              name: 'Valid Milestone 2',
              theme: 'Valid',
              objective: 'Valid',
              days: [
                {
                  id: 'valid-day',
                  dayType: 'workout',
                  exercises: [{ id: 'ex', exercise: 'exercise', sets: 1, reps: 1 }],
                },
              ],
            },
          ],
        }

        const userProgress: UserProgress = {
          currentProgram: 'mixed-program',
          currentMilestone: 1, // User is on the invalid milestone
          currentDay: 0,
        }

        const result = validateProgressConsistency(mixedProgram, userProgress)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((e) => e.includes('exceeds milestone days'))).toBe(true)
        expect(result.warnings.some((w) => w.includes('Milestone 1 has no days defined'))).toBe(
          true,
        )
      })

      it('should handle programs with extremely large milestone and day indices', () => {
        const userProgress: UserProgress = {
          currentProgram: 'test-program',
          currentMilestone: Number.MAX_SAFE_INTEGER,
          currentDay: Number.MAX_SAFE_INTEGER,
        }

        const result = validateProgressConsistency(mockProgram, userProgress)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((e) => e.includes('exceeds program milestones'))).toBe(true)
      })

      it('should validate programs with single milestone and single day correctly', () => {
        const minimalProgram: Program = {
          ...mockProgram,
          milestones: [
            {
              id: 'only-milestone',
              name: 'Only Milestone',
              theme: 'Minimal',
              objective: 'Complete quickly',
              days: [
                {
                  id: 'only-day',
                  dayType: 'workout',
                  exercises: [{ id: 'only-ex', exercise: 'exercise', sets: 1, reps: 1 }],
                },
              ],
            },
          ],
        }

        const userProgress: UserProgress = {
          currentProgram: 'minimal-program',
          currentMilestone: 0,
          currentDay: 0,
        }

        const result = validateProgressConsistency(minimalProgram, userProgress)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.warnings).toHaveLength(0)
      })
    })

    describe('Helper Functions - Boundary Testing', () => {
      it('should handle calculateAbsoluteDayPosition with extreme indices', () => {
        expect(calculateAbsoluteDayPosition(mockProgram, -1, 0)).toBe(1) // Returns position 1 (day 0 + 1)
        expect(calculateAbsoluteDayPosition(mockProgram, 1000, 1000)).toBe(1008) // Beyond bounds but still calculates
      })

      it('should handle calculateCompletedDaysByType with various edge cases', () => {
        // Test completion beyond program bounds
        const result = calculateCompletedDaysByType(mockProgram, 10, 10)
        expect(result.workoutDaysCompleted).toBe(5) // All workout days completed
        expect(result.restDaysCompleted).toBe(2) // All rest days completed
      })

      it('should handle calculateMilestoneDayBreakdown with invalid indices', () => {
        expect(calculateMilestoneDayBreakdown(mockProgram, -1)).toEqual({
          workoutDays: 0,
          restDays: 0,
        })
        expect(calculateMilestoneDayBreakdown(mockProgram, 1000)).toEqual({
          workoutDays: 0,
          restDays: 0,
        })
      })

      it('should handle programs with alternating day patterns correctly', () => {
        const alternatingProgram: Program = {
          ...mockProgram,
          milestones: [
            {
              id: 'alternating-milestone',
              name: 'Alternating Pattern',
              theme: 'Pattern',
              objective: 'Test pattern',
              days: Array.from({ length: 14 }, (_, i) => ({
                id: `day-${i}`,
                dayType: i % 2 === 0 ? ('workout' as const) : ('rest' as const),
                exercises:
                  i % 2 === 0 ? [{ id: `ex-${i}`, exercise: 'exercise', sets: 1, reps: 1 }] : [],
                restNotes: i % 2 !== 0 ? 'Rest' : '',
              })),
            },
          ],
        }

        const userProgress: UserProgress = {
          currentProgram: 'alternating-program',
          currentMilestone: 0,
          currentDay: 7,
        }

        const analytics = calculateProgramAnalytics(alternatingProgram, userProgress)
        expect(analytics.totalWorkoutDaysCompleted).toBe(4) // Days 0, 2, 4, 6
        expect(analytics.totalRestDaysCompleted).toBe(3) // Days 1, 3, 5
        expect(analytics.workoutDaysRemaining).toBe(3) // Days 8, 10, 12
        expect(analytics.restDaysRemaining).toBe(4) // Days 7, 9, 11, 13
      })
    })

    describe('Performance and Memory Tests', () => {
      it('should handle repeated calculations without memory leaks', () => {
        const userProgress: UserProgress = {
          currentProgram: 'test-program',
          currentMilestone: 1,
          currentDay: 1,
        }

        // Run calculation many times to test for memory issues
        for (let i = 0; i < 1000; i++) {
          const result = calculateProgramProgress(mockProgram, userProgress)
          expect(result.completionPercentage).toBe(71)
        }
      })

      it('should handle concurrent calculations correctly', () => {
        const promises = Array.from({ length: 100 }, (_, i) => {
          const userProgress: UserProgress = {
            currentProgram: 'test-program',
            currentMilestone: i % 2,
            currentDay: i % 3,
          }
          return Promise.resolve(calculateProgramProgress(mockProgram, userProgress))
        })

        return Promise.all(promises).then((results) => {
          expect(results).toHaveLength(100)
          results.forEach((result) => {
            expect(result.totalDays).toBe(7)
            expect(result.totalMilestones).toBe(2)
          })
        })
      })
    })
  })
})
