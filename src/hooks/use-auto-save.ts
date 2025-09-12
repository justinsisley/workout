'use client'

import { useCallback, useRef, useEffect } from 'react'
import { autoSaveExerciseData, type AutoSaveExerciseDataInput } from '@/actions/workouts'

export interface UseAutoSaveOptions {
  delay?: number // Debounce delay in milliseconds
  maxRetries?: number // Maximum retry attempts for failed saves
  retryDelay?: number // Delay between retry attempts in milliseconds
  onSuccess?: () => void
  onError?: (error: string) => void
  onRetry?: (attempt: number) => void
}

/**
 * Custom hook for auto-saving exercise data with debouncing
 * Prevents data loss by automatically saving as user types
 */
export function useAutoSave({
  delay = 2000, // 2 second delay by default
  maxRetries = 3, // 3 retry attempts by default
  retryDelay = 5000, // 5 second delay between retries
  onSuccess,
  onError,
  onRetry,
}: UseAutoSaveOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedDataRef = useRef<string>('')
  const isAutoSavingRef = useRef(false)
  const pendingDataRef = useRef<AutoSaveExerciseDataInput | null>(null)
  const retryCountRef = useRef(0)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Retry logic for failed saves
  const retryAutoSave = useCallback(
    async (data: AutoSaveExerciseDataInput, attempt: number = 1): Promise<void> => {
      try {
        isAutoSavingRef.current = true
        const result = await autoSaveExerciseData(data)

        if (result.success && result.saved) {
          const dataString = JSON.stringify(data)
          lastSavedDataRef.current = dataString
          retryCountRef.current = 0
          pendingDataRef.current = null
          onSuccess?.()
        } else if (!result.success) {
          throw new Error(result.error || 'Auto-save failed')
        }
        // If result.saved is false, it just means no meaningful data to save (which is fine)
      } catch (error) {
        console.error(`Auto-save attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          // Schedule retry
          retryCountRef.current = attempt
          pendingDataRef.current = data
          onRetry?.(attempt)

          retryTimeoutRef.current = setTimeout(() => {
            retryAutoSave(data, attempt + 1)
          }, retryDelay * attempt) // Exponential backoff
        } else {
          // Max retries reached, give up but don't disrupt user experience
          retryCountRef.current = 0
          pendingDataRef.current = null
          onError?.(error instanceof Error ? error.message : 'Auto-save failed after retries')
        }
      } finally {
        if (retryCountRef.current === 0) {
          isAutoSavingRef.current = false
        }
      }
    },
    [maxRetries, retryDelay, onSuccess, onError, onRetry],
  )

  const autoSave = useCallback(
    async (data: AutoSaveExerciseDataInput) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // Check if data has actually changed to avoid unnecessary saves
      const dataString = JSON.stringify(data)
      if (dataString === lastSavedDataRef.current || isAutoSavingRef.current) {
        return
      }

      // Store data for potential offline retry
      pendingDataRef.current = data

      // Set up debounced auto-save
      timeoutRef.current = setTimeout(() => {
        retryAutoSave(data, 1)
      }, delay)
    },
    [delay, retryAutoSave],
  )

  const clearAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    isAutoSavingRef.current = false
    retryCountRef.current = 0
  }, [])

  const getPendingData = useCallback(() => {
    return pendingDataRef.current
  }, [])

  const hasPendingData = useCallback(() => {
    return pendingDataRef.current !== null
  }, [])

  // Listen for online/offline events to retry pending saves
  useEffect(() => {
    const handleOnline = () => {
      if (pendingDataRef.current && retryCountRef.current === 0) {
        // Retry the pending save when connection is restored
        console.log('Connection restored, retrying auto-save...')
        retryAutoSave(pendingDataRef.current, 1)
      }
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [retryAutoSave])

  return {
    autoSave,
    clearAutoSave,
    getPendingData,
    hasPendingData,
  }
}
