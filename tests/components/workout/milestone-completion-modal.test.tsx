import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MilestoneCompletionModal } from '@/components/workout/milestone-completion-modal'
import type { ProgramMilestone } from '@/types/program'

// Mock the formatters utility
vi.mock('@/utils/formatters', () => ({
  formatDuration: vi.fn((ms: number) => `${Math.floor(ms / 60000)}min`),
}))

const mockMilestone: ProgramMilestone = {
  id: 'milestone-1',
  name: 'Foundation Phase',
  theme: 'Foundation Theme',
  objective: 'Building basic strength',
  days: [
    {
      id: 'day-1',
      dayType: 'workout' as const,
      exercises: [],
    },
    {
      id: 'day-2',
      dayType: 'workout' as const,
      exercises: [],
    },
    {
      id: 'day-3',
      dayType: 'rest' as const,
      restNotes: 'Complete rest day',
    },
  ],
}

const mockNextMilestone: ProgramMilestone = {
  id: 'milestone-2',
  name: 'Strength Building',
  theme: 'Strength Theme',
  objective: 'Intermediate strength development',
  days: [
    {
      id: 'day-4',
      dayType: 'workout' as const,
      exercises: [],
    },
  ],
}

const defaultProps = {
  completedMilestone: mockMilestone,
  nextMilestone: {
    milestone: mockNextMilestone,
    milestoneIndex: 1,
  },
  milestoneStats: {
    totalDays: 3,
    completedDays: 3,
    completionPercentage: 100,
    isLastMilestone: false,
  },
  programStats: {
    totalWorkoutsCompleted: 12,
    totalTimeSpent: 3600000, // 1 hour
    programName: 'Strength Training Program',
  },
  onAdvanceToNextMilestone: vi.fn(),
  onFinishProgram: vi.fn(),
  onViewProgress: vi.fn(),
  isProgramComplete: false,
}

