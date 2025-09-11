import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useProgramStore } from '@/stores/program-store'
import type { Program, UserProgress } from '@/types/program'

// Mock the progress utilities
vi.mock('@/utils/progress', () => ({
  calculateProgramProgress: vi.fn((program, progress) => ({
    currentMilestone: progress.currentMilestone,
    currentDay: progress.currentDay,
    totalMilestones: program.milestones.length,
    totalDays: program.milestones.reduce((total: number, m: any) => total + m.days.length, 0),
    completionPercentage: 50,
    isComplete: false,
    daysRemaining: 3,
    milestonesRemaining: 1,
  })),
  calculateProgramAnalytics: vi.fn((_program: any, _progress: any, startDate: Date | null) => ({
    totalWorkoutDaysCompleted: 2,
    totalRestDaysCompleted: 1,
    workoutDaysRemaining: 3,
    restDaysRemaining: 1,
    currentMilestoneWorkoutDays: 2,
    currentMilestoneRestDays: 1,
    programStartDate: startDate || null,
    estimatedCompletionDate: startDate
      ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : null,
  })),
  validateProgressConsistency: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
}))

// Test data
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
    {
      id: 'milestone-2',
      name: 'Milestone 2',
      theme: 'Progression',
      objective: 'Build strength',
      days: [
        {
          id: 'day-3',
          dayType: 'workout',
          exercises: [{ id: 'ex2', exercise: 'squats', sets: 3, reps: 15 }],
        },
      ],
    },
  ],
}

const mockUserProgress: UserProgress = {
  currentProgram: 'test-program',
  currentMilestone: 0,
  currentDay: 1,
}

