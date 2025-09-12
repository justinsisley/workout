'use client'

import { useState, useCallback, useRef } from 'react'
import { workoutRetryManager, RetryResult } from '@/lib/retry-logic'

interface UseWorkoutRetryState {
  isRetrying: boolean
  retryAttempt: number
  lastError: any
  operationId: string | null
}

interface UseWorkoutRetryReturn extends UseWorkoutRetryState {
  retryExerciseCompletion: <T>(
    operation: () => Promise<T>,
    exerciseId: string,
    onSuccess?: (result: T) => void,
    onFailure?: (error: any) => void,
  ) => Promise<RetryResult<T>>

  retryDayProgression: <T>(
    operation: () => Promise<T>,
    dayId: string,
    onSuccess?: (result: T) => void,
    onFailure?: (error: any) => void,
  ) => Promise<RetryResult<T>>

  retryDataPersistence: <T>(
    operation: () => Promise<T>,
    dataType: string,
    onSuccess?: (result: T) => void,
    onFailure?: (error: any) => void,
  ) => Promise<RetryResult<T>>

  retryMilestoneProgression: <T>(
    operation: () => Promise<T>,
    milestoneId: string,
    onSuccess?: (result: T) => void,
    onFailure?: (error: any) => void,
  ) => Promise<RetryResult<T>>

  cancelCurrentRetry: () => boolean
  getActiveRetries: () => string[]
  resetRetryState: () => void
}

export function useWorkoutRetry(): UseWorkoutRetryReturn {
  const [state, setState] = useState<UseWorkoutRetryState>({
    isRetrying: false,
    retryAttempt: 0,
    lastError: null,
    operationId: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const updateState = useCallback((updates: Partial<UseWorkoutRetryState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const executeRetryOperation = useCallback(
    async <T>(
      retryMethod: (operation: () => Promise<T>, id: string) => Promise<RetryResult<T>>,
      operation: () => Promise<T>,
      operationId: string,
      onSuccess?: (result: T) => void,
      onFailure?: (error: any) => void,
    ): Promise<RetryResult<T>> => {
      try {
        updateState({
          isRetrying: true,
          retryAttempt: 0,
          lastError: null,
          operationId,
        })

        // Clear previous errors for this operation
        console.debug('Starting retry operation', { operationId })

        const result = await retryMethod(async () => {
          try {
            const data = await operation()

            // Update retry attempt count during operation
            updateState({ retryAttempt: stateRef.current.retryAttempt + 1 })

            return data
          } catch (error) {
            // Update error state
            updateState({ lastError: error })
            throw error
          }
        }, operationId)

        if (result.success && result.data !== undefined) {
          onSuccess?.(result.data)
          updateState({
            isRetrying: false,
            operationId: null,
            lastError: null,
          })
        } else {
          onFailure?.(result.error)
          console.error(`Retry failed: Operation failed after ${result.attempts} attempts`, {
            operationId,
            totalTime: result.totalTime,
            error: result.error,
          })

          updateState({
            isRetrying: false,
            operationId: null,
            lastError: result.error,
          })
        }

        return result
      } catch (error) {
        onFailure?.(error)
        console.error('Unexpected error during retry operation', {
          operationId,
          error: error instanceof Error ? error.message : String(error),
        })

        updateState({
          isRetrying: false,
          operationId: null,
          lastError: error,
        })

        return {
          success: false,
          error,
          attempts: 1,
          totalTime: 0,
        }
      }
    },
    [updateState],
  )

  const retryExerciseCompletion = useCallback(
    <T>(
      operation: () => Promise<T>,
      exerciseId: string,
      onSuccess?: (result: T) => void,
      onFailure?: (error: any) => void,
    ) => {
      return executeRetryOperation(
        workoutRetryManager.retryExerciseCompletion.bind(workoutRetryManager),
        operation,
        exerciseId,
        onSuccess,
        onFailure,
      )
    },
    [executeRetryOperation],
  )

  const retryDayProgression = useCallback(
    <T>(
      operation: () => Promise<T>,
      dayId: string,
      onSuccess?: (result: T) => void,
      onFailure?: (error: any) => void,
    ) => {
      return executeRetryOperation(
        workoutRetryManager.retryDayProgression.bind(workoutRetryManager),
        operation,
        dayId,
        onSuccess,
        onFailure,
      )
    },
    [executeRetryOperation],
  )

  const retryDataPersistence = useCallback(
    <T>(
      operation: () => Promise<T>,
      dataType: string,
      onSuccess?: (result: T) => void,
      onFailure?: (error: any) => void,
    ) => {
      return executeRetryOperation(
        workoutRetryManager.retryDataPersistence.bind(workoutRetryManager),
        operation,
        dataType,
        onSuccess,
        onFailure,
      )
    },
    [executeRetryOperation],
  )

  const retryMilestoneProgression = useCallback(
    <T>(
      operation: () => Promise<T>,
      milestoneId: string,
      onSuccess?: (result: T) => void,
      onFailure?: (error: any) => void,
    ) => {
      return executeRetryOperation(
        workoutRetryManager.retryMilestoneProgression.bind(workoutRetryManager),
        operation,
        milestoneId,
        onSuccess,
        onFailure,
      )
    },
    [executeRetryOperation],
  )

  const cancelCurrentRetry = useCallback(() => {
    const { operationId } = stateRef.current
    if (operationId) {
      const success = workoutRetryManager.cancelRetry(operationId)
      if (success) {
        updateState({
          isRetrying: false,
          operationId: null,
          lastError: new Error('Operation cancelled by user'),
        })
      }
      return success
    }
    return false
  }, [updateState])

  const getActiveRetries = useCallback(() => {
    return workoutRetryManager.getActiveRetries()
  }, [])

  const resetRetryState = useCallback(() => {
    setState({
      isRetrying: false,
      retryAttempt: 0,
      lastError: null,
      operationId: null,
    })
    console.debug('Retry state reset')
  }, [])

  return {
    ...state,
    retryExerciseCompletion,
    retryDayProgression,
    retryDataPersistence,
    retryMilestoneProgression,
    cancelCurrentRetry,
    getActiveRetries,
    resetRetryState,
  }
}
