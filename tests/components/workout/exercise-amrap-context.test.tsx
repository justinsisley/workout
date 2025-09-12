import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExerciseAmrapContext } from '@/components/workout/exercise-amrap-context'
import type { MilestoneDay } from '@/types/program'

// Mock the workout store
const mockUseWorkoutStore = vi.fn()
vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: () => mockUseWorkoutStore(),
}))

// Mock the type guards
vi.mock('@/utils/type-guards', () => ({
  isAmrapDay: vi.fn(),
}))

// Mock the utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  RotateCw: () => <div data-testid="rotate-cw-icon" />,
  Target: () => <div data-testid="target-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
}))

const { isAmrapDay } = await import('@/utils/type-guards')

describe('ExerciseAmrapContext', () => {
  const mockDay: MilestoneDay = {
    id: 'day-1',
    dayType: 'workout',
    isAmrap: true,
    amrapDuration: 20, // 20 minutes
    exercises: [
      {
        id: 'exercise-1',
        exercise: 'exercise-1',
        sets: 1,
        reps: 10,
      },
      {
        id: 'exercise-2',
        exercise: 'exercise-2',
        sets: 1,
        reps: 15,
      },
      {
        id: 'exercise-3',
        exercise: 'exercise-3',
        sets: 1,
        reps: 8,
      },
    ],
  }

  const mockNonAmrapDay: MilestoneDay = {
    id: 'day-2',
    dayType: 'workout',
    isAmrap: false,
    exercises: [
      {
        id: 'exercise-1',
        exercise: 'exercise-1',
        sets: 3,
        reps: 10,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AMRAP day detection', () => {
    it('should not render for non-AMRAP days', () => {
      vi.mocked(isAmrapDay).mockReturnValue(false)
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      const { container } = render(<ExerciseAmrapContext day={mockNonAmrapDay} />)
      expect(container.firstChild).toBeNull()
      expect(isAmrapDay).toHaveBeenCalledWith(mockNonAmrapDay)
    })

    it('should render for AMRAP days', () => {
      vi.mocked(isAmrapDay).mockReturnValue(true)
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('AMRAP Workout')).toBeInTheDocument()
      expect(isAmrapDay).toHaveBeenCalledWith(mockDay)
    })
  })

  describe('round-based presentation', () => {
    beforeEach(() => {
      vi.mocked(isAmrapDay).mockReturnValue(true)
    })

    it('should display current round number', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 3,
        totalExercisesCompleted: 6,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('Round 3')).toBeInTheDocument()
    })

    it('should show current round exercise progress', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 2,
        totalExercisesCompleted: 5, // 1 complete round + 2 exercises in current round
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('2 of 3 exercises')).toBeInTheDocument()
    })

    it('should display completed rounds count', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 3,
        totalExercisesCompleted: 8, // 2 complete rounds + 2 exercises in current round
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('2')).toBeInTheDocument() // Completed rounds badge
    })

    it('should calculate round progress percentage correctly', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 2,
        totalExercisesCompleted: 5, // 1 complete round + 2 exercises in current round
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      // 2 of 3 exercises = 67% (rounded)
      expect(screen.getByText('67%')).toBeInTheDocument()
    })
  })

  describe('time display and tracking', () => {
    beforeEach(() => {
      vi.mocked(isAmrapDay).mockReturnValue(true)
    })

    it('should display total AMRAP duration', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('20m Total')).toBeInTheDocument()
    })

    it('should calculate and display time remaining', () => {
      const startTime = Date.now() - 5 * 60 * 1000 // 5 minutes ago
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 2,
        sessionStartTime: startTime,
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('15m')).toBeInTheDocument() // 20m - 5m = 15m remaining
    })

    it('should handle time formatting for hours and minutes', () => {
      const dayWithLongDuration = {
        ...mockDay,
        amrapDuration: 90, // 90 minutes = 1h 30m
      }

      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={dayWithLongDuration} />)
      expect(screen.getByText('1h 30m Total')).toBeInTheDocument()
    })

    it('should show warning color for low time remaining', () => {
      const startTime = Date.now() - 17 * 60 * 1000 // 17 minutes ago (3 minutes remaining)
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 2,
        sessionStartTime: startTime,
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      const timeRemainingElement = screen.getByText('3m')
      // Check that it's using the destructive variant (red color for low time)
      expect(
        timeRemainingElement.closest('.badge-destructive, [data-variant="destructive"]'),
      ).toBeTruthy()
    })

    it('should handle zero session start time gracefully', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: null,
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('20m')).toBeInTheDocument() // Full duration remaining
    })
  })

  describe('UI components and styling', () => {
    beforeEach(() => {
      vi.mocked(isAmrapDay).mockReturnValue(true)
    })

    it('should render with proper AMRAP styling and icons', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)

      // Check for AMRAP-specific icons
      expect(screen.getByTestId('rotate-cw-icon')).toBeInTheDocument()
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    })

    it('should display AMRAP instructions', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText(/Complete as many rounds as possible in 20m/)).toBeInTheDocument()
      expect(screen.getByText(/Focus on form over speed/)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      const { container } = render(<ExerciseAmrapContext day={mockDay} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('edge cases and error handling', () => {
    beforeEach(() => {
      vi.mocked(isAmrapDay).mockReturnValue(true)
    })

    it('should handle day with no exercises', () => {
      const dayWithNoExercises = {
        ...mockDay,
        exercises: [],
      }

      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={dayWithNoExercises} />)
      expect(screen.getByText('0 of 0 exercises')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle undefined exercises gracefully', () => {
      const dayWithUndefinedExercises: MilestoneDay = {
        id: 'day-test',
        dayType: 'workout',
        isAmrap: true,
        amrapDuration: 20,
        // exercises property intentionally omitted to test undefined case
      }

      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={dayWithUndefinedExercises} />)
      expect(screen.getByText('0 of 0 exercises')).toBeInTheDocument()
    })

    it('should handle missing AMRAP duration', () => {
      const dayWithoutDuration: MilestoneDay = {
        id: 'day-test',
        dayType: 'workout',
        isAmrap: true,
        exercises: [
          {
            id: 'exercise-1',
            exercise: 'exercise-1',
            sets: 1,
            reps: 10,
          },
        ],
        // amrapDuration property intentionally omitted to test undefined case
      }

      mockUseWorkoutStore.mockReturnValue({
        currentRound: 1,
        totalExercisesCompleted: 0,
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={dayWithoutDuration} />)
      expect(screen.getByText('0m Total')).toBeInTheDocument()
      expect(screen.getByText('0m')).toBeInTheDocument() // Time remaining
    })

    it('should handle large numbers of completed exercises', () => {
      mockUseWorkoutStore.mockReturnValue({
        currentRound: 10,
        totalExercisesCompleted: 32, // 10 complete rounds + 2 exercises
        sessionStartTime: Date.now(),
      })

      render(<ExerciseAmrapContext day={mockDay} />)
      expect(screen.getByText('Round 10')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Completed rounds
      expect(screen.getByText('2 of 3 exercises')).toBeInTheDocument()
    })
  })
})
