import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DayOverview } from '@/components/workout/day-overview'
import type { MilestoneDay, DayExercise, Exercise } from '@/types/program'

// Mock the workout store
vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: vi.fn(),
}))

import { useWorkoutStore } from '@/stores/workout-store'
const mockUseWorkoutStore = vi.mocked(useWorkoutStore)

describe('DayOverview', () => {
  const mockOnStartWorkout = vi.fn()

  const mockExercise: Exercise = {
    id: 'ex1',
    title: 'Push-ups',
    description: 'Standard push-ups',
    videoUrl: 'https://youtube.com/watch?v=example',
    category: 'strength',
  }

  const mockDayExercise: DayExercise = {
    id: 'dayex1',
    exercise: mockExercise,
    sets: 3,
    reps: 10,
    restPeriod: 60,
  }

  const mockWorkoutDay: MilestoneDay = {
    id: 'day1',
    dayType: 'workout',
    exercises: [mockDayExercise],
    isAmrap: false,
  }

  const mockAmrapDay: MilestoneDay = {
    id: 'day2',
    dayType: 'workout',
    exercises: [mockDayExercise],
    isAmrap: true,
    amrapDuration: 20,
  }

  const mockRestDay: MilestoneDay = {
    id: 'day3',
    dayType: 'rest',
    isAmrap: false,
    restNotes: 'Focus on stretching and recovery',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock store state
    mockUseWorkoutStore.mockReturnValue({
      completedExercises: [],
      currentRound: 1,
      // Add any other store methods that might be needed
    } as any)
  })

  describe('Regular Workout Day', () => {
    it('renders workout day with exercises', () => {
      render(
        <DayOverview
          day={mockWorkoutDay}
          dayNumber={1}
          milestoneName="Foundation"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Day 1')).toBeInTheDocument()
      expect(screen.getByText('Foundation')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()
      expect(screen.getByText('3 sets × 10 reps')).toBeInTheDocument()
    })

    it('displays progress indicators correctly', () => {
      // Mock store with completed exercises
      mockUseWorkoutStore.mockReturnValue({
        completedExercises: ['dayex1'],
        currentRound: 1,
      } as any)

      render(
        <DayOverview
          day={mockWorkoutDay}
          dayNumber={1}
          milestoneName="Foundation"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Exercises (1/1)')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('calls onStartWorkout when start button is clicked', () => {
      render(
        <DayOverview
          day={mockWorkoutDay}
          dayNumber={1}
          milestoneName="Foundation"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      const startButton = screen.getByRole('button', { name: /start workout/i })
      fireEvent.click(startButton)

      expect(mockOnStartWorkout).toHaveBeenCalledTimes(1)
    })

    it('estimates total duration for workout', () => {
      render(
        <DayOverview
          day={mockWorkoutDay}
          dayNumber={1}
          milestoneName="Foundation"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText(/Est\./)).toBeInTheDocument()
    })
  })

  describe('AMRAP Day', () => {
    it('displays AMRAP badge and duration', () => {
      render(
        <DayOverview
          day={mockAmrapDay}
          dayNumber={2}
          milestoneName="Endurance"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('AMRAP')).toBeInTheDocument()
      expect(screen.getByText('20 minutes')).toBeInTheDocument()
      expect(screen.getByText(/complete all exercises then repeat/i)).toBeInTheDocument()
    })

    it('shows current round for AMRAP workout', () => {
      // Mock store with current round
      mockUseWorkoutStore.mockReturnValue({
        completedExercises: [],
        currentRound: 3,
      } as any)

      render(
        <DayOverview
          day={mockAmrapDay}
          dayNumber={2}
          milestoneName="Endurance"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Round 3')).toBeInTheDocument()
    })

    it('starts timer when workout begins for AMRAP', async () => {
      render(
        <DayOverview
          day={mockAmrapDay}
          dayNumber={2}
          milestoneName="Endurance"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      const startButton = screen.getByRole('button', { name: /start workout/i })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Time Remaining')).toBeInTheDocument()
      })

      expect(mockOnStartWorkout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Rest Day', () => {
    it('displays rest day information', () => {
      render(
        <DayOverview
          day={mockRestDay}
          dayNumber={3}
          milestoneName="Recovery"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Rest Day')).toBeInTheDocument()
      expect(screen.getByText('Rest and Recovery')).toBeInTheDocument()
      expect(screen.getByText('Focus on stretching and recovery')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /start workout/i })).not.toBeInTheDocument()
    })
  })

  describe('Exercise with Duration and Distance', () => {
    it('displays exercises with duration specifications', () => {
      const exerciseWithDuration: DayExercise = {
        ...mockDayExercise,
        id: 'dayex2',
        durationValue: 30,
        durationUnit: 'seconds',
      }

      const dayWithDuration: MilestoneDay = {
        ...mockWorkoutDay,
        exercises: [exerciseWithDuration],
      }

      render(
        <DayOverview
          day={dayWithDuration}
          dayNumber={1}
          milestoneName="Timed"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('3 sets × 10 reps')).toBeInTheDocument()
    })

    it('displays exercises with distance specifications', () => {
      const exerciseWithDistance: DayExercise = {
        ...mockDayExercise,
        id: 'dayex3',
        distanceValue: 400,
        distanceUnit: 'meters',
      }

      const dayWithDistance: MilestoneDay = {
        ...mockWorkoutDay,
        exercises: [exerciseWithDistance],
      }

      render(
        <DayOverview
          day={dayWithDistance}
          dayNumber={1}
          milestoneName="Distance"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('3 sets × 10 reps')).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    it('shows no progress for empty exercise list', () => {
      const emptyDay: MilestoneDay = {
        ...mockWorkoutDay,
        exercises: [],
      }

      render(
        <DayOverview
          day={emptyDay}
          dayNumber={1}
          milestoneName="Empty"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Exercises (0/0)')).toBeInTheDocument()
    })

    it('shows partial progress correctly', () => {
      const multiExerciseDay: MilestoneDay = {
        ...mockWorkoutDay,
        exercises: [
          mockDayExercise,
          { ...mockDayExercise, id: 'dayex2' },
          { ...mockDayExercise, id: 'dayex3' },
        ],
      }

      // Mock store with partial completion
      mockUseWorkoutStore.mockReturnValue({
        completedExercises: ['dayex1', 'dayex2'],
        currentRound: 1,
      } as any)

      render(
        <DayOverview
          day={multiExerciseDay}
          dayNumber={1}
          milestoneName="Multi"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      expect(screen.getByText('Exercises (2/3)')).toBeInTheDocument()
    })
  })

  describe('AMRAP Timer', () => {
    it('shows timer when AMRAP workout starts', async () => {
      render(
        <DayOverview
          day={mockAmrapDay}
          dayNumber={2}
          milestoneName="Endurance"
          onStartWorkout={mockOnStartWorkout}
        />,
      )

      const startButton = screen.getByRole('button', { name: /start workout/i })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Time Remaining')).toBeInTheDocument()
      })

      expect(screen.getByText('20:00')).toBeInTheDocument()
      expect(mockOnStartWorkout).toHaveBeenCalledTimes(1)
    })
  })
})
