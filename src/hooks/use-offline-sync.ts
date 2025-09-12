'use client'

import { useState, useEffect, useCallback } from 'react'
import { offlineSyncManager, SyncStatus, OfflineData } from '@/lib/offline-sync'
import { useWorkoutStore } from '@/stores/workout-store'

interface UseOfflineSyncReturn {
  status: SyncStatus
  addOfflineData: (type: OfflineData['type'], data: any, priority?: number) => string
  triggerSync: (force?: boolean) => Promise<boolean>
  clearOfflineData: () => void
  getPendingData: () => OfflineData[]
  isOnline: boolean
  canSync: boolean
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [status, setStatus] = useState<SyncStatus>(() => offlineSyncManager.getStatus())
  const workoutStore = useWorkoutStore()
  // @ts-ignore - Error handling methods will be added to workout store in integration phase
  const { addError, clearErrors } = workoutStore

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = offlineSyncManager.addSyncListener((newStatus) => {
      setStatus(newStatus)

      // Handle sync errors
      if (newStatus.errors.length > 0) {
        const latestError = newStatus.errors[newStatus.errors.length - 1]
        addError({
          type: 'sync_error',
          message: latestError,
          context: { timestamp: Date.now() },
        })
      }

      // Clear errors when sync is successful
      if (newStatus.pendingItems === 0 && newStatus.errors.length === 0) {
        clearErrors()
      }
    })

    return unsubscribe
  }, [addError, clearErrors])

  const addOfflineData = useCallback(
    (type: OfflineData['type'], data: any, priority = 5): string => {
      return offlineSyncManager.addPendingData(type, data, priority)
    },
    [],
  )

  const triggerSync = useCallback(
    async (force = false): Promise<boolean> => {
      try {
        return await offlineSyncManager.triggerSync(force)
      } catch (error) {
        addError({
          type: 'sync_trigger_error',
          message: 'Failed to trigger sync',
          context: { error: (error as Error).message },
        })
        return false
      }
    },
    [addError],
  )

  const clearOfflineData = useCallback(() => {
    offlineSyncManager.clearAllPendingData()
  }, [])

  const getPendingData = useCallback(() => {
    return offlineSyncManager.getPendingData()
  }, [])

  return {
    status,
    addOfflineData,
    triggerSync,
    clearOfflineData,
    getPendingData,
    isOnline: status.isOnline,
    canSync: status.isOnline && !status.isSyncing,
  }
}

// Higher-order component for offline-aware operations
export function useOfflineAwareOperation() {
  const { addOfflineData, isOnline } = useOfflineSync()
  const workoutStore = useWorkoutStore()
  // @ts-ignore - Error handling methods will be added to workout store in integration phase
  const { addError } = workoutStore

  const executeWithOfflineSupport = useCallback(
    async <T>(
      operation: () => Promise<T>,
      fallbackData: {
        type: OfflineData['type']
        data: any
        priority?: number
      },
      options: {
        showOfflineMessage?: boolean
        customOfflineMessage?: string
      } = {},
    ): Promise<{ success: boolean; data?: T; wasOffline: boolean }> => {
      const { showOfflineMessage = true, customOfflineMessage } = options

      if (!isOnline) {
        // Store data for later sync
        const offlineId = addOfflineData(
          fallbackData.type,
          fallbackData.data,
          fallbackData.priority || 5,
        )

        if (showOfflineMessage) {
          const message =
            customOfflineMessage ||
            `You're offline. Your ${fallbackData.type.replace('_', ' ')} will be saved and synced when you reconnect.`

          addError({
            type: 'offline_operation',
            message,
            context: { offlineId, type: fallbackData.type },
          })
        }

        return { success: true, wasOffline: true }
      }

      try {
        const result = await operation()
        return { success: true, data: result, wasOffline: false }
      } catch (error) {
        // If online operation fails, fallback to offline storage
        console.warn('Online operation failed, storing offline:', error)

        const offlineId = addOfflineData(
          fallbackData.type,
          fallbackData.data,
          fallbackData.priority || 5,
        )

        addError({
          type: 'operation_failed_stored_offline',
          message: 'Operation failed, but your data has been saved and will sync automatically.',
          context: { offlineId, originalError: (error as Error).message },
        })

        return { success: true, wasOffline: true }
      }
    },
    [isOnline, addOfflineData, addError],
  )

  return { executeWithOfflineSupport, isOnline }
}

// Specialized hooks for workout operations
export function useOfflineExerciseCompletion() {
  const { executeWithOfflineSupport } = useOfflineAwareOperation()

  const completeExerciseOfflineAware = useCallback(
    async (exerciseId: string, completionData: any, serverOperation: () => Promise<any>) => {
      return executeWithOfflineSupport(
        serverOperation,
        {
          type: 'exercise_completion',
          data: { exerciseId, completionData },
          priority: 8, // High priority for exercise completion
        },
        {
          customOfflineMessage: 'Exercise completed! Your progress will sync when you reconnect.',
        },
      )
    },
    [executeWithOfflineSupport],
  )

  return { completeExerciseOfflineAware }
}

export function useOfflineDayProgression() {
  const { executeWithOfflineSupport } = useOfflineAwareOperation()

  const progressDayOfflineAware = useCallback(
    async (dayId: string, progressionData: any, serverOperation: () => Promise<any>) => {
      return executeWithOfflineSupport(
        serverOperation,
        {
          type: 'day_progression',
          data: { dayId, progressionData },
          priority: 9, // Very high priority for day progression
        },
        {
          customOfflineMessage: 'Day progression saved! Changes will sync automatically.',
        },
      )
    },
    [executeWithOfflineSupport],
  )

  return { progressDayOfflineAware }
}

export function useOfflineUserProgress() {
  const { executeWithOfflineSupport } = useOfflineAwareOperation()

  const updateProgressOfflineAware = useCallback(
    async (userId: string, progressData: any, serverOperation: () => Promise<any>) => {
      return executeWithOfflineSupport(
        serverOperation,
        {
          type: 'user_progress',
          data: { userId, progressData },
          priority: 7, // High priority for user progress
        },
        {
          showOfflineMessage: false, // Don't show message for background progress updates
        },
      )
    },
    [executeWithOfflineSupport],
  )

  return { updateProgressOfflineAware }
}
