import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProgressInitialization } from '@/hooks/use-progress-initialization'
import { useProgramStore } from '@/stores/program-store'
import type { Program, UserProgress } from '@/types/program'

// Mock the store
vi.mock('@/stores/program-store', () => ({
  useProgramStore: vi.fn(),
}))

// Mock program data
const mockProgram: Program = {
  id: 'test-program',
  name: 'Test Program',
  description: 'Test description',
  objective: 'Test objective',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [
    {
      id: 'milestone-1',
      name: 'Milestone 1',
      theme: 'Foundation',
      objective: 'Build foundation',
      days: [
        {
          id: 'day-1',
          dayType: 'workout',
          exercises: [{ id: 'ex1', exercise: 'push-ups', sets: 3, reps: 10 }],
        },
        { id: 'day-2', dayType: 'rest', restNotes: 'Rest day' },
      ],
    },
  ],
}

const mockUserProgress: UserProgress = {
  currentProgram: 'test-program',
  currentMilestone: 0,
  currentDay: 1,
}

const mockStoreState = {
  currentProgram: null,
  userProgress: null,
  isLoading: false,
  calculatedProgress: null,
  programAnalytics: null,
  initializeProgressData: vi.fn(),
  setLoading: vi.fn(),
  needsSync: vi.fn(() => false),
}

// Mock validateProgressConsistency
vi.mock('@/utils/progress', () => ({
  validateProgressConsistency: vi.fn(() => ({ isValid: true, errors: [] })),
}))

// Mock progress sync service
vi.mock('@/lib/progress-sync', () => ({
  progressSyncService: {
    initialize: vi.fn(),
    handleAppVisibilityChange: vi.fn(),
  },
}))

