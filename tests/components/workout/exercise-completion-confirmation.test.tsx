import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExerciseCompletionConfirmation } from '@/components/workout/exercise-completion-confirmation'
import type { Exercise, DayExercise } from '@/types/program'

// Mock the workout store
const mockUseWorkoutStore = vi.fn()
vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: () => mockUseWorkoutStore(),
}))

// Mock the formatters
vi.mock('@/utils/formatters', () => ({
  formatDistance: vi.fn((value, unit) => `${value} ${unit}`),
  formatDuration: vi.fn((value, unit) => `${value} ${unit}`),
}))

describe('ExerciseCompletionConfirmation', () => {
  const mockExercise: Exercise = {
    id: 'exercise-1',
    title: 'Push-ups',
    description: 'Standard push-up exercise',
    videoUrl: 'https://example.com/pushups',
    category: 'bodyweight',
  }

  const mockExerciseConfig: DayExercise = {
    id: 'config-1',
    exercise: 'exercise-1',
    sets: 3,
    reps: 10,
    weight: 50,
  }

  const mockWorkoutData = {
    sets: 3,
    reps: 10,
    notes: 'Great workout!',
    weight: 50,
    time: 300,
    timeUnit: 'seconds' as const,
  }

  const mockAmrapData = {
    totalRoundsCompleted: 5,
    currentRoundProgress: 2,
    timeTaken: 1200,
    notes: 'Intense AMRAP session',
  }

  const defaultProps = {
    exercise: mockExercise,
    exerciseConfig: mockExerciseConfig,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 3,
    })
  })

  describe('Regular Exercise Confirmation', () => {
    it('renders exercise completion confirmation for regular workout', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={mockWorkoutData} />)

      expect(screen.getByText('Complete Exercise?')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()
      expect(screen.getByText('Mark this exercise as complete?')).toBeInTheDocument()
    })

    it('displays workout data summary correctly', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={mockWorkoutData} />)

      expect(screen.getByText('3')).toBeInTheDocument() // sets
      expect(screen.getByText('10')).toBeInTheDocument() // reps
      expect(screen.getByText('50 lbs')).toBeInTheDocument() // weight
      expect(screen.getByText('300 seconds')).toBeInTheDocument() // time
      expect(screen.getByText('Great workout!')).toBeInTheDocument() // notes
    })

    it('handles distance display when provided', () => {
      const dataWithDistance = {
        ...mockWorkoutData,
        distance: 5000,
        distanceUnit: 'meters' as const,
      }

      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={dataWithDistance} />)

      expect(screen.getByText('5000 meters')).toBeInTheDocument()
    })

    it('hides optional fields when not provided', () => {
      const minimalData = {
        sets: 3,
        reps: 10,
        notes: '',
      }

      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={minimalData} />)

      expect(screen.queryByText(/lbs/)).not.toBeInTheDocument()
      expect(screen.queryByText(/seconds/)).not.toBeInTheDocument()
      expect(screen.queryByText('Notes:')).not.toBeInTheDocument()
    })
  })

  describe('AMRAP Exercise Confirmation', () => {
    it('renders AMRAP-specific confirmation', () => {
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          isAmrap={true}
          amrapData={mockAmrapData}
        />,
      )

      expect(screen.getByText('Complete Exercise?')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()
      expect(
        screen.getByText('Mark this round as complete and continue to next exercise?'),
      ).toBeInTheDocument()
    })

    it('displays AMRAP data summary correctly', () => {
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          isAmrap={true}
          amrapData={mockAmrapData}
        />,
      )

      // More specific assertions for AMRAP data
      expect(screen.getByText('Rounds:')).toBeInTheDocument()
      expect(screen.getByText('1200 seconds')).toBeInTheDocument() // time taken
      expect(screen.getByText('2 exercises')).toBeInTheDocument() // partial progress
      expect(screen.getByText('Intense AMRAP session')).toBeInTheDocument() // notes
    })

    it('displays performance summary for AMRAP', () => {
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          isAmrap={true}
          amrapData={mockAmrapData}
        />,
      )

      expect(screen.getByText('Total rounds (+ partial)')).toBeInTheDocument()
    })

    it('handles AMRAP without partial progress', () => {
      const completeAmrapData = {
        ...mockAmrapData,
        currentRoundProgress: 0,
      }

      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          isAmrap={true}
          amrapData={completeAmrapData}
        />,
      )

      expect(screen.getByText('Total rounds completed')).toBeInTheDocument()
      expect(screen.queryByText('Partial Round:')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn()
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          onCancel={onCancel}
          workoutData={mockWorkoutData}
        />,
      )

      fireEvent.click(screen.getByText('Cancel'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm when complete button is clicked', async () => {
      const onConfirm = vi.fn()
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          onConfirm={onConfirm}
          workoutData={mockWorkoutData}
        />,
      )

      fireEvent.click(screen.getByText('Complete'))
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })

    it('shows loading state during confirmation', async () => {
      const onConfirm = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          onConfirm={onConfirm}
          workoutData={mockWorkoutData}
        />,
      )

      fireEvent.click(screen.getByText('Complete'))

      expect(screen.getByText('Confirming...')).toBeInTheDocument()
      expect(screen.getByText('Confirming completion...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Confirming...')).not.toBeInTheDocument()
      })
    })

    it('disables buttons when loading', () => {
      render(
        <ExerciseCompletionConfirmation
          {...defaultProps}
          workoutData={mockWorkoutData}
          isLoading={true}
        />,
      )

      expect(screen.getByText('Cancel')).toBeDisabled()
      expect(screen.getByText('Complete')).toBeDisabled()
    })
  })

  describe('Mobile-Optimized Design', () => {
    it('renders touch-friendly buttons with correct sizing', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={mockWorkoutData} />)

      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Complete')

      // Check for h-12 class (48px height - meets 44px minimum touch target)
      expect(cancelButton.closest('button')).toHaveClass('h-12')
      expect(confirmButton.closest('button')).toHaveClass('h-12')
    })

    it('uses appropriate visual hierarchy with icons', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={mockWorkoutData} />)

      // Check for icons in the summary
      expect(screen.getByText('Sets:')).toBeInTheDocument()
      expect(screen.getByText('Reps:')).toBeInTheDocument()
      expect(screen.getByText('Weight:')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing workout data gracefully', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} />)

      expect(screen.getByText('Complete Exercise?')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()
    })

    it('handles missing AMRAP data gracefully', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} isAmrap={true} />)

      expect(screen.getByText('Complete Exercise?')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides appropriate ARIA labels and semantic structure', () => {
      render(<ExerciseCompletionConfirmation {...defaultProps} workoutData={mockWorkoutData} />)

      // Check for dialog content structure
      expect(screen.getByText('Complete Exercise?')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()

      // Check for buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
    })
  })
})
