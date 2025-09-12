import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutStore } from '@/stores/workout-store'
import type { Program } from '@/types/program'

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
        {
          id: 'day-1',
          dayType: 'workout' as const,
          exercises: [{ id: 'ex-1', exercise: 'exercise-1', sets: 3, reps: 10 }],
        },
        {
          id: 'day-2',
          dayType: 'rest' as const,
          restNotes: 'Complete rest day',
        },
        {
          id: 'day-3',
          dayType: 'workout' as const,
          exercises: [{ id: 'ex-2', exercise: 'exercise-2', sets: 3, reps: 12 }],
        },
      ],
    },
    {
      id: 'milestone-2',
      name: 'Intermediate',
      theme: 'Intermediate Phase',
      objective: 'Build intermediate strength',
      days: [
        {
          id: 'day-4',
          dayType: 'workout' as const,
          exercises: [{ id: 'ex-3', exercise: 'exercise-3', sets: 4, reps: 8 }],
        },
        {
          id: 'day-5',
          dayType: 'workout' as const,
          exercises: [{ id: 'ex-4', exercise: 'exercise-4', sets: 3, reps: 15 }],
        },
      ],
    },
    {
      id: 'milestone-3',
      name: 'Advanced',
      theme: 'Advanced Phase',
      objective: 'Advanced strength training',
      days: [
        {
          id: 'day-6',
          dayType: 'workout' as const,
          exercises: [{ id: 'ex-5', exercise: 'exercise-5', sets: 5, reps: 5 }],
        },
      ],
    },
  ],
}