describe('useProgressInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProgramStore).mockReturnValue(mockStoreState as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProgressInitialization())

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.isInitializing).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.hasError).toBe(false)
    })

    it('should detect when progress is already initialized', () => {
      vi.mocked(useProgramStore).mockReturnValue({
        ...mockStoreState,
        currentProgram: mockProgram,
        userProgress: mockUserProgress,
        calculatedProgress: {
          currentMilestone: 0,
          currentDay: 1,
          totalMilestones: 1,
          totalDays: 2,
          completionPercentage: 50,
          isComplete: false,
          daysRemaining: 1,
          milestonesRemaining: 0,
        },
      } as any)

      const { result } = renderHook(() => useProgressInitialization())

      expect(result.current.isInitialized).toBe(true)
      expect(result.current.hasError).toBe(false)
    })
  })

  describe('Progress Initialization', () => {
    it('should successfully initialize progress data', async () => {
      const { result } = renderHook(() => useProgressInitialization())

      await act(async () => {
        await result.current.initializeProgress(mockProgram, mockUserProgress)
      })

      expect(mockStoreState.initializeProgressData).toHaveBeenCalledWith(
        mockProgram,
        mockUserProgress,
        undefined,
      )
      expect(result.current.error).toBeNull()
    })

    it('should initialize progress with start date', async () => {
      const { result } = renderHook(() => useProgressInitialization())
      const startDate = new Date('2025-01-01')

      await act(async () => {
        await result.current.initializeProgress(mockProgram, mockUserProgress, startDate)
      })

      expect(mockStoreState.initializeProgressData).toHaveBeenCalledWith(
        mockProgram,
        mockUserProgress,
        startDate,
      )
    })

    it('should handle initialization errors', async () => {
      mockStoreState.initializeProgressData.mockImplementation(() => {
        throw new Error('Initialization failed')
      })

      const { result } = renderHook(() => useProgressInitialization())

      await act(async () => {
        await result.current.initializeProgress(mockProgram, mockUserProgress)
      })

      expect(result.current.error).toBe('Initialization failed')
      expect(result.current.isInitialized).toBe(false)
    })

    it('should set loading state during initialization', async () => {
      // Mock a delayed initialization
      mockStoreState.initializeProgressData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )

      const { result } = renderHook(() => useProgressInitialization())

      // Start initialization
      act(() => {
        result.current.initializeProgress(mockProgram, mockUserProgress)
      })

      // Should be initializing
      expect(result.current.isInitializing).toBe(true)

      // Wait for completion
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.isInitializing).toBe(false)
    })
  })

  describe('Store Data Access', () => {
    it('should provide access to store data', () => {
      const { result } = renderHook(() => useProgressInitialization())

      expect(result.current.currentProgram).toBeNull()
      expect(result.current.userProgress).toBeNull()
      expect(result.current.calculatedProgress).toBeNull()
      expect(result.current.programAnalytics).toBeNull()
    })

    it('should reflect store updates', () => {
      vi.mocked(useProgramStore).mockReturnValue({
        ...mockStoreState,
        currentProgram: mockProgram,
        userProgress: mockUserProgress,
      } as any)

      const { result } = renderHook(() => useProgressInitialization())

      expect(result.current.currentProgram).toEqual(mockProgram)
      expect(result.current.userProgress).toEqual(mockUserProgress)
    })
  })

  describe('Progress Rehydration', () => {
    it('should rehydrate progress when valid data exists in store', async () => {
      vi.mocked(useProgramStore).mockReturnValue({
        ...mockStoreState,
        currentProgram: mockProgram,
        userProgress: mockUserProgress,
        calculateAndSetProgress: vi.fn(),
      } as any)

      const { result } = renderHook(() => useProgressInitialization())

      await act(async () => {
        await result.current.rehydrateProgress()
      })

      expect(result.current.isInitialized).toBe(true)
      expect(result.current.hasError).toBe(false)
    })

    it('should handle invalid stored data during rehydration', async () => {
      const mockValidateProgress = vi.mocked(
        require('@/utils/progress').validateProgressConsistency,
      )
      mockValidateProgress.mockReturnValue({
        isValid: false,
        errors: ['Invalid progress data'],
      })

      vi.mocked(useProgramStore).mockReturnValue({
        ...mockStoreState,
        currentProgram: mockProgram,
        userProgress: mockUserProgress,
      } as any)

      const { result } = renderHook(() => useProgressInitialization())

      await act(async () => {
        await result.current.rehydrateProgress()
      })

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.hasError).toBe(true)
      expect(result.current.error).toContain('Stored progress data is inconsistent')
    })

    it('should not rehydrate when no data exists', async () => {
      const { result } = renderHook(() => useProgressInitialization())

      await act(async () => {
        await result.current.rehydrateProgress()
      })

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.hasError).toBe(false)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset initialization state', () => {
      const { result } = renderHook(() => useProgressInitialization())

      // First set some error state
      act(() => {
        result.current.resetInitialization()
      })

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.isInitializing).toBe(false)
      expect(result.current.hasError).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Error Recovery', () => {
    it('should clear initialization errors when retrying', async () => {
      // First attempt fails
      mockStoreState.initializeProgressData.mockImplementationOnce(() => {
        throw new Error('First attempt failed')
      })

      const { result } = renderHook(() => useProgressInitialization())

      // First initialization fails
      const firstResult = await act(async () => {
        return await result.current.initializeProgress(mockProgram, mockUserProgress)
      })

      expect(firstResult.success).toBe(false)
      expect(result.current.hasError).toBe(true)

      // Second attempt succeeds
      mockStoreState.initializeProgressData.mockImplementationOnce(() => {
        // Success
      })

      const secondResult = await act(async () => {
        return await result.current.initializeProgress(mockProgram, mockUserProgress)
      })

      expect(secondResult.success).toBe(true)
      expect(result.current.hasError).toBe(false)
    })
  })

  describe('Memory Management', () => {
    it('should clean up resources on unmount', () => {
      const { unmount } = renderHook(() => useProgressInitialization())

      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow()
    })

    it('should handle multiple mount/unmount cycles', () => {
      // First mount/unmount
      const { unmount: unmount1 } = renderHook(() => useProgressInitialization())
      unmount1()

      // Second mount/unmount
      const { unmount: unmount2 } = renderHook(() => useProgressInitialization())
      unmount2()

      // Third mount - should work fine
      const { result } = renderHook(() => useProgressInitialization())
      expect(result.current.isInitialized).toBe(false)
    })
  })
})
