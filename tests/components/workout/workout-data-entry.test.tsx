import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  WorkoutDataEntry,
  type WorkoutDataEntryData,
} from '@/components/workout/workout-data-entry'
import type { Exercise, DayExercise } from '@/types/program'

// Mock exercise data for testing
const mockExercise: Exercise = {
  id: 'ex1',
  title: 'Push-ups',
  description: 'Classic bodyweight exercise',
  category: 'bodyweight',
}

const mockExerciseConfig: DayExercise = {
  id: 'config1',
  exercise: 'ex1',
  sets: 3,
  reps: 12,
  weight: 25,
  durationValue: 30,
  durationUnit: 'seconds',
  distanceValue: 1,
  distanceUnit: 'miles',
}

const mockPreviousData: WorkoutDataEntryData = {
  sets: 4,
  reps: 15,
  weight: 30,
  time: 45,
  distance: 1.5,
  distanceUnit: 'miles',
  timeUnit: 'seconds',
}

describe('WorkoutDataEntry', () => {
  const defaultProps = {
    exercise: mockExercise,
    exerciseConfig: mockExerciseConfig,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders exercise title and target information', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      expect(screen.getByText('Push-ups')).toBeInTheDocument()
      expect(screen.getByText('Target: 3 sets × 12 reps')).toBeInTheDocument()
      expect(screen.getByText('Weight: 25 lbs')).toBeInTheDocument()
      expect(screen.getByText('Duration: 30 seconds')).toBeInTheDocument()
      expect(screen.getByText('Distance: 1 mile')).toBeInTheDocument()
    })

    it('renders all required input fields', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      expect(screen.getByLabelText('Sets')).toBeInTheDocument()
      expect(screen.getByLabelText('Reps')).toBeInTheDocument()
      expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument()
      expect(screen.getByLabelText(/Time/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Distance/)).toBeInTheDocument()
    })

    it('renders save and cancel buttons', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      expect(screen.getByText('Save Exercise Data')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Mobile Optimization', () => {
    it('applies touch-friendly input styling with minimum 44px height', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const setsInput = screen.getByLabelText('Sets')
      const repsInput = screen.getByLabelText('Reps')
      const saveButton = screen.getByText('Save Exercise Data')

      // Check for touch-manipulation class
      expect(setsInput).toHaveClass('touch-manipulation')
      expect(repsInput).toHaveClass('touch-manipulation')
      expect(saveButton).toHaveClass('touch-manipulation')

      // Check for minimum height styling
      expect(setsInput).toHaveStyle({ minHeight: '44px' })
      expect(repsInput).toHaveStyle({ minHeight: '44px' })
      expect(saveButton).toHaveStyle({ minHeight: '44px' })
    })

    it('uses numeric input modes for touch keyboards', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const setsInput = screen.getByLabelText('Sets')
      const repsInput = screen.getByLabelText('Reps')
      const weightInput = screen.getByLabelText('Weight (lbs)')

      expect(setsInput).toHaveAttribute('inputMode', 'numeric')
      expect(repsInput).toHaveAttribute('inputMode', 'numeric')
      expect(weightInput).toHaveAttribute('inputMode', 'decimal')
    })
  })

  describe('Auto-population and Smart Defaults', () => {
    it('pre-fills inputs with exercise config values when no previous data', () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      expect(screen.getByDisplayValue('3')).toBeInTheDocument() // sets
      expect(screen.getByDisplayValue('12')).toBeInTheDocument() // reps
      expect(screen.getByDisplayValue('25')).toBeInTheDocument() // weight
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // time
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // distance
    })

    it('pre-fills inputs with previous data when provided', () => {
      render(<WorkoutDataEntry {...defaultProps} previousData={mockPreviousData} />)

      expect(screen.getByDisplayValue('4')).toBeInTheDocument() // sets
      expect(screen.getByDisplayValue('15')).toBeInTheDocument() // reps
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // weight
      expect(screen.getByDisplayValue('45')).toBeInTheDocument() // time
      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument() // distance
    })
  })

  describe('Natural Format Display', () => {
    it('displays natural format for time values', () => {
      render(<WorkoutDataEntry {...defaultProps} previousData={mockPreviousData} />)

      // Change time input to trigger display update
      const timeInput = screen.getByLabelText(/Time/)
      fireEvent.change(timeInput, { target: { value: '60' } })

      expect(screen.getByText('60 seconds')).toBeInTheDocument()
    })

    it('displays natural format for distance values', () => {
      render(<WorkoutDataEntry {...defaultProps} previousData={mockPreviousData} />)

      // Change distance input to trigger display update
      const distanceInput = screen.getByLabelText(/Distance/)
      fireEvent.change(distanceInput, { target: { value: '2' } })

      expect(screen.getByText('2 miles')).toBeInTheDocument()
    })
  })

  describe('Data Validation', () => {
    it('validates sets are within reasonable range (1-99)', async () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const setsInput = screen.getByLabelText('Sets')

      // Test invalid low value
      fireEvent.change(setsInput, { target: { value: '0' } })
      await waitFor(() => {
        expect(screen.getByText('Sets must be between 1 and 99')).toBeInTheDocument()
      })

      // Test invalid high value
      fireEvent.change(setsInput, { target: { value: '100' } })
      await waitFor(() => {
        expect(screen.getByText('Sets must be between 1 and 99')).toBeInTheDocument()
      })
    })

    it('validates reps are within reasonable range (1-999)', async () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const repsInput = screen.getByLabelText('Reps')

      // Test invalid low value
      fireEvent.change(repsInput, { target: { value: '0' } })
      await waitFor(() => {
        expect(screen.getByText('Reps must be between 1 and 999')).toBeInTheDocument()
      })

      // Test invalid high value
      fireEvent.change(repsInput, { target: { value: '1000' } })
      await waitFor(() => {
        expect(screen.getByText('Reps must be between 1 and 999')).toBeInTheDocument()
      })
    })

    it('validates weight is within reasonable range (0-1000)', async () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const weightInput = screen.getByLabelText('Weight (lbs)')

      // Test invalid high value
      fireEvent.change(weightInput, { target: { value: '1001' } })
      await waitFor(() => {
        expect(screen.getByText('Weight must be between 0 and 1000 lbs')).toBeInTheDocument()
      })
    })

    it('disables save button when validation errors exist', async () => {
      render(<WorkoutDataEntry {...defaultProps} />)

      const setsInput = screen.getByLabelText('Sets')
      const saveButton = screen.getByText('Save Exercise Data')

      // Create validation error
      fireEvent.change(setsInput, { target: { value: '0' } })

      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onSave with correct data when form is submitted', async () => {
      const onSave = vi.fn()
      render(<WorkoutDataEntry {...defaultProps} onSave={onSave} />)

      const setsInput = screen.getByLabelText('Sets')
      const repsInput = screen.getByLabelText('Reps')
      const saveButton = screen.getByText('Save Exercise Data')

      // Change some values
      fireEvent.change(setsInput, { target: { value: '5' } })
      fireEvent.change(repsInput, { target: { value: '10' } })

      // Submit form
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          sets: 5,
          reps: 10,
          weight: 25,
          time: 30,
          distance: 1,
          distanceUnit: 'miles',
          timeUnit: 'seconds',
          notes: '',
        })
      })
    })

    it('prevents submission when validation errors exist', async () => {
      const onSave = vi.fn()
      const { container } = render(<WorkoutDataEntry {...defaultProps} onSave={onSave} />)

      const setsInput = screen.getByLabelText('Sets')
      const form = container.querySelector('form')!

      // Create validation error
      fireEvent.change(setsInput, { target: { value: '0' } })

      // Try to submit form
      fireEvent.submit(form)

      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn()
      render(<WorkoutDataEntry {...defaultProps} onCancel={onCancel} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('disables form and shows loading text when isLoading is true', () => {
      render(<WorkoutDataEntry {...defaultProps} isLoading={true} />)

      const saveButton = screen.getByText('Saving...')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Conditional Field Display', () => {
    it('only shows weight field when exercise config includes weight', () => {
      const configWithoutWeight: DayExercise = {
        id: 'config1',
        exercise: 'ex1',
        sets: 3,
        reps: 12,
        // weight omitted intentionally
        durationValue: 30,
        durationUnit: 'seconds',
        distanceValue: 1,
        distanceUnit: 'miles',
      }
      render(<WorkoutDataEntry {...defaultProps} exerciseConfig={configWithoutWeight} />)

      expect(screen.queryByLabelText('Weight (lbs)')).not.toBeInTheDocument()
    })

    it('only shows time field when exercise config includes duration', () => {
      const configWithoutDuration: DayExercise = {
        id: 'config1',
        exercise: 'ex1',
        sets: 3,
        reps: 12,
        weight: 25,
        // durationValue and durationUnit omitted intentionally
        distanceValue: 1,
        distanceUnit: 'miles',
      }
      render(<WorkoutDataEntry {...defaultProps} exerciseConfig={configWithoutDuration} />)

      expect(screen.queryByLabelText(/Time/)).not.toBeInTheDocument()
    })

    it('only shows distance field when exercise config includes distance', () => {
      const configWithoutDistance: DayExercise = {
        id: 'config1',
        exercise: 'ex1',
        sets: 3,
        reps: 12,
        weight: 25,
        durationValue: 30,
        durationUnit: 'seconds',
        // distanceValue and distanceUnit omitted intentionally
      }
      render(<WorkoutDataEntry {...defaultProps} exerciseConfig={configWithoutDistance} />)

      expect(screen.queryByLabelText(/Distance/)).not.toBeInTheDocument()
    })
  })
})
