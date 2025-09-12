import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkoutStore } from '@/stores/workout-store'
import type { Program } from '@/types/program'

// Mock program data for testing
const mockProgram: Program = {
  id: 'program-123',
  name: 'Test Program',
  description: 'Test description',
  objective: 'Test objective',
  isPublished: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  milestones: [
    {
      id: 'milestone-1',
      name: 'Test Milestone',
      theme: 'Strength',
      objective: 'Build strength',
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
            { id: 'exercise-6', exercise: 'ex-6', sets: 1, reps: 15 },
          ],
        },
      ],
    },
  ],
}

describe('WorkoutStore - Day Progression', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useWorkoutStore())
    act(() => {
      result.current.resetSession()
      result.current.setCurrentProgram(mockProgram, 0, 0)
    })
  })

  describe('Regular Workout Progression', () => {
    it('should advance to next exercise in regular workout', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
      })

      expect(result.current.currentExerciseIndex).toBe(0)

      act(() => {
        const advanced = result.current.advanceToNextExercise()
        expect(advanced).toBe(true)
      })

      expect(result.current.currentExerciseIndex).toBe(1)
    })

    it('should return false when trying to advance past last exercise', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
        result.current.setCurrentExercise(2) // Last exercise
      })

      act(() => {
        const advanced = result.current.advanceToNextExercise()
        expect(advanced).toBe(false)
      })

      expect(result.current.currentExerciseIndex).toBe(2) // Should not change
    })

    it('should correctly calculate remaining exercises', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
      })

      expect(result.current.getRemainingExercises()).toBe(2) // 3 total - 1 current = 2 remaining

      act(() => {
        result.current.advanceToNextExercise()
      })

      expect(result.current.getRemainingExercises()).toBe(1)

      act(() => {
        result.current.advanceToNextExercise()
      })

      expect(result.current.getRemainingExercises()).toBe(0)
    })

    it('should detect when regular day is complete', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
      })

      expect(result.current.isCurrentDayComplete()).toBe(false)

      act(() => {
        result.current.completeDayWorkout()
      })

      expect(result.current.isCurrentDayComplete()).toBe(true)
      expect(result.current.completedExercises).toHaveLength(3)
    })
  })

  describe('AMRAP Workout Progression', () => {
    it('should advance to next exercise in AMRAP round', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      expect(result.current.currentExerciseIndex).toBe(0)
      expect(result.current.currentRound).toBe(1)

      act(() => {
        const advancement = result.current.advanceToNextExerciseAmrap(600) // 10 minutes remaining
        expect(advancement).toBe('next_exercise')
      })

      expect(result.current.currentExerciseIndex).toBe(1)
      expect(result.current.currentRound).toBe(1)
    })

    it('should complete round and restart at first exercise', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
        result.current.setCurrentExercise(2) // Last exercise in round
      })

      expect(result.current.currentExerciseIndex).toBe(2)
      expect(result.current.currentRound).toBe(1)

      act(() => {
        const advancement = result.current.advanceToNextExerciseAmrap(300) // 5 minutes remaining
        expect(advancement).toBe('round_complete')
      })

      expect(result.current.currentExerciseIndex).toBe(0) // Reset to first exercise
      expect(result.current.currentRound).toBe(2) // Round incremented
    })

    it('should complete day when time expires', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      act(() => {
        const advancement = result.current.advanceToNextExerciseAmrap(0) // Time expired
        expect(advancement).toBe('day_complete')
      })

      // Position should not change when day is complete
      expect(result.current.currentExerciseIndex).toBe(0)
      expect(result.current.currentRound).toBe(1)
    })

    it('should identify AMRAP days correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0) // Regular day
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
      })

      expect(result.current.isAmrapDay()).toBe(false)

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      expect(result.current.isAmrapDay()).toBe(true)
    })

    it('should handle AMRAP day completion correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      // AMRAP days are not complete initially
      expect(result.current.isCurrentDayComplete()).toBe(false)

      act(() => {
        result.current.completeExercise('exercise-4') // Complete at least one exercise
      })

      // AMRAP days are complete when any exercise is completed
      expect(result.current.isCurrentDayComplete()).toBe(true)
    })
  })

  describe('Exercise Progress Tracking', () => {
    it('should update exercise progress correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
      })

      act(() => {
        result.current.updateExerciseProgress('exercise-1', {
          isCompleted: true,
          hasData: true,
          completionPercentage: 100,
        })
      })

      const progress = result.current.exerciseProgress['exercise-1']
      expect(progress).toBeDefined()
      expect(progress?.isCompleted).toBe(true)
      expect(progress?.hasData).toBe(true)
      expect(progress?.completionPercentage).toBe(100)
      expect(result.current.completedExercises).toContain('exercise-1')
    })

    it('should update AMRAP progress correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1) // AMRAP day
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      const amrapData = {
        totalRoundsCompleted: 3,
        currentRoundProgress: 2,
        totalExercisesInRound: 3,
      }

      act(() => {
        result.current.updateAmrapProgress('exercise-4', amrapData)
      })

      const progress = result.current.exerciseProgress['exercise-4']
      expect(progress).toBeDefined()
      expect(progress?.amrapData).toEqual(amrapData)
      expect(progress?.hasData).toBe(true)
      expect(progress?.completionPercentage).toBeCloseTo(66.67, 1) // 2/3 * 100
    })

    it('should handle undefined AMRAP data', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 1)
        result.current.startSession(mockProgram.milestones[0]!.days[1]!)
      })

      act(() => {
        result.current.updateAmrapProgress('exercise-4', undefined)
      })

      const progress = result.current.exerciseProgress['exercise-4']
      expect(progress).toBeDefined()
      expect(progress?.amrapData).toBeUndefined()
      expect(progress?.hasData).toBe(false)
      expect(progress?.completionPercentage).toBe(0)
    })
  })

  describe('Session Management', () => {
    it('should reset session correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      act(() => {
        result.current.setCurrentProgram(mockProgram, 0, 0)
        result.current.startSession(mockProgram.milestones[0]!.days[0]!)
        result.current.completeExercise('exercise-1')
        result.current.setCurrentExercise(2)
      })

      expect(result.current.currentExerciseIndex).toBe(2)
      expect(result.current.completedExercises).toHaveLength(1)

      act(() => {
        result.current.resetSession()
      })

      expect(result.current.currentExerciseIndex).toBe(0)
      expect(result.current.completedExercises).toHaveLength(0)
      expect(result.current.exerciseProgress).toEqual({})
      expect(result.current.currentRound).toBe(1)
      expect(result.current.totalExercisesCompleted).toBe(0)
    })

    it('should handle session state changes correctly', () => {
      const { result } = renderHook(() => useWorkoutStore())

      const day = mockProgram.milestones[0]!.days[0]!

      act(() => {
        result.current.startSession(day)
      })

      expect(result.current.isSessionActive).toBe(true)
      expect(result.current.sessionStartTime).toBeTypeOf('number')
      expect(result.current.currentDay).toEqual(day)

      act(() => {
        result.current.endSession()
      })

      expect(result.current.isSessionActive).toBe(false)
      expect(result.current.sessionStartTime).toBe(null)
      expect(result.current.currentDay).toBe(null)
    })
  })
})
