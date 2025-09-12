import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProgressIndicators } from '@/components/workout/progress-indicators'
import type { MilestoneDay, DayExercise } from '@/types/program'

// Mock the type guards module
vi.mock('@/utils/type-guards', () => ({
  isAmrapDay: vi.fn(),
}))

import { isAmrapDay } from '@/utils/type-guards'

const mockIsAmrapDay = vi.mocked(isAmrapDay)

describe('ProgressIndicators Component', () => {
  const mockExercises: DayExercise[] = [
    {
      id: 'ex1',
      exercise: {
        id: 'exercise-1',
        title: 'Push-ups',
        description: 'Upper body exercise',
        category: 'Strength',
      },
      sets: 3,
      reps: 10,
      restPeriod: 60,
    },
    {
      id: 'ex2',
      exercise: {
        id: 'exercise-2',
        title: 'Squats',
        description: 'Lower body exercise',
        category: 'Strength',
      },
      sets: 3,
      reps: 15,
      restPeriod: 90,
    },
    {
      id: 'ex3',
      exercise: {
        id: 'exercise-3',
        title: 'Planks',
        description: 'Core exercise',
        category: 'Strength',
      },
      sets: 3,
      reps: 1,
      restPeriod: 45,
    },
  ]

  const mockRegularDay: MilestoneDay = {
    id: 'day-1',
    dayType: 'workout',
    exercises: mockExercises,
  }

  const mockAmrapDay: MilestoneDay = {
    id: 'day-2',
    dayType: 'workout',
    isAmrap: true,
    amrapDuration: 20,
    exercises: mockExercises,
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('Regular Workout Day', () => {
    beforeEach(() => {
      mockIsAmrapDay.mockReturnValue(false)
    })

    it('renders day progress for regular workout', () => {
      render(<ProgressIndicators day={mockRegularDay} />)

      expect(screen.getByText('Day Progress')).toBeInTheDocument()
      expect(screen.getByText('Exercise Completion')).toBeInTheDocument()
      expect(screen.getByText('0/3')).toBeInTheDocument()
      expect(screen.getByText('Current Position: 1 of 3')).toBeInTheDocument()
    })

    it('shows completion progress correctly', () => {
      render(
        <ProgressIndicators
          day={mockRegularDay}
          completedExercises={['ex1', 'ex2']}
          currentExerciseIndex={2}
        />,
      )

      expect(screen.getByText('2/3')).toBeInTheDocument()
      expect(screen.getByText('Current Position: 3 of 3')).toBeInTheDocument()
    })

    it('shows day as complete when all exercises are done', () => {
      render(
        <ProgressIndicators
          day={mockRegularDay}
          completedExercises={['ex1', 'ex2', 'ex3']}
          currentExerciseIndex={3}
        />,
      )

      expect(screen.getByText('3/3')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('renders exercise status list correctly', () => {
      render(
        <ProgressIndicators
          day={mockRegularDay}
          completedExercises={['ex1']}
          currentExerciseIndex={1}
        />,
      )

      expect(screen.getByText('Exercise Status')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()
      expect(screen.getByText('Squats')).toBeInTheDocument()
      expect(screen.getByText('Planks')).toBeInTheDocument()

      // Check exercise completion status
      expect(screen.getByText('Done')).toBeInTheDocument() // ex1 is complete
      expect(screen.getByText('Current')).toBeInTheDocument() // ex2 is current
    })

    it('does not show AMRAP progress for regular day', () => {
      render(<ProgressIndicators day={mockRegularDay} />)

      expect(screen.queryByText('AMRAP Progress')).not.toBeInTheDocument()
      expect(screen.queryByText('Current Round Progress')).not.toBeInTheDocument()
    })
  })

  describe('AMRAP Workout Day', () => {
    beforeEach(() => {
      mockIsAmrapDay.mockReturnValue(true)
    })

    it('renders AMRAP day progress correctly', () => {
      render(
        <ProgressIndicators
          day={mockAmrapDay}
          currentRound={2}
          completedExercises={['ex1', 'ex2']}
        />,
      )

      expect(screen.getByText('Day Progress')).toBeInTheDocument()
      expect(screen.getByText('Exercises per Round')).toBeInTheDocument()
      expect(screen.getByText('2/3 (Round 2)')).toBeInTheDocument()
    })

    it('shows AMRAP-specific progress section', () => {
      render(
        <ProgressIndicators
          day={mockAmrapDay}
          currentRound={3}
          currentExerciseIndex={1}
          totalExercisesCompleted={7}
        />,
      )

      expect(screen.getByText('AMRAP Progress')).toBeInTheDocument()
      expect(screen.getByText('Current Round Progress')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()
      expect(screen.getByText('1/3 exercises')).toBeInTheDocument()

      expect(screen.getByText('Completed Rounds')).toBeInTheDocument()
      // Check that the completed rounds value "2" exists (7 exercises / 3 exercises per round = 2 complete rounds)
      const allBadges = screen
        .getAllByRole('generic')
        .filter((el) => el.getAttribute('data-slot') === 'badge')
      const completedRoundsBadge = allBadges.find(
        (badge) => badge.textContent === '2' && badge.classList.contains('bg-green-500'),
      )
      expect(completedRoundsBadge).toBeTruthy()

      expect(screen.getByText('Total Exercises')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('calculates round-based progress correctly', () => {
      render(
        <ProgressIndicators
          day={mockAmrapDay}
          currentRound={1}
          currentExerciseIndex={2}
          totalExercisesCompleted={2}
        />,
      )

      // 2 exercises completed out of 3 = 2/3 current round progress
      expect(screen.getByText('2/3 exercises')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // 0 complete rounds
      // Check that total exercises value "2" exists in a secondary badge
      const allBadges = screen
        .getAllByRole('generic')
        .filter((el) => el.getAttribute('data-slot') === 'badge')
      const totalExercisesBadge = allBadges.find(
        (badge) => badge.textContent === '2' && badge.classList.contains('bg-secondary'),
      )
      expect(totalExercisesBadge).toBeTruthy()
    })
  })

  describe('Session Information', () => {
    beforeEach(() => {
      mockIsAmrapDay.mockReturnValue(false)
    })

    it('shows session duration when provided', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

      render(<ProgressIndicators day={mockRegularDay} sessionStartTime={fiveMinutesAgo} />)

      expect(screen.getByText('Session Info')).toBeInTheDocument()
      expect(screen.getByText('Session Duration')).toBeInTheDocument()
      expect(screen.getByText('5 minutes')).toBeInTheDocument()
    })

    it('shows AMRAP time limit for AMRAP days with session', () => {
      mockIsAmrapDay.mockReturnValue(true)
      const oneMinuteAgo = Date.now() - 1 * 60 * 1000

      render(<ProgressIndicators day={mockAmrapDay} sessionStartTime={oneMinuteAgo} />)

      expect(screen.getByText('Session Duration')).toBeInTheDocument()
      expect(screen.getByText('1 minutes')).toBeInTheDocument()
      expect(screen.getByText('AMRAP Time Limit')).toBeInTheDocument()
      expect(screen.getByText('20 minutes')).toBeInTheDocument()
    })

    it('does not show session info when no start time provided', () => {
      render(<ProgressIndicators day={mockRegularDay} />)

      expect(screen.queryByText('Session Info')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles day with no exercises', () => {
      const emptyDay: MilestoneDay = {
        id: 'empty-day',
        dayType: 'workout',
        exercises: [],
      }

      mockIsAmrapDay.mockReturnValue(false)

      render(<ProgressIndicators day={emptyDay} />)

      expect(screen.getByText('Day Progress')).toBeInTheDocument()
      expect(screen.getByText('0/0')).toBeInTheDocument()
      expect(screen.getByText('Exercise Status')).toBeInTheDocument()
    })

    it('handles exercises with string exercise references', () => {
      const dayWithStringExercises: MilestoneDay = {
        id: 'day-string',
        dayType: 'workout',
        exercises: [
          {
            id: 'ex1',
            exercise: 'exercise-id-1',
            sets: 3,
            reps: 10,
          },
        ],
      }

      mockIsAmrapDay.mockReturnValue(false)

      render(<ProgressIndicators day={dayWithStringExercises} />)

      expect(screen.getByText('Exercise 1')).toBeInTheDocument()
    })

    it('handles undefined exercises array', () => {
      const dayWithoutExercises: MilestoneDay = {
        id: 'no-exercises',
        dayType: 'workout',
      }

      mockIsAmrapDay.mockReturnValue(false)

      render(<ProgressIndicators day={dayWithoutExercises} />)

      expect(screen.getByText('Day Progress')).toBeInTheDocument()
      expect(screen.getByText('0/0')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ProgressIndicators day={mockRegularDay} className="custom-class" />,
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Exercise Status Details', () => {
    beforeEach(() => {
      mockIsAmrapDay.mockReturnValue(false)
    })

    it('shows exercise specifications correctly', () => {
      render(<ProgressIndicators day={mockRegularDay} />)

      // Check that sets and reps are displayed
      expect(screen.getByText('3 sets × 10 reps')).toBeInTheDocument()
      expect(screen.getByText('3 sets × 15 reps')).toBeInTheDocument()
      expect(screen.getByText('3 sets × 1 reps')).toBeInTheDocument()
    })

    it('highlights current exercise correctly', () => {
      render(
        <ProgressIndicators
          day={mockRegularDay}
          currentExerciseIndex={1}
          completedExercises={['ex1']}
        />,
      )

      // First exercise should show as done
      const doneElements = screen.getAllByText('Done')
      expect(doneElements).toHaveLength(1)

      // Second exercise should show as current
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('shows proper exercise numbering', () => {
      render(<ProgressIndicators day={mockRegularDay} />)

      // Should show exercise numbers 1, 2, 3
      const numberElements = screen.getByText('1')
      expect(numberElements).toBeInTheDocument()
    })
  })
})