describe('Workout Store - Milestone Progression', () => {
  beforeEach(() => {
    // Reset the store state
    useWorkoutStore.getState().setCurrentProgram(mockProgram, 0, 0)
  })

  describe('isMilestoneComplete', () => {
    it('returns false for current milestone when not all days are complete', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 1) // On day 1 of milestone 0 (3 days total)

      expect(store.isMilestoneComplete(0)).toBe(false)
      expect(store.isMilestoneComplete()).toBe(false) // Current milestone
    })

    it('returns true for current milestone when all days are complete', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 3) // Past last day of milestone 0

      expect(store.isMilestoneComplete(0)).toBe(true)
      expect(store.isMilestoneComplete()).toBe(true) // Current milestone
    })

    it('returns true for previous milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 1, 0) // On milestone 1

      expect(store.isMilestoneComplete(0)).toBe(true) // Previous milestone
    })

    it('returns false for future milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 2) // On milestone 0

      expect(store.isMilestoneComplete(1)).toBe(false) // Future milestone
      expect(store.isMilestoneComplete(2)).toBe(false) // Future milestone
    })

    it('handles invalid milestone indices', () => {
      const store = useWorkoutStore.getState()

      expect(store.isMilestoneComplete(-1)).toBe(false)
      expect(store.isMilestoneComplete(999)).toBe(false)
    })

    it('handles program without milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram({ ...mockProgram, milestones: [] }, 0, 0)

      expect(store.isMilestoneComplete(0)).toBe(false)
    })

    it('handles null program', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(null as any, 0, 0)

      expect(store.isMilestoneComplete(0)).toBe(false)
      expect(store.isMilestoneComplete()).toBe(false)
    })
  })

  describe('isCurrentMilestoneComplete', () => {
    it('returns same result as isMilestoneComplete() with no parameters', () => {
      const store = useWorkoutStore.getState()

      // Test various positions
      store.setCurrentProgram(mockProgram, 0, 1)
      expect(store.isCurrentMilestoneComplete()).toBe(store.isMilestoneComplete())

      store.setCurrentProgram(mockProgram, 0, 3)
      expect(store.isCurrentMilestoneComplete()).toBe(store.isMilestoneComplete())

      store.setCurrentProgram(mockProgram, 1, 0)
      expect(store.isCurrentMilestoneComplete()).toBe(store.isMilestoneComplete())
    })
  })

  describe('shouldTriggerMilestoneCompletion', () => {
    it('returns true when on last day of milestone with next milestone available', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 2) // Last day (index 2) of first milestone

      expect(store.shouldTriggerMilestoneCompletion()).toBe(true)
    })

    it('returns false when not on last day of milestone', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 1) // Middle day of milestone

      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
    })

    it('returns false when on last milestone (no next milestone)', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 2, 0) // Last milestone

      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
    })

    it('returns false when program has no milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram({ ...mockProgram, milestones: [] }, 0, 0)

      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
    })

    it('returns false when no program is set', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(null as any, 0, 0)

      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
    })

    it('handles milestone with no days', () => {
      const programWithEmptyMilestone = {
        ...mockProgram,
        milestones: [
          {
            id: 'empty-milestone',
            name: 'Empty Milestone',
            theme: 'Empty Theme',
            objective: 'No days objective',
            days: [],
          },
        ],
      }
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(programWithEmptyMilestone, 0, 0)

      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
    })
  })

  describe('isProgramComplete', () => {
    it('returns false when on valid milestone', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 0) // First milestone
      expect(store.isProgramComplete()).toBe(false)

      store.setCurrentProgram(mockProgram, 2, 0) // Last milestone
      expect(store.isProgramComplete()).toBe(false)
    })

    it('returns true when milestone index exceeds program milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 3, 0) // Beyond last milestone (index 2)

      expect(store.isProgramComplete()).toBe(true)
    })

    it('returns false when no program is set', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(null as any, 0, 0)

      expect(store.isProgramComplete()).toBe(false)
    })

    it('handles program with no milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram({ ...mockProgram, milestones: [] }, 0, 0)

      expect(store.isProgramComplete()).toBe(true) // 0 >= 0
    })
  })

  describe('getMilestoneCompletionStats', () => {
    it('returns correct stats for milestone in progress', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 1) // Day 1 (0-indexed) of milestone 0

      const stats = store.getMilestoneCompletionStats()

      expect(stats.totalDays).toBe(3) // Milestone 0 has 3 days
      expect(stats.completedDays).toBe(2) // currentDay + 1 (day 1 -> 2 completed)
      expect(stats.completionPercentage).toBeCloseTo(66.67, 1) // 2/3 * 100
      expect(stats.isLastMilestone).toBe(false) // Milestone 0 is not last
    })

    it('returns correct stats for completed milestone', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 3) // Past last day of milestone 0

      const stats = store.getMilestoneCompletionStats()

      expect(stats.totalDays).toBe(3)
      expect(stats.completedDays).toBe(3) // Capped at total days
      expect(stats.completionPercentage).toBe(100) // 3/3 * 100
      expect(stats.isLastMilestone).toBe(false)
    })

    it('identifies last milestone correctly', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 2, 0) // Last milestone

      const stats = store.getMilestoneCompletionStats()

      expect(stats.isLastMilestone).toBe(true)
    })

    it('returns zero stats for program without milestones', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram({ ...mockProgram, milestones: [] }, 0, 0)

      const stats = store.getMilestoneCompletionStats()

      expect(stats.totalDays).toBe(0)
      expect(stats.completedDays).toBe(0)
      expect(stats.completionPercentage).toBe(0)
      expect(stats.isLastMilestone).toBe(false)
    })

    it('returns zero stats when no program is set', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(null as any, 0, 0)

      const stats = store.getMilestoneCompletionStats()

      expect(stats.totalDays).toBe(0)
      expect(stats.completedDays).toBe(0)
      expect(stats.completionPercentage).toBe(0)
      expect(stats.isLastMilestone).toBe(false)
    })

    it('handles milestone with no days', () => {
      const programWithEmptyMilestone = {
        ...mockProgram,
        milestones: [
          {
            id: 'empty-milestone',
            name: 'Empty Milestone',
            theme: 'Empty Theme',
            objective: 'No days objective',
            days: [],
          },
        ],
      }
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(programWithEmptyMilestone, 0, 0)

      const stats = store.getMilestoneCompletionStats()

      expect(stats.totalDays).toBe(0)
      expect(stats.completedDays).toBe(0)
      expect(stats.completionPercentage).toBe(0)
      expect(stats.isLastMilestone).toBe(true) // Only milestone
    })

    it('handles edge case of day index beyond milestone days', () => {
      const store = useWorkoutStore.getState()
      store.setCurrentProgram(mockProgram, 0, 10) // Way beyond milestone days

      const stats = store.getMilestoneCompletionStats()

      expect(stats.completedDays).toBe(3) // Capped at total days
      expect(stats.completionPercentage).toBe(100)
    })

    it('calculates completion percentage correctly for various positions', () => {
      const store = useWorkoutStore.getState()

      // Day 0 (first day) -> 1 completed day
      store.setCurrentProgram(mockProgram, 0, 0)
      expect(store.getMilestoneCompletionStats().completionPercentage).toBeCloseTo(33.33, 1)

      // Day 1 (second day) -> 2 completed days
      store.setCurrentProgram(mockProgram, 0, 1)
      expect(store.getMilestoneCompletionStats().completionPercentage).toBeCloseTo(66.67, 1)

      // Day 2 (last day) -> 3 completed days
      store.setCurrentProgram(mockProgram, 0, 2)
      expect(store.getMilestoneCompletionStats().completionPercentage).toBe(100)
    })
  })

  describe('Integration Tests', () => {
    it('milestone completion detection works correctly throughout program progression', () => {
      const store = useWorkoutStore.getState()

      // Start of program
      store.setCurrentProgram(mockProgram, 0, 0)
      expect(store.isMilestoneComplete()).toBe(false)
      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
      expect(store.isProgramComplete()).toBe(false)

      // Middle of first milestone
      store.setCurrentProgram(mockProgram, 0, 1)
      expect(store.isMilestoneComplete()).toBe(false)
      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
      expect(store.isProgramComplete()).toBe(false)

      // Last day of first milestone
      store.setCurrentProgram(mockProgram, 0, 2)
      expect(store.isMilestoneComplete()).toBe(false) // Not yet complete
      expect(store.shouldTriggerMilestoneCompletion()).toBe(true) // Should trigger
      expect(store.isProgramComplete()).toBe(false)

      // Completed first milestone, on second milestone
      store.setCurrentProgram(mockProgram, 1, 0)
      expect(store.isMilestoneComplete(0)).toBe(true) // Previous milestone complete
      expect(store.isMilestoneComplete()).toBe(false) // Current milestone not complete
      expect(store.shouldTriggerMilestoneCompletion()).toBe(false)
      expect(store.isProgramComplete()).toBe(false)

      // Last day of last milestone
      store.setCurrentProgram(mockProgram, 2, 0)
      expect(store.isMilestoneComplete()).toBe(false)
      expect(store.shouldTriggerMilestoneCompletion()).toBe(false) // No next milestone
      expect(store.isProgramComplete()).toBe(false)

      // Program completed
      store.setCurrentProgram(mockProgram, 3, 0)
      expect(store.isMilestoneComplete(2)).toBe(true) // Last milestone complete
      expect(store.isProgramComplete()).toBe(true)
    })
  })
})
