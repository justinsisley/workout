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
})
