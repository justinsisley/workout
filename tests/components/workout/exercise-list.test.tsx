import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExerciseList } from '@/components/workout/exercise-list'
import type { DayExercise, Exercise } from '@/types/program'

// Mock the workout store
vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: vi.fn(),
}))

import { useWorkoutStore } from '@/stores/workout-store'
const mockUseWorkoutStore = vi.mocked(useWorkoutStore)

// Mock data
const mockExercise: Exercise = {
  id: 'exercise-1',
  title: 'Push-ups',
  description: 'A basic upper body exercise',
  category: 'Upper Body',
  videoUrl: 'https://youtube.com/watch?v=example',
}

const mockExercises: DayExercise[] = [
  {
    id: 'day-exercise-1',
    exercise: mockExercise,
    sets: 3,
    reps: 10,
    restPeriod: 60,
    weight: 135,
    notes: 'Focus on proper form',
  },
  {
    id: 'day-exercise-2',
    exercise: {
      id: 'exercise-2',
      title: 'Running',
      description: 'Cardio exercise',
      category: 'Cardio',
    },
    sets: 1,
    reps: 0,
    durationValue: 30,
    durationUnit: 'minutes' as const,
    distanceValue: 3,
    distanceUnit: 'miles' as const,
  },
  {
    id: 'day-exercise-3',
    exercise: {
      id: 'exercise-3',
      title: 'Plank',
      description: 'Core strengthening exercise',
      category: 'Core',
    },
    sets: 3,
    reps: 0,
    durationValue: 45,
    durationUnit: 'seconds' as const,
  },
]

describe('ExerciseList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock store state
    mockUseWorkoutStore.mockReturnValue({
      completedExercises: [],
    } as any)
  })

  it('renders exercise list with all exercises', () => {
    render(<ExerciseList exercises={mockExercises} />)

    expect(screen.getByText('Push-ups')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Plank')).toBeInTheDocument()
  })

  it('displays exercise specifications correctly', () => {
    render(<ExerciseList exercises={mockExercises} />)

    // Check sets and reps display
    expect(screen.getByText('3 sets')).toBeInTheDocument()
    expect(screen.getByText('× 10 reps')).toBeInTheDocument()

    // Check weight display
    expect(screen.getByText('@ 135 lbs')).toBeInTheDocument()

    // Check duration formatting
    expect(screen.getByText('30 minutes')).toBeInTheDocument()
    expect(screen.getByText('45 seconds')).toBeInTheDocument()

    // Check distance formatting
    expect(screen.getByText('3 miles')).toBeInTheDocument()
  })

  it('shows rest periods when specified', () => {
    render(<ExerciseList exercises={mockExercises} />)

    expect(screen.getByText('Rest: 60s')).toBeInTheDocument()
  })

  it('displays exercise notes when provided', () => {
    render(<ExerciseList exercises={mockExercises} />)

    expect(screen.getByText('Focus on proper form')).toBeInTheDocument()
  })

  it('displays exercise descriptions when available', () => {
    render(<ExerciseList exercises={mockExercises} />)

    expect(screen.getByText('A basic upper body exercise')).toBeInTheDocument()
    expect(screen.getByText('Cardio exercise')).toBeInTheDocument()
  })

  it('shows completed status for completed exercises', () => {
    // Mock store with completed exercises
    mockUseWorkoutStore.mockReturnValue({
      completedExercises: ['day-exercise-1'],
    } as any)

    render(<ExerciseList exercises={mockExercises} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('handles exercise click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<ExerciseList exercises={mockExercises} />)

    const firstExerciseCard = screen.getByText('Push-ups').closest('div')
    if (firstExerciseCard) {
      fireEvent.click(firstExerciseCard)
      expect(consoleSpy).toHaveBeenCalledWith('Exercise clicked:', 'day-exercise-1')
    }

    consoleSpy.mockRestore()
  })

  it('shows empty state when no exercises provided', () => {
    render(<ExerciseList exercises={[]} />)

    expect(screen.getByText('No exercises found for this day')).toBeInTheDocument()
  })

  it('handles exercises without distance specifications', () => {
    const exercisesWithoutDistance = mockExercises.filter((e) => !e.distanceValue)
    render(<ExerciseList exercises={exercisesWithoutDistance} />)

    // Should not show distance indicators for exercises without distance
    expect(screen.queryByText('3 miles')).not.toBeInTheDocument()
  })

  it('handles exercises without duration specifications', () => {
    const exercisesWithoutDuration = mockExercises.filter((e) => e.id === 'day-exercise-1')
    render(<ExerciseList exercises={exercisesWithoutDuration} />)

    // Should not show duration indicators for exercises without duration
    expect(screen.queryByText('30 minutes')).not.toBeInTheDocument()
    expect(screen.queryByText('45 seconds')).not.toBeInTheDocument()
  })

  it('uses exercise number indexing correctly', () => {
    render(<ExerciseList exercises={mockExercises} />)

    // Check that exercises are numbered starting from 1
    const numberBadges = screen.getAllByText(/^[1-3]$/)
    expect(numberBadges).toHaveLength(3)
    expect(numberBadges[0]).toHaveTextContent('1')
    expect(numberBadges[1]).toHaveTextContent('2')
    expect(numberBadges[2]).toHaveTextContent('3')
  })

  it('applies clickable styles', () => {
    render(<ExerciseList exercises={mockExercises} />)

    const firstCard = screen.getByText('Push-ups').closest('div')
    expect(firstCard).toHaveClass('cursor-pointer')
  })
})
