import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProgressSyncService } from '@/lib/progress-sync'
import { useProgramStore } from '@/stores/program-store'
import type { UserProgress } from '@/types/program'

// Mock the store
vi.mock('@/stores/program-store', () => ({
  useProgramStore: {
    getState: vi.fn(),
  },
}))

// Mock server actions
vi.mock('@/actions/programs', () => ({
  advanceToNextDay: vi.fn(),
  advanceToNextMilestone: vi.fn(),
}))

const mockUserProgress: UserProgress = {
  currentProgram: 'test-program',
  currentMilestone: 0,
  currentDay: 1,
}

const mockStoreState = {
  userProgress: mockUserProgress,
  updateProgressOptimistically: vi.fn(),
  confirmOptimisticUpdate: vi.fn(),
  revertOptimisticUpdate: vi.fn(),
  setSyncing: vi.fn(),
}

describe('Progress Sync Service', () => {
  let syncService: ProgressSyncService

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    ;(ProgressSyncService as any).instance = null

    syncService = ProgressSyncService.getInstance()

    // Mock store state
    vi.mocked(useProgramStore.getState).mockReturnValue(mockStoreState as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = ProgressSyncService.getInstance()
      const instance2 = ProgressSyncService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', () => {
      const instance1 = ProgressSyncService.getInstance()
      const instance2 = ProgressSyncService.getInstance()
      const instance3 = ProgressSyncService.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })
  })

  describe('Day Advancement', () => {
    it('should successfully advance to next day with optimistic update', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({
        success: true,
      })

      const result = await syncService.advanceToNextDay()

      expect(result.success).toBe(true)

      // Should apply optimistic update
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledWith({
        ...mockUserProgress,
        currentDay: mockUserProgress.currentDay + 1,
      })

      // Should set syncing state
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(true)
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)

      // Should confirm optimistic update on success
      expect(mockStoreState.confirmOptimisticUpdate).toHaveBeenCalled()
    })

    it('should handle day advancement failure with rollback', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({
        success: false,
        error: 'Server error',
        errorType: 'system_error',
      })

      const result = await syncService.advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Server error')

      // Should apply optimistic update initially
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalled()

      // Should revert on failure
      expect(mockStoreState.revertOptimisticUpdate).toHaveBeenCalled()

      // Should reset syncing state
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })

    it('should handle network errors during day advancement', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockRejectedValue(new Error('Network error'))

      const result = await syncService.advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')

      // Should apply optimistic update initially
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalled()

      // Should revert on error
      expect(mockStoreState.revertOptimisticUpdate).toHaveBeenCalled()

      // Should reset syncing state
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })

    it('should handle missing user progress for day advancement', async () => {
      // Mock store with no user progress
      vi.mocked(useProgramStore.getState).mockReturnValue({
        ...mockStoreState,
        userProgress: null,
      } as any)

      const result = await syncService.advanceToNextDay()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No user progress available')

      // Should not call any server actions
      const { advanceToNextDay } = await import('@/actions/programs')
      expect(advanceToNextDay).not.toHaveBeenCalled()

      // Should not apply optimistic updates
      expect(mockStoreState.updateProgressOptimistically).not.toHaveBeenCalled()
    })
  })

  describe('Milestone Advancement', () => {
    it('should successfully advance to next milestone with optimistic update', async () => {
      const { advanceToNextMilestone } = await import('@/actions/programs')
      vi.mocked(advanceToNextMilestone).mockResolvedValue({
        success: true,
        errorType: 'system_error',
      })

      const result = await syncService.advanceToNextMilestone()

      expect(result.success).toBe(true)

      // Should apply optimistic update for milestone advancement
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledWith({
        ...mockUserProgress,
        currentMilestone: mockUserProgress.currentMilestone + 1,
        currentDay: 0, // Reset to first day of new milestone
      })

      // Should set syncing state
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(true)
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)

      // Should confirm optimistic update on success
      expect(mockStoreState.confirmOptimisticUpdate).toHaveBeenCalled()
    })

    it('should handle milestone advancement failure with rollback', async () => {
      const { advanceToNextMilestone } = await import('@/actions/programs')
      vi.mocked(advanceToNextMilestone).mockResolvedValue({
        success: false,
        error: 'Already on final milestone',
        errorType: 'validation',
      })

      const result = await syncService.advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Already on final milestone')

      // Should revert on failure
      expect(mockStoreState.revertOptimisticUpdate).toHaveBeenCalled()
    })

    it('should handle network errors during milestone advancement', async () => {
      const { advanceToNextMilestone } = await import('@/actions/programs')
      vi.mocked(advanceToNextMilestone).mockRejectedValue(new Error('Connection timeout'))

      const result = await syncService.advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection timeout')

      // Should revert on error
      expect(mockStoreState.revertOptimisticUpdate).toHaveBeenCalled()
    })

    it('should handle missing user progress for milestone advancement', async () => {
      // Mock store with no user progress
      vi.mocked(useProgramStore.getState).mockReturnValue({
        ...mockStoreState,
        userProgress: null,
      } as any)

      const result = await syncService.advanceToNextMilestone()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No user progress available')

      // Should not call server actions
      const { advanceToNextMilestone } = await import('@/actions/programs')
      expect(advanceToNextMilestone).not.toHaveBeenCalled()
    })
  })

  describe('Sync Queue Management', () => {
    it('should handle multiple concurrent sync requests', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')

      // Mock server action to take some time
      vi.mocked(advanceToNextDay).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
      )

      // Start multiple concurrent syncs
      const promise1 = syncService.advanceToNextDay()
      const promise2 = syncService.advanceToNextDay()
      const promise3 = syncService.advanceToNextDay()

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      // All should complete successfully
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)

      // Server action should be called for each request
      expect(advanceToNextDay).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed success and failure in concurrent operations', async () => {
      const { advanceToNextDay, advanceToNextMilestone } = await import('@/actions/programs')

      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })
      vi.mocked(advanceToNextMilestone).mockResolvedValue({
        success: false,
        error: 'Validation error',
        errorType: 'validation',
      })

      const [dayResult, milestoneResult] = await Promise.all([
        syncService.advanceToNextDay(),
        syncService.advanceToNextMilestone(),
      ])

      expect(dayResult.success).toBe(true)
      expect(milestoneResult.success).toBe(false)
      expect(milestoneResult.error).toContain('Validation error')
    })
  })

  describe('Optimistic Update Coordination', () => {
    it('should properly coordinate optimistic updates with server responses', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')

      // Simulate delayed server response
      let resolveServerCall: (value: any) => void
      vi.mocked(advanceToNextDay).mockReturnValue(
        new Promise((resolve) => {
          resolveServerCall = resolve
        }),
      )

      // Start sync
      const syncPromise = syncService.advanceToNextDay()

      // Optimistic update should be applied immediately
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalled()
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(true)

      // Server response comes back successful
      resolveServerCall!({ success: true })
      const result = await syncPromise

      expect(result.success).toBe(true)
      expect(mockStoreState.confirmOptimisticUpdate).toHaveBeenCalled()
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })

    it('should handle optimistic update rollback on server failure', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')

      // Simulate delayed server response with failure
      let resolveServerCall: (value: any) => void
      vi.mocked(advanceToNextDay).mockReturnValue(
        new Promise((resolve) => {
          resolveServerCall = resolve
        }),
      )

      // Start sync
      const syncPromise = syncService.advanceToNextDay()

      // Optimistic update should be applied immediately
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalled()

      // Server response comes back with failure
      resolveServerCall!({ success: false, error: 'Server error', errorType: 'system_error' })
      const result = await syncPromise

      expect(result.success).toBe(false)
      expect(mockStoreState.revertOptimisticUpdate).toHaveBeenCalled()
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle store access errors gracefully', () => {
      // Mock store to throw error
      vi.mocked(useProgramStore.getState).mockImplementation(() => {
        throw new Error('Store access error')
      })

      // Should not crash the service
      expect(async () => {
        await syncService.advanceToNextDay()
      }).not.toThrow()
    })

    it('should handle store method errors during sync', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })

      // Mock store method to throw error
      mockStoreState.updateProgressOptimistically.mockImplementation(() => {
        throw new Error('Store update error')
      })

      const result = await syncService.advanceToNextDay()

      // Should handle store errors gracefully
      expect(result.success).toBe(false)
      expect(result.error).toContain('Store update error')
    })

    it('should handle partial sync failures', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })

      // Mock confirm update to fail
      mockStoreState.confirmOptimisticUpdate.mockImplementation(() => {
        throw new Error('Confirm update error')
      })

      const result = await syncService.advanceToNextDay()

      // Should still report success if server action succeeded
      expect(result.success).toBe(true)
    })
  })

  describe('Service State Management', () => {
    it('should maintain proper syncing state throughout operation', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })

      await syncService.advanceToNextDay()

      // Should set syncing true at start and false at end
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(true)
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })

    it('should ensure syncing state is reset even on errors', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockRejectedValue(new Error('Network error'))

      await syncService.advanceToNextDay()

      // Should reset syncing state even on error
      expect(mockStoreState.setSyncing).toHaveBeenCalledWith(false)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle rapid successive sync operations', async () => {
      const { advanceToNextDay } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })

      // Perform rapid successive syncs
      const results = await Promise.all([
        syncService.advanceToNextDay(),
        syncService.advanceToNextDay(),
        syncService.advanceToNextDay(),
      ])

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })

      // Each should have triggered proper optimistic updates
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledTimes(3)
      expect(mockStoreState.confirmOptimisticUpdate).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed day and milestone advancement operations', async () => {
      const { advanceToNextDay, advanceToNextMilestone } = await import('@/actions/programs')
      vi.mocked(advanceToNextDay).mockResolvedValue({ success: true })
      vi.mocked(advanceToNextMilestone).mockResolvedValue({
        success: true,
        errorType: 'system_error',
      })

      const [dayResult, milestoneResult] = await Promise.all([
        syncService.advanceToNextDay(),
        syncService.advanceToNextMilestone(),
      ])

      expect(dayResult.success).toBe(true)
      expect(milestoneResult.success).toBe(true)

      // Should have different optimistic updates
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledTimes(2)

      // Day advancement: increment day
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledWith({
        ...mockUserProgress,
        currentDay: mockUserProgress.currentDay + 1,
      })

      // Milestone advancement: increment milestone, reset day
      expect(mockStoreState.updateProgressOptimistically).toHaveBeenCalledWith({
        ...mockUserProgress,
        currentMilestone: mockUserProgress.currentMilestone + 1,
        currentDay: 0,
      })
    })
  })
})
