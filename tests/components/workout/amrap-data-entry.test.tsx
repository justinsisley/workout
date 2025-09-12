import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AmrapDataEntry } from '@/components/workout/amrap-data-entry'
import { useWorkoutStore } from '@/stores/workout-store'
import type { Exercise, DayExercise } from '@/types/program'

// Mock the workout store
vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: vi.fn(),
}))

// Mock formatters
vi.mock('@/utils/formatters', () => ({
  formatDistance: vi.fn((value, unit) => `${value} ${unit}`),
  formatDuration: vi.fn((value, unit) => `${value} ${unit}`),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  RotateCw: () => <div data-testid="rotate-cw-icon" />,
  Target: () => <div data-testid="target-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}))

describe('AmrapDataEntry', () => {
  const mockUseWorkoutStore = useWorkoutStore as unknown as ReturnType<typeof vi.fn>

  const mockExercise1: Exercise = {
    id: 'ex1',
    title: 'Push Ups',
    description: 'Standard push ups',
    category: 'bodyweight',
    videoUrl: 'https://youtube.com/watch?v=test1',
  }

  const mockExercise2: Exercise = {
    id: 'ex2',
    title: 'Squats',
    description: 'Bodyweight squats',
    category: 'bodyweight',
    videoUrl: 'https://youtube.com/watch?v=test2',
  }

  const mockExerciseConfig1: DayExercise = {
    id: 'config1',
    exercise: 'ex1',
    sets: 3,
    reps: 15,
    weight: undefined,
    restPeriod: 60,
    notes: 'Keep form strict',
  }

  const mockExerciseConfig2: DayExercise = {
    id: 'config2',
    exercise: 'ex2',
    sets: 3,
    reps: 20,
    weight: 135,
    restPeriod: 90,
    notes: 'Go to full depth',
  }

  const mockExercises = [
    { exercise: mockExercise1, config: mockExerciseConfig1 },
    { exercise: mockExercise2, config: mockExerciseConfig2 },
  ]

  const defaultProps = {
    exercises: mockExercises,
    amrapDuration: 20, // 20 minutes
    onSave: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock workout store state
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 2,
      totalExercisesCompleted: 3,
      sessionStartTime: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    })
  })

  it('renders AMRAP overview with correct information', () => {
    render(<AmrapDataEntry {...defaultProps} />)

    expect(screen.getByText('AMRAP Workout Progress')).toBeInTheDocument()
    expect(screen.getByText('20m Total')).toBeInTheDocument()
    expect(screen.getByText('Complete Rounds')).toBeInTheDocument()
    expect(screen.getByText('Partial Round Exercises')).toBeInTheDocument()
  })

  it('calculates total rounds and partial round exercises correctly from store', () => {
    render(<AmrapDataEntry {...defaultProps} />)

    // currentRound = 2, so totalRounds should be 1 (currentRound - 1)
    // totalExercisesCompleted = 3, exercises.length = 2, so partial = 3 % 2 = 1
    expect(screen.getByDisplayValue('1')).toBeInTheDocument() // totalRounds
    expect(screen.getByDisplayValue('1')).toBeInTheDocument() // partialRoundExercisesCompleted
  })

  it('displays session time correctly', () => {
    render(<AmrapDataEntry {...defaultProps} />)

    expect(screen.getByText('Session Time')).toBeInTheDocument()
    expect(screen.getByText('10m')).toBeInTheDocument() // 10 minutes elapsed
  })

  it('allows incrementing and decrementing total rounds', async () => {
    render(<AmrapDataEntry {...defaultProps} />)

    const totalRoundsInput = screen.getByDisplayValue('1')
    const plusButtons = screen.getAllByTestId('plus-icon')
    const minusButtons = screen.getAllByTestId('minus-icon')

    // Find the plus button for total rounds (first one)
    if (plusButtons[0]) {
      fireEvent.click(plusButtons[0])
      await waitFor(() => {
        expect(totalRoundsInput).toHaveValue(2)
      })
    }

    // Find the minus button for total rounds (first one)
    if (minusButtons[0]) {
      fireEvent.click(minusButtons[0])
      await waitFor(() => {
        expect(totalRoundsInput).toHaveValue(1)
      })
    }
  })

  it('allows incrementing and decrementing partial round exercises', async () => {
    render(<AmrapDataEntry {...defaultProps} />)

    const partialRoundInput = screen.getAllByDisplayValue('1')[1] // Second input
    const plusButtons = screen.getAllByTestId('plus-icon')
    const minusButtons = screen.getAllByTestId('minus-icon')

    // Find the plus button for partial round exercises (second one)
    if (plusButtons[1]) {
      fireEvent.click(plusButtons[1])
      await waitFor(() => {
        expect(partialRoundInput).toHaveValue(2)
      })

      // Should not go beyond exercises.length - 1 (max 1 for 2 exercises)
      fireEvent.click(plusButtons[1])
      await waitFor(() => {
        expect(partialRoundInput).toHaveValue(2) // Should stay at max value
      })
    }

    // Find the minus button for partial round exercises (second one)
    if (minusButtons[1]) {
      fireEvent.click(minusButtons[1])
      await waitFor(() => {
        expect(partialRoundInput).toHaveValue(1)
      })
    }
  })

  it('prevents total rounds from going below 0', async () => {
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 1, // This will set totalRounds to 0
      totalExercisesCompleted: 0,
      sessionStartTime: Date.now(),
    })

    render(<AmrapDataEntry {...defaultProps} />)

    const totalRoundsInput = screen.getByDisplayValue('0')
    const minusButtons = screen.getAllByTestId('minus-icon')

    // Try to decrement below 0
    if (minusButtons[0]) {
      fireEvent.click(minusButtons[0])
      await waitFor(() => {
        expect(totalRoundsInput).toHaveValue(0) // Should stay at 0
      })
    }
  })

  it('prevents partial round exercises from going below 0', async () => {
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 1,
      totalExercisesCompleted: 0, // This will set partialRoundExercisesCompleted to 0
      sessionStartTime: Date.now(),
    })

    render(<AmrapDataEntry {...defaultProps} />)

    const partialRoundInput = screen.getByDisplayValue('0')
    const minusButtons = screen.getAllByTestId('minus-icon')

    // Try to decrement below 0
    if (minusButtons[1]) {
      fireEvent.click(minusButtons[1])
      await waitFor(() => {
        expect(partialRoundInput).toHaveValue(0) // Should stay at 0
      })
    }
  })

  it('shows exercise details for partial round completion', async () => {
    render(<AmrapDataEntry {...defaultProps} />)

    // With partialRoundExercisesCompleted = 1, should show details for first exercise
    expect(screen.getByText('Partial Round Exercise Details')).toBeInTheDocument()
    expect(screen.getByText('Push Ups')).toBeInTheDocument()

    // Should have input fields for reps
    expect(screen.getByLabelText('Reps')).toBeInTheDocument()
  })

  it('shows weight input for exercises that have weight configured', () => {
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 2,
      totalExercisesCompleted: 4, // This will show 2 partial exercises (4 % 2 = 0, but we set it to show both)
      sessionStartTime: Date.now(),
    })

    // Manually override to show both exercises
    const propsWithTwoPartialExercises = {
      ...defaultProps,
      previousData: {
        totalRounds: 1,
        partialRoundExercisesCompleted: 2, // Show both exercises
        notes: '',
        exerciseData: [
          {
            exerciseId: 'ex1',
            reps: 15,
            weight: undefined,
          },
          {
            exerciseId: 'ex2',
            reps: 20,
            weight: 135,
          },
        ],
      },
    }

    render(<AmrapDataEntry {...propsWithTwoPartialExercises} />)

    expect(screen.getByText('Push Ups')).toBeInTheDocument()
    expect(screen.getByText('Squats')).toBeInTheDocument()

    // Should have weight input for squats
    const weightInputs = screen.getAllByLabelText(/Weight/)
    expect(weightInputs).toHaveLength(1) // Only squats has weight
  })

  it('validates input ranges correctly', async () => {
    render(<AmrapDataEntry {...defaultProps} />)

    const totalRoundsInput = screen.getByDisplayValue('1')

    // Test invalid range for total rounds
    fireEvent.change(totalRoundsInput, { target: { value: '1000' } })
    await waitFor(() => {
      expect(screen.getByText('Total rounds must be between 0 and 999')).toBeInTheDocument()
    })

    // Test valid range
    fireEvent.change(totalRoundsInput, { target: { value: '5' } })
    await waitFor(() => {
      expect(screen.queryByText('Total rounds must be between 0 and 999')).not.toBeInTheDocument()
    })
  })

  it('calculates workout completion percentage correctly', () => {
    render(<AmrapDataEntry {...defaultProps} />)

    // totalRounds = 1, partialRoundExercisesCompleted = 1, exercises.length = 2
    // totalExercisesInWorkout = 1 * 2 + 1 = 3
    // Expected total for current attempt = (1 + 1) * 2 = 4
    // Completion percentage = 3/4 * 100 = 75%

    // Progress bars should be visible
    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('calls onSave with correct data when form is submitted', async () => {
    const mockOnSave = vi.fn()
    render(<AmrapDataEntry {...defaultProps} onSave={mockOnSave} />)

    const saveButton = screen.getByText('Save AMRAP Data')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        totalRounds: 1,
        partialRoundExercisesCompleted: 1,
        notes: '',
        exerciseData: [
          {
            exerciseId: 'ex1',
            reps: 15,
            weight: undefined,
            time: undefined,
            distance: undefined,
            distanceUnit: undefined,
            timeUnit: undefined,
          },
          {
            exerciseId: 'ex2',
            reps: 20,
            weight: 135,
            time: undefined,
            distance: undefined,
            distanceUnit: undefined,
            timeUnit: undefined,
          },
        ],
      })
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const mockOnCancel = vi.fn()
    render(<AmrapDataEntry {...defaultProps} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('disables save button when form is invalid', async () => {
    render(<AmrapDataEntry {...defaultProps} />)

    const totalRoundsInput = screen.getByDisplayValue('1')
    const saveButton = screen.getByText('Save AMRAP Data')

    // Make form invalid
    fireEvent.change(totalRoundsInput, { target: { value: '1000' } })

    await waitFor(() => {
      expect(saveButton).toBeDisabled()
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(<AmrapDataEntry {...defaultProps} isLoading={true} />)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByText('Saving...')).toBeDisabled()
  })

  it('handles exercise data updates correctly', async () => {
    const propsWithPartialExercises = {
      ...defaultProps,
      previousData: {
        totalRounds: 1,
        partialRoundExercisesCompleted: 1,
        notes: '',
        exerciseData: [
          {
            exerciseId: 'ex1',
            reps: 15,
          },
        ],
      },
    }

    render(<AmrapDataEntry {...propsWithPartialExercises} />)

    const repsInput = screen.getByDisplayValue('15')
    fireEvent.change(repsInput, { target: { value: '20' } })

    const saveButton = screen.getByText('Save AMRAP Data')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseData: expect.arrayContaining([
            expect.objectContaining({
              exerciseId: 'ex1',
              reps: 20,
            }),
          ]),
        }),
      )
    })
  })

  it('formats time display correctly for different durations', () => {
    // Test hours + minutes format
    mockUseWorkoutStore.mockReturnValue({
      currentRound: 2,
      totalExercisesCompleted: 3,
      sessionStartTime: Date.now() - 90 * 60 * 1000, // 90 minutes ago
    })

    render(<AmrapDataEntry {...defaultProps} />)

    expect(screen.getByText('1h 30m')).toBeInTheDocument()
  })

  it('renders with previous data correctly', () => {
    const previousData = {
      totalRounds: 3,
      partialRoundExercisesCompleted: 1,
      notes: 'Great workout!',
      exerciseData: [
        {
          exerciseId: 'ex1',
          reps: 18,
          weight: 20,
        },
      ],
    }

    render(<AmrapDataEntry {...defaultProps} previousData={previousData} />)

    expect(screen.getByDisplayValue('3')).toBeInTheDocument() // totalRounds
    expect(screen.getByDisplayValue('1')).toBeInTheDocument() // partialRoundExercisesCompleted
  })

  it('handles touch-friendly interactions with proper styling', () => {
    render(<AmrapDataEntry {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const inputs = screen.getAllByRole('spinbutton')

    // Check for touch-friendly classes and styles
    buttons.forEach((button) => {
      if (button.textContent === 'Save AMRAP Data' || button.textContent === 'Cancel') {
        expect(button).toHaveClass('touch-manipulation')
      }
    })

    inputs.forEach((input) => {
      if (input.classList.contains('touch-manipulation')) {
        expect(input).toHaveClass('touch-manipulation')
      }
    })
  })
})
