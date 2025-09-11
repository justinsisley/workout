import { useProgramStore } from '@/stores/program-store'
import { advanceToNextDay, advanceToNextMilestone } from '@/actions/programs'
import type { UserProgress } from '@/types/program'

/**
 * Progress synchronization service for managing optimistic updates
 * and database synchronization for user progress tracking
 */
export class ProgressSyncService {
  private static instance: ProgressSyncService | null = null
  private syncQueue: Array<() => Promise<void>> = []
  private isSyncing = false

  private constructor() {}

  static getInstance(): ProgressSyncService {
    if (!ProgressSyncService.instance) {
      ProgressSyncService.instance = new ProgressSyncService()
    }
    return ProgressSyncService.instance
  }

  /**
   * Advance to next day with optimistic update and server synchronization
   */
  async advanceToNextDay(): Promise<{ success: boolean; error?: string }> {
    const store = useProgramStore.getState()
    const { userProgress } = store

    if (!userProgress) {
      return { success: false, error: 'No user progress available' }
    }

    // Create optimistic update - advance day by 1
    const optimisticProgress: UserProgress = {
      ...userProgress,
      currentDay: userProgress.currentDay + 1,
    }

    // Apply optimistic update immediately
    store.updateProgressOptimistically(optimisticProgress)

    try {
      // Perform server action
      store.setSyncing(true)
      const result = await advanceToNextDay()

      if (result.success) {
        // Confirm optimistic update on success
        store.confirmOptimisticUpdate()
        return { success: true }
      } else {
        // Revert optimistic update on failure
        store.revertOptimisticUpdate()
        return { success: false, error: result.error || 'Unknown error' }
      }
    } catch (error) {
      // Revert optimistic update on error
      store.revertOptimisticUpdate()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    } finally {
      store.setSyncing(false)
    }
  }

  /**
   * Advance to next milestone with optimistic update and server synchronization
   */
  async advanceToNextMilestone(): Promise<{ success: boolean; error?: string }> {
    const store = useProgramStore.getState()
    const { userProgress } = store

    if (!userProgress) {
      return { success: false, error: 'No user progress available' }
    }

    // Create optimistic update - advance milestone by 1 and reset day to 0
    const optimisticProgress: UserProgress = {
      ...userProgress,
      currentMilestone: userProgress.currentMilestone + 1,
      currentDay: 0,
    }

    // Apply optimistic update immediately
    store.updateProgressOptimistically(optimisticProgress)

    try {
      // Perform server action
      store.setSyncing(true)
      const result = await advanceToNextMilestone()

      if (result.success) {
        // Confirm optimistic update on success
        store.confirmOptimisticUpdate()
        return { success: true }
      } else {
        // Revert optimistic update on failure
        store.revertOptimisticUpdate()
        return { success: false, error: result.error || 'Unknown error' }
      }
    } catch (error) {
      // Revert optimistic update on error
      store.revertOptimisticUpdate()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    } finally {
      store.setSyncing(false)
    }
  }

  /**
   * Queue a sync operation to be processed
   */
  private async queueSyncOperation(operation: () => Promise<void>): Promise<void> {
    this.syncQueue.push(operation)

    if (!this.isSyncing) {
      await this.processSyncQueue()
    }
  }

  /**
   * Process all queued sync operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing) return

    this.isSyncing = true

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift()
        if (operation) {
          await operation()
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync pending progress updates with server
   */
  async syncPendingUpdates(): Promise<void> {
    const store = useProgramStore.getState()
    const { pendingProgressUpdates, needsSync } = store

    if (!needsSync() || !pendingProgressUpdates) {
      return
    }

    await this.queueSyncOperation(async () => {
      try {
        store.setSyncing(true)

        // In a real implementation, this would call a generic update endpoint
        // For now, we'll handle specific cases through the advancement methods
        console.log('Syncing pending progress updates:', pendingProgressUpdates)

        // Mark sync as complete
        store.confirmOptimisticUpdate()
      } catch (error) {
        console.error('Failed to sync pending updates:', error)
        store.revertOptimisticUpdate()
      } finally {
        store.setSyncing(false)
      }
    })
  }

  /**
   * Initialize progress sync service on app startup
   */
  async initialize(): Promise<void> {
    const store = useProgramStore.getState()

    // Check if there are any pending updates that need to be synced
    if (store.needsSync()) {
      console.log('Detected pending progress updates on startup, attempting sync')
      await this.syncPendingUpdates()
    }
  }

  /**
   * Handle app visibility changes to sync when app becomes active
   */
  handleAppVisibilityChange(isVisible: boolean): void {
    if (isVisible) {
      const store = useProgramStore.getState()
      if (store.needsSync()) {
        this.syncPendingUpdates().catch((error) => {
          console.error('Failed to sync on app visibility change:', error)
        })
      }
    }
  }
}

// Export singleton instance for convenience
export const progressSyncService = ProgressSyncService.getInstance()

/**
 * React hook for easy access to progress sync functionality
 */
export function useProgressSync() {
  const store = useProgramStore()

  return {
    // Store state
    isSyncing: store.isSyncing,
    hasPendingUpdates: store.pendingProgressUpdates !== null,
    needsSync: store.needsSync(),

    // Progress actions with optimistic updates
    advanceToNextDay: progressSyncService.advanceToNextDay.bind(progressSyncService),
    advanceToNextMilestone: progressSyncService.advanceToNextMilestone.bind(progressSyncService),

    // Manual sync control
    syncPendingUpdates: progressSyncService.syncPendingUpdates.bind(progressSyncService),
  }
}