describe('Program Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useProgramStore.getState().clearProgram()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    useProgramStore.getState().clearProgram()
  })

  describe('Basic State Management', () => {
    it('should initialize with default state', () => {
      const state = useProgramStore.getState()

      expect(state.currentProgram).toBeNull()
      expect(state.userProgress).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isSyncing).toBe(false)
      expect(state.lastSyncTimestamp).toBeNull()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
      expect(state.pendingProgressUpdates).toBeNull()
      expect(state.optimisticUpdateId).toBeNull()
    })

    it('should set current program and trigger progress calculation', () => {
      const store = useProgramStore.getState()

      // Set user progress first
      store.setUserProgress(mockUserProgress)

      // Set current program should trigger calculation
      store.setCurrentProgram(mockProgram)

      const state = useProgramStore.getState()
      expect(state.currentProgram).toEqual(mockProgram)
      expect(state.isLoading).toBe(false)
      expect(state.calculatedProgress).toBeDefined()
      expect(state.programAnalytics).toBeDefined()
    })

    it('should set user progress and trigger progress calculation', () => {
      const store = useProgramStore.getState()

      // Set program first
      store.setCurrentProgram(mockProgram)

      // Set user progress should trigger calculation
      store.setUserProgress(mockUserProgress)

      const state = useProgramStore.getState()
      expect(state.userProgress).toEqual(mockUserProgress)
      expect(state.isLoading).toBe(false)
      expect(state.calculatedProgress).toBeDefined()
      expect(state.programAnalytics).toBeDefined()
    })

    it('should handle loading state', () => {
      const store = useProgramStore.getState()

      store.setLoading(true)
      expect(useProgramStore.getState().isLoading).toBe(true)

      store.setLoading(false)
      expect(useProgramStore.getState().isLoading).toBe(false)
    })

    it('should handle syncing state', () => {
      const store = useProgramStore.getState()

      store.setSyncing(true)
      expect(useProgramStore.getState().isSyncing).toBe(true)

      store.setSyncing(false)
      expect(useProgramStore.getState().isSyncing).toBe(false)
    })

    it('should clear all program data', () => {
      const store = useProgramStore.getState()

      // Set some data first
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)
      store.setSyncing(true)
      store.markSyncTimestamp()

      // Clear should reset everything
      store.clearProgram()

      const state = useProgramStore.getState()
      expect(state.currentProgram).toBeNull()
      expect(state.userProgress).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isSyncing).toBe(false)
      expect(state.lastSyncTimestamp).toBeNull()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
      expect(state.pendingProgressUpdates).toBeNull()
      expect(state.optimisticUpdateId).toBeNull()
    })
  })

  describe('Optimistic Updates', () => {
    it('should handle optimistic progress updates', () => {
      const store = useProgramStore.getState()

      const optimisticProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 2,
      }

      store.updateProgressOptimistically(optimisticProgress)

      const state = useProgramStore.getState()
      expect(state.userProgress).toEqual(optimisticProgress)
      expect(state.pendingProgressUpdates).toEqual(optimisticProgress)
      expect(state.optimisticUpdateId).toBeDefined()
    })

    it('should revert optimistic updates', () => {
      const store = useProgramStore.getState()

      // Apply optimistic update
      const optimisticProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 2,
      }

      store.updateProgressOptimistically(optimisticProgress)
      expect(useProgramStore.getState().pendingProgressUpdates).toEqual(optimisticProgress)

      // Revert optimistic update
      store.revertOptimisticUpdate()

      const state = useProgramStore.getState()
      expect(state.pendingProgressUpdates).toBeNull()
      expect(state.optimisticUpdateId).toBeNull()
    })

    it('should confirm optimistic updates', () => {
      const store = useProgramStore.getState()

      // Apply optimistic update
      const optimisticProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 2,
      }

      store.updateProgressOptimistically(optimisticProgress)
      expect(useProgramStore.getState().pendingProgressUpdates).toEqual(optimisticProgress)

      // Confirm optimistic update
      store.confirmOptimisticUpdate()

      const state = useProgramStore.getState()
      expect(state.pendingProgressUpdates).toBeNull()
      expect(state.optimisticUpdateId).toBeNull()
      expect(state.lastSyncTimestamp).toBeDefined()
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress when both program and user progress exist', () => {
      const store = useProgramStore.getState()

      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)

      // Should trigger automatic calculation
      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeDefined()
      expect(state.programAnalytics).toBeDefined()
    })

    it('should clear calculated progress when program is null', () => {
      const store = useProgramStore.getState()

      // Set up with program and progress
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)
      expect(useProgramStore.getState().calculatedProgress).toBeDefined()

      // Remove program should clear calculations
      store.setCurrentProgram(null)

      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
    })

    it('should clear calculated progress when user progress is null', () => {
      const store = useProgramStore.getState()

      // Set up with program and progress
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)
      expect(useProgramStore.getState().calculatedProgress).toBeDefined()

      // Remove progress should clear calculations
      store.setUserProgress(null)

      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
    })

    it('should handle progress validation warnings', async () => {
      const { validateProgressConsistency } = vi.mocked(await import('@/utils/progress'))

      // Mock validation to return warnings
      validateProgressConsistency.mockReturnValue({
        isValid: false,
        errors: ['Test error'],
        warnings: ['Test warning'],
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const store = useProgramStore.getState()
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)

      // Should log warnings but continue
      expect(consoleSpy).toHaveBeenCalledWith('Progress validation failed:', ['Test error'])

      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeDefined() // Should still calculate

      consoleSpy.mockRestore()
    })

    it('should initialize progress data with comprehensive calculation', () => {
      const store = useProgramStore.getState()
      const startDate = new Date('2025-01-01')

      store.initializeProgressData(mockProgram, mockUserProgress, startDate)

      const state = useProgramStore.getState()
      expect(state.currentProgram).toEqual(mockProgram)
      expect(state.userProgress).toEqual(mockUserProgress)
      expect(state.calculatedProgress).toBeDefined()
      expect(state.programAnalytics).toBeDefined()
      expect(state.isLoading).toBe(false)
      expect(state.lastSyncTimestamp).toBeDefined()
    })
  })

  describe('Data Synchronization', () => {
    it('should mark sync timestamp', () => {
      const store = useProgramStore.getState()

      expect(useProgramStore.getState().lastSyncTimestamp).toBeNull()

      store.markSyncTimestamp()

      const state = useProgramStore.getState()
      expect(state.lastSyncTimestamp).toBeDefined()
      expect(typeof state.lastSyncTimestamp).toBe('number')
    })

    it('should determine sync necessity based on pending updates', () => {
      const store = useProgramStore.getState()

      // No pending updates, no sync needed initially
      expect(store.needsSync()).toBe(true) // True because no timestamp

      // Mark sync
      store.markSyncTimestamp()
      expect(store.needsSync()).toBe(false)

      // Add pending updates
      const optimisticProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 2,
      }
      store.updateProgressOptimistically(optimisticProgress)

      expect(store.needsSync()).toBe(true) // True because of pending updates
    })

    it('should determine sync necessity based on time threshold', () => {
      const store = useProgramStore.getState()

      // Mock timestamp to be older than threshold
      const oldTimestamp = Date.now() - 6 * 60 * 1000 // 6 minutes ago
      // Mock the lastSyncTimestamp directly on the store state
      ;(store as any).lastSyncTimestamp = oldTimestamp

      expect(store.needsSync()).toBe(true) // True because timestamp is old

      // Recent timestamp
      store.markSyncTimestamp()
      expect(store.needsSync()).toBe(false) // False because recent
    })
  })

  describe('Store Persistence', () => {
    it('should persistalize specific state properties', () => {
      const store = useProgramStore.getState()

      // Set up state
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)
      store.setLoading(true)
      store.setSyncing(true)
      store.updateProgressOptimistically(mockUserProgress)

      // The partialize function should only select certain fields
      const persistConfig = (useProgramStore as any).persist?.getOptions?.()

      if (persistConfig?.partialize) {
        const persistedState = persistConfig.partialize(store)

        // Should include these
        expect(persistedState.currentProgram).toEqual(mockProgram)
        expect(persistedState.userProgress).toEqual(mockUserProgress)
        expect(persistedState.lastSyncTimestamp).toBeDefined()

        // Should not include these volatile states
        expect(persistedState.isLoading).toBeUndefined()
        expect(persistedState.isSyncing).toBeUndefined()
        expect(persistedState.pendingProgressUpdates).toBeUndefined()
        expect(persistedState.calculatedProgress).toBeUndefined()
        expect(persistedState.programAnalytics).toBeUndefined()
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing program during progress calculation', () => {
      const store = useProgramStore.getState()

      // Set only user progress, no program
      store.setUserProgress(mockUserProgress)
      store.calculateAndSetProgress()

      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
    })

    it('should handle missing user progress during calculation', () => {
      const store = useProgramStore.getState()

      // Set only program, no user progress
      store.setCurrentProgram(mockProgram)
      store.calculateAndSetProgress()

      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeNull()
      expect(state.programAnalytics).toBeNull()
    })

    it('should handle revert when no pending updates exist', () => {
      const store = useProgramStore.getState()

      // Try to revert when nothing is pending
      store.revertOptimisticUpdate()

      // Should not crash
      const state = useProgramStore.getState()
      expect(state.pendingProgressUpdates).toBeNull()
    })

    it('should handle multiple optimistic updates correctly', () => {
      const store = useProgramStore.getState()

      const firstUpdate: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 1,
      }

      const secondUpdate: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 2,
      }

      // Apply first update
      store.updateProgressOptimistically(firstUpdate)
      const firstId = useProgramStore.getState().optimisticUpdateId

      // Apply second update (should replace first)
      store.updateProgressOptimistically(secondUpdate)
      const secondId = useProgramStore.getState().optimisticUpdateId

      expect(firstId).not.toEqual(secondId)
      expect(useProgramStore.getState().userProgress).toEqual(secondUpdate)
      expect(useProgramStore.getState().pendingProgressUpdates).toEqual(secondUpdate)
    })

    it('should handle concurrent progress calculations', () => {
      const store = useProgramStore.getState()

      // Set up program and progress
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)

      // Simulate concurrent calculations
      store.calculateAndSetProgress()
      store.calculateAndSetProgress()
      store.calculateAndSetProgress()

      // Should not crash and should have valid state
      const state = useProgramStore.getState()
      expect(state.calculatedProgress).toBeDefined()
      expect(state.programAnalytics).toBeDefined()
    })
  })

  describe('State Consistency', () => {
    it('should maintain state consistency during rapid changes', () => {
      const store = useProgramStore.getState()

      // Rapidly change state
      store.setLoading(true)
      store.setSyncing(true)
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)
      store.setLoading(false)
      store.setSyncing(false)

      const state = useProgramStore.getState()
      expect(state.currentProgram).toEqual(mockProgram)
      expect(state.userProgress).toEqual(mockUserProgress)
      expect(state.isLoading).toBe(false)
      expect(state.isSyncing).toBe(false)
    })

    it('should handle program changes during optimistic updates', () => {
      const store = useProgramStore.getState()

      // Start with one program
      store.setCurrentProgram(mockProgram)
      store.setUserProgress(mockUserProgress)

      // Add optimistic update
      const optimisticProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 1,
        currentDay: 0,
      }
      store.updateProgressOptimistically(optimisticProgress)

      // Change program while optimistic update is pending
      const newProgram: Program = {
        ...mockProgram,
        id: 'new-program',
        name: 'New Program',
      }
      store.setCurrentProgram(newProgram)

      // Should handle gracefully
      const state = useProgramStore.getState()
      expect(state.currentProgram).toEqual(newProgram)
      expect(state.pendingProgressUpdates).toEqual(optimisticProgress) // Should keep pending
    })
  })
})
