import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ProgramSelector } from '@/components/program/program-selector'
import type { ProgramPreview } from '@/types/program'

// Mock the server actions
vi.mock('@/actions/programs', () => ({
  assignProgramToUser: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}))

const { assignProgramToUser } = await import('@/actions/programs')

// Mock program data
const mockPrograms: ProgramPreview[] = [
  {
    id: '1',
    name: 'Beginner Strength',
    description: 'Perfect for those new to strength training',
    objective: 'Build foundational strength and proper form',
    totalMilestones: 3,
    totalDays: 30,
    totalWorkoutDays: 20,
    estimatedDuration: '4-6 weeks',
    milestonePreview: [
      {
        name: 'Foundation',
        theme: 'Basic Movements',
        objective: 'Learn proper form',
        dayCount: 10,
        workoutDayCount: 7,
      },
    ],
  },
  {
    id: '2',
    name: 'Advanced HIIT',
    description: 'High-intensity interval training for experienced athletes',
    objective: 'Maximize cardiovascular fitness and endurance',
    totalMilestones: 4,
    totalDays: 28,
    totalWorkoutDays: 24,
    estimatedDuration: '4 weeks',
    milestonePreview: [
      {
        name: 'Intensity Build',
        theme: 'HIIT Protocols',
        objective: 'Progressive intensity training',
        dayCount: 7,
        workoutDayCount: 6,
      },
    ],
  },
]

describe('ProgramSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Program List Rendering and Data Display', () => {
    it('renders the component title and description', () => {
      render(<ProgramSelector programs={mockPrograms} />)

      expect(screen.getByText('Choose Your Program')).toBeInTheDocument()
      expect(
        screen.getByText('Select a fitness program that matches your goals and experience level'),
      ).toBeInTheDocument()
    })

    it('displays all programs with their details', () => {
      render(<ProgramSelector programs={mockPrograms} />)

      // Check first program
      expect(screen.getByText('Beginner Strength')).toBeInTheDocument()
      expect(screen.getByText('Perfect for those new to strength training')).toBeInTheDocument()
      expect(screen.getByText('Build foundational strength and proper form')).toBeInTheDocument()
      expect(screen.getByText('4-6 weeks')).toBeInTheDocument()

      // Check second program
      expect(screen.getByText('Advanced HIIT')).toBeInTheDocument()
      expect(
        screen.getByText('High-intensity interval training for experienced athletes'),
      ).toBeInTheDocument()
      expect(screen.getByText('Maximize cardiovascular fitness and endurance')).toBeInTheDocument()
      expect(screen.getByText('4 weeks')).toBeInTheDocument()
    })

    it('renders programs in a grid layout', () => {
      render(<ProgramSelector programs={mockPrograms} />)

      // Look for the grid container class
      const gridContainer = document.querySelector('.grid.gap-6')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('No Programs Available State', () => {
    it('displays no programs message when programs array is empty', () => {
      render(<ProgramSelector programs={[]} />)

      expect(screen.getByText('No Programs Available')).toBeInTheDocument()
      expect(screen.getByText(/We're working on adding new workout programs/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument()
    })

    it('calls window.location.reload when refresh button is clicked', () => {
      const reloadSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      })

      render(<ProgramSelector programs={[]} />)

      const refreshButton = screen.getByRole('button', { name: 'Refresh Page' })
      fireEvent.click(refreshButton)

      expect(reloadSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Program Selection Flow', () => {
    it('shows confirmation dialog when a program is selected', async () => {
      render(<ProgramSelector programs={mockPrograms} />)

      // Click on the "Select This Program" button for the first program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
        expect(screen.getByText('You are about to start the program:')).toBeInTheDocument()
        expect(screen.getByText('Beginner Strength')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Start Program' })).toBeInTheDocument()
      })
    })

    it('returns to program list when cancel is clicked', async () => {
      render(<ProgramSelector programs={mockPrograms} />)

      // Select a program first
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText('Choose Your Program')).toBeInTheDocument()
        expect(screen.queryByText('Confirm Program Selection')).not.toBeInTheDocument()
      })
    })
  })

  describe('Program Assignment and Success Flow', () => {
    it('shows loading state during program assignment', async () => {
      // Mock a delayed response
      vi.mocked(assignProgramToUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
      )

      render(<ProgramSelector programs={mockPrograms} />)

      // Select and confirm a program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: 'Start Program' })
      fireEvent.click(startButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Assigning...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      })
    })

    it('shows success feedback after successful assignment', async () => {
      vi.mocked(assignProgramToUser).mockResolvedValue({ success: true })

      // Mock window.location.href
      delete (window as any).location
      window.location = { href: '' } as any

      render(<ProgramSelector programs={mockPrograms} />)

      // Select and confirm a program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: 'Start Program' })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Program Assigned Successfully!')).toBeInTheDocument()
        expect(
          screen.getByText(/You're all set! Redirecting you to your dashboard/),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Scenarios', () => {
    it('displays error message when program assignment fails', async () => {
      vi.mocked(assignProgramToUser).mockResolvedValue({
        success: false,
        error: 'The selected program is no longer available. Please choose a different program.',
        errorType: 'not_found',
      })

      render(<ProgramSelector programs={mockPrograms} />)

      // Select and confirm a program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: 'Start Program' })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(
          screen.getByText(
            'The selected program is no longer available. Please choose a different program.',
          ),
        ).toBeInTheDocument()
      })
    })

    it('displays generic error for unexpected failures', async () => {
      vi.mocked(assignProgramToUser).mockRejectedValue(new Error('Network error'))

      render(<ProgramSelector programs={mockPrograms} />)

      // Select and confirm a program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      const startButton = screen.getByRole('button', { name: 'Start Program' })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('clears error state when a new program is selected', async () => {
      vi.mocked(assignProgramToUser).mockResolvedValue({
        success: false,
        error: 'Test error message',
      })

      render(<ProgramSelector programs={mockPrograms} />)

      // Select and confirm first program
      const selectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(selectButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Confirm Program Selection')).toBeInTheDocument()
      })

      // Trigger error
      const startButton = screen.getByRole('button', { name: 'Start Program' })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument()
      })

      // Cancel and select different program
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      const newSelectButtons = screen.getAllByRole('button', { name: 'Select This Program' })
      fireEvent.click(newSelectButtons[1]!) // Click the second program

      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument()
      })
    })
  })
})
