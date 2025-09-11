import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ProgramCard } from '@/components/program/program-card'
import type { ProgramPreview } from '@/types/program'

// Mock program data
const mockProgram: ProgramPreview = {
  id: '1',
  name: 'Beginner Strength Training',
  description: 'Perfect for those new to strength training with bodyweight and light weights',
  objective: 'Build foundational strength and establish proper movement patterns',
  totalMilestones: 3,
  totalDays: 30,
  totalWorkoutDays: 20,
  estimatedDuration: '4-6 weeks',
  milestonePreview: [
    {
      name: 'Foundation Phase',
      theme: 'Basic Movements',
      objective: 'Learn proper form for fundamental exercises',
      dayCount: 10,
      workoutDayCount: 7,
    },
    {
      name: 'Progression Phase',
      theme: 'Increased Intensity',
      objective: 'Build strength with progressive overload',
      dayCount: 12,
      workoutDayCount: 8,
    },
    {
      name: 'Mastery Phase',
      theme: 'Advanced Techniques',
      objective: 'Master complex movement patterns',
      dayCount: 8,
      workoutDayCount: 5,
    },
  ],
}

describe('ProgramCard', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Program Information Display', () => {
    it('renders program name and description', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      expect(screen.getByText('Beginner Strength Training')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Perfect for those new to strength training with bodyweight and light weights',
        ),
      ).toBeInTheDocument()
    })

    it('displays program objective', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      expect(
        screen.getByText('Build foundational strength and establish proper movement patterns'),
      ).toBeInTheDocument()
    })

    it('shows program duration and workout day count', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      expect(screen.getByText('4-6 weeks')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
      expect(screen.getByText('Workout Days')).toBeInTheDocument()
    })
  })

  describe('Enhanced Program Preview Functionality', () => {
    it('displays total milestones count', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Milestones')).toBeInTheDocument()
    })

    it('shows milestone preview information', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      // Check for milestone names
      expect(screen.getByText('Foundation Phase')).toBeInTheDocument()
      expect(screen.getByText('Progression Phase')).toBeInTheDocument()
      expect(screen.getByText('Mastery Phase')).toBeInTheDocument()

      // Check for milestone themes
      expect(screen.getByText('Basic Movements')).toBeInTheDocument()
      expect(screen.getByText('Increased Intensity')).toBeInTheDocument()
      expect(screen.getByText('Advanced Techniques')).toBeInTheDocument()
    })

    it('displays individual milestone day counts', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      // Check for milestone day counts
      expect(screen.getByText(/10 days/)).toBeInTheDocument()
      expect(screen.getByText(/12 days/)).toBeInTheDocument()
      expect(screen.getByText(/8 days/)).toBeInTheDocument()
    })

    it('shows milestone workout day counts', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      // Check for workout day counts in milestones
      expect(screen.getByText(/7 workouts/)).toBeInTheDocument()
      expect(screen.getByText(/8 workouts/)).toBeInTheDocument()
      expect(screen.getByText(/5 workouts/)).toBeInTheDocument()
    })
  })

  describe('Program Structure Preview', () => {
    it('renders program structure in an organized layout', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      // Check that milestones are displayed in a structured way
      const milestoneElements = screen.getAllByText(/Phase/)
      expect(milestoneElements).toHaveLength(3)
    })

    it('displays milestone structure information', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      // Check for "Program Structure" section header
      expect(screen.getByText('Program Structure')).toBeInTheDocument()
    })
  })

  describe('Interactive Functionality', () => {
    it('calls onSelect with program id when select button is clicked', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      const selectButton = screen.getByRole('button', { name: 'Select This Program' })
      expect(selectButton).toBeInTheDocument()

      fireEvent.click(selectButton)
      expect(mockOnSelect).toHaveBeenCalledWith('1')
    })

    it('has proper button accessibility', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      const selectButton = screen.getByRole('button', { name: 'Select This Program' })
      expect(selectButton).toBeInTheDocument()
      expect(selectButton).not.toBeDisabled()
    })
  })

  describe('Mobile Optimization', () => {
    it('applies mobile-friendly styling classes', () => {
      render(<ProgramCard program={mockProgram} onSelect={mockOnSelect} />)

      const selectButton = screen.getByRole('button', { name: 'Select This Program' })
      expect(selectButton).toBeInTheDocument()

      // Check that the button is full width for mobile optimization
      expect(selectButton.className).toContain('w-full')
    })
  })

  describe('Edge Cases', () => {
    it('handles program with minimal milestone data', () => {
      const minimalProgram: ProgramPreview = {
        ...mockProgram,
        milestonePreview: [
          {
            name: 'Single Milestone',
            theme: 'Basic',
            objective: 'Simple objective',
            dayCount: 5,
            workoutDayCount: 3,
          },
        ],
      }

      render(<ProgramCard program={minimalProgram} onSelect={mockOnSelect} />)

      expect(screen.getByText('Single Milestone')).toBeInTheDocument()
      expect(screen.getByText('Basic')).toBeInTheDocument()
      // The component shows the main program objective, not milestone objectives
      expect(
        screen.getByText('Build foundational strength and establish proper movement patterns'),
      ).toBeInTheDocument()
    })

    it('handles program with no milestone preview', () => {
      const noMilestonesProgram: ProgramPreview = {
        ...mockProgram,
        milestonePreview: [],
      }

      expect(() => {
        render(<ProgramCard program={noMilestonesProgram} onSelect={mockOnSelect} />)
      }).not.toThrow()

      expect(screen.getByText('Beginner Strength Training')).toBeInTheDocument()
    })

    it('handles very long program names and descriptions gracefully', () => {
      const longTextProgram: ProgramPreview = {
        ...mockProgram,
        name: 'This is an extremely long program name that should be handled gracefully by the component without breaking the layout',
        description:
          'This is a very long description that contains a lot of information about the program and should be handled properly by the component without causing layout issues or text overflow problems',
      }

      expect(() => {
        render(<ProgramCard program={longTextProgram} onSelect={mockOnSelect} />)
      }).not.toThrow()

      expect(screen.getByText(/This is an extremely long program name/)).toBeInTheDocument()
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })
  })
})