describe('MilestoneCompletionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Milestone Completion (Not Program Complete)', () => {
    it('renders milestone completion celebration correctly', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      expect(screen.getByText('Milestone Achieved!')).toBeInTheDocument()
      expect(screen.getByText('You\'ve completed "Foundation Phase"')).toBeInTheDocument()
      expect(screen.getByText('Milestone Champion')).toBeInTheDocument()
    })

    it('displays milestone statistics correctly', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      expect(screen.getByText('3')).toBeInTheDocument() // completed days
      expect(screen.getByText('3')).toBeInTheDocument() // total days
      expect(screen.getByText('100% Complete')).toBeInTheDocument()
    })

    it('shows program stats when provided', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      // Stats should be hidden initially
      expect(screen.queryByText('12')).not.toBeInTheDocument()

      // Click to show details
      fireEvent.click(screen.getByText('Show Details'))

      expect(screen.getByText('12')).toBeInTheDocument() // workouts completed
      expect(screen.getByText('60min')).toBeInTheDocument() // formatted time
    })

    it('displays next milestone information', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      expect(screen.getByText('Next Challenge')).toBeInTheDocument()
      expect(screen.getByText('Ready to tackle "Strength Building"?')).toBeInTheDocument()
      expect(screen.getByText('New exercises and challenges await!')).toBeInTheDocument()
    })

    it('calls onAdvanceToNextMilestone when advance button is clicked', async () => {
      const onAdvanceToNextMilestone = vi.fn()
      render(
        <MilestoneCompletionModal
          {...defaultProps}
          onAdvanceToNextMilestone={onAdvanceToNextMilestone}
        />,
      )

      fireEvent.click(screen.getByText('Continue to Next Milestone'))

      await waitFor(() => {
        expect(onAdvanceToNextMilestone).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onViewProgress when view progress button is clicked', async () => {
      const onViewProgress = vi.fn()
      render(<MilestoneCompletionModal {...defaultProps} onViewProgress={onViewProgress} />)

      fireEvent.click(screen.getByText('View Progress'))

      await waitFor(() => {
        expect(onViewProgress).toHaveBeenCalledTimes(1)
      })
    })

    it('disables advance button when loading', () => {
      render(<MilestoneCompletionModal {...defaultProps} isLoading={true} />)

      const advanceButton = screen.getByText('Advancing...')
      expect(advanceButton).toBeDisabled()
    })

    it('disables advance button when no next milestone', () => {
      render(<MilestoneCompletionModal {...defaultProps} nextMilestone={null} />)

      const advanceButton = screen.getByText('Continue to Next Milestone')
      expect(advanceButton).toBeDisabled()
    })
  })

  describe('Program Completion', () => {
    const programCompleteProps = {
      ...defaultProps,
      isProgramComplete: true,
      milestoneStats: {
        ...defaultProps.milestoneStats,
        isLastMilestone: true,
      },
      nextMilestone: null,
    }

    it('renders program completion celebration correctly', () => {
      render(<MilestoneCompletionModal {...programCompleteProps} />)

      expect(screen.getByText('Program Complete!')).toBeInTheDocument()
      expect(
        screen.getByText('Congratulations on finishing your entire program!'),
      ).toBeInTheDocument()
      expect(screen.getByText('Program Master')).toBeInTheDocument()
    })

    it('shows program completion actions', () => {
      render(<MilestoneCompletionModal {...programCompleteProps} />)

      expect(screen.getByText('Finish Program')).toBeInTheDocument()
      expect(screen.getByText('View Full Progress')).toBeInTheDocument()
      expect(screen.queryByText('Continue to Next Milestone')).not.toBeInTheDocument()
    })

    it('calls onFinishProgram when finish button is clicked', async () => {
      const onFinishProgram = vi.fn()
      render(
        <MilestoneCompletionModal {...programCompleteProps} onFinishProgram={onFinishProgram} />,
      )

      fireEvent.click(screen.getByText('Finish Program'))

      await waitFor(() => {
        expect(onFinishProgram).toHaveBeenCalledTimes(1)
      })
    })

    it('displays program completion motivational message', () => {
      render(<MilestoneCompletionModal {...programCompleteProps} />)

      expect(screen.getByText("You've accomplished something amazing! 🎉")).toBeInTheDocument()
    })

    it('does not show next milestone section when program is complete', () => {
      render(<MilestoneCompletionModal {...programCompleteProps} />)

      expect(screen.queryByText('Next Challenge')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility and Mobile Optimization', () => {
    it('has proper ARIA labels and structure', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      // Check for heading structure
      expect(screen.getByRole('heading', { name: /milestone achieved/i })).toBeInTheDocument()

      // Check for buttons with accessible text
      const advanceButton = screen.getByRole('button', { name: /continue to next milestone/i })
      expect(advanceButton).toBeInTheDocument()

      const viewProgressButton = screen.getByRole('button', { name: /view progress/i })
      expect(viewProgressButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      const advanceButton = screen.getByText('Continue to Next Milestone')
      const viewProgressButton = screen.getByText('View Progress')
      const showDetailsButton = screen.getByText('Show Details')

      // All interactive elements should be focusable
      expect(advanceButton).toHaveAttribute('type', 'button')
      expect(viewProgressButton).toHaveAttribute('type', 'button')
      expect(showDetailsButton).toHaveAttribute('type', 'button')
    })

    it('has touch-friendly button sizes for mobile', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      const advanceButton = screen.getByText('Continue to Next Milestone')
      expect(advanceButton).toHaveClass('py-6') // Large padding for touch targets
    })
  })

  describe('Edge Cases', () => {
    it('handles missing program stats gracefully', () => {
      const { programStats, ...propsWithoutStats } = defaultProps
      render(<MilestoneCompletionModal {...propsWithoutStats} />)

      expect(screen.queryByText('Overall Progress')).not.toBeInTheDocument()
    })

    it('handles zero completion stats', () => {
      const zeroStatsProps = {
        ...defaultProps,
        milestoneStats: {
          totalDays: 0,
          completedDays: 0,
          completionPercentage: 0,
          isLastMilestone: false,
        },
      }

      render(<MilestoneCompletionModal {...zeroStatsProps} />)

      expect(screen.getByText('0')).toBeInTheDocument() // Should show 0 for both completed and total
    })

    it('toggles stats visibility correctly', () => {
      render(<MilestoneCompletionModal {...defaultProps} />)

      // Initially hidden
      expect(screen.queryByText('12')).not.toBeInTheDocument()

      // Show details
      fireEvent.click(screen.getByText('Show Details'))
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Hide Details')).toBeInTheDocument()

      // Hide details again
      fireEvent.click(screen.getByText('Hide Details'))
      expect(screen.queryByText('12')).not.toBeInTheDocument()
      expect(screen.getByText('Show Details')).toBeInTheDocument()
    })
  })
})
