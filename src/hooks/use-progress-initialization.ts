import { useEffect, useState, useCallback } from 'react'
import { useProgramStore } from '@/stores/program-store'
import { progressSyncService } from '@/lib/progress-sync'
import { validateProgressConsistency } from '@/utils/progress'
import type { Program, UserProgress } from '@/types/program'

export interface ProgressInitializationState {
  isInitializing: boolean
  isInitialized: boolean
  hasError: boolean
  error: string | null
}

/**
 * Hook for managing progress initialization and rehydration on app startup
 */
export function useProgressInitialization() {
  const store = useProgramStore()
  const [initState, setInitState] = useState<ProgressInitializationState>({
    isInitializing: false,
    isInitialized: false,
    hasError: false,
    error: null,
  })

  /**
   * Initialize progress data with a program and user progress
   */
  const initializeProgress = async (
    program: Program,
    progress: UserProgress,
    startDate?: Date,
  ): Promise<{ success: boolean; error?: string }> => {
    setInitState({
      isInitializing: true,
      isInitialized: false,
      hasError: false,
      error: null,
    })

    try {
      // Validate progress consistency before initialization
      const validation = validateProgressConsistency(program, progress)
      if (!validation.isValid) {
        const error = `Progress validation failed: ${validation.errors.join(', ')}`
        setInitState({
          isInitializing: false,
          isInitialized: false,
          hasError: true,
          error,
        })
        return { success: false, error }
      }

      // Initialize progress data in store
      store.initializeProgressData(program, progress, startDate)

      // Initialize sync service
      await progressSyncService.initialize()

      setInitState({
        isInitializing: false,
        isInitialized: true,
        hasError: false,
        error: null,
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'

      setInitState({
        isInitializing: false,
        isInitialized: false,
        hasError: true,
        error: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Reset initialization state
   */
  const resetInitialization = () => {
    setInitState({
      isInitializing: false,
      isInitialized: false,
      hasError: false,
      error: null,
    })
  }

  /**
   * Check if progress data needs rehydration and attempt to restore
   */
  const rehydrateProgress = useCallback(async (): Promise<void> => {
    const { currentProgram, userProgress } = store

    if (currentProgram && userProgress) {
      // Data exists, validate and recalculate
      const validation = validateProgressConsistency(currentProgram, userProgress)

      if (validation.isValid) {
        // Valid data, recalculate progress
        store.calculateAndSetProgress()

        // Initialize sync service
        await progressSyncService.initialize()

        setInitState({
          isInitializing: false,
          isInitialized: true,
          hasError: false,
          error: null,
        })
      } else {
        // Invalid data, mark as error
        setInitState({
          isInitializing: false,
          isInitialized: false,
          hasError: true,
          error: `Stored progress data is inconsistent: ${validation.errors.join(', ')}`,
        })
      }
    }
  }, [store])

  // Handle app visibility changes for sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      progressSyncService.handleAppVisibilityChange(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Attempt rehydration on mount if data exists
  useEffect(() => {
    if (!initState.isInitialized && !initState.isInitializing) {
      rehydrateProgress()
    }
  }, [initState.isInitialized, initState.isInitializing, rehydrateProgress])

  return {
    ...initState,
    initializeProgress,
    resetInitialization,
    rehydrateProgress,

    // Store state for convenience
    currentProgram: store.currentProgram,
    userProgress: store.userProgress,
    calculatedProgress: store.calculatedProgress,
    programAnalytics: store.programAnalytics,
  }
}

/**
 * Hook specifically for components that need to wait for progress initialization
 */
export function useProgressInitializationGuard() {
  const { isInitializing, isInitialized, hasError, error } = useProgressInitialization()

  return {
    isReady: isInitialized && !hasError,
    isLoading: isInitializing,
    hasError,
    error,
  }
}
