'use client'

import { useCallback, useReducer, useRef, useEffect } from 'react'
import { toast } from 'sonner'

export interface ProgressState {
  currentMilestone: number
  currentDay: number
  totalWorkoutsCompleted: number
  lastWorkoutDate: string | null
}

export interface OptimisticUpdate {
  id: string
  timestamp: number
  type: 'progress_update' | 'exercise_complete' | 'day_advance' | 'milestone_advance'
  optimisticState: Partial<ProgressState>
  originalState: ProgressState
  status: 'pending' | 'confirmed' | 'failed' | 'retrying'
  retryCount: number
  maxRetries: number
  errorMessage?: string
}

interface OptimisticProgressState {
  currentState: ProgressState
  originalState: ProgressState
  pendingUpdates: OptimisticUpdate[]
  isOffline: boolean
  hasErrors: boolean
}

type OptimisticProgressAction =
  | { type: 'SET_INITIAL_STATE'; payload: ProgressState }
  | {
      type: 'ADD_OPTIMISTIC_UPDATE'
      payload: Omit<OptimisticUpdate, 'id' | 'timestamp' | 'status' | 'retryCount'>
    }
  | { type: 'CONFIRM_UPDATE'; payload: { updateId: string; serverState?: Partial<ProgressState> } }
  | { type: 'FAIL_UPDATE'; payload: { updateId: string; errorMessage: string } }
  | { type: 'RETRY_UPDATE'; payload: { updateId: string } }
  | { type: 'REMOVE_UPDATE'; payload: { updateId: string } }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'REVERT_TO_ORIGINAL' }

const initialState: OptimisticProgressState = {
  currentState: {
    currentMilestone: 0,
    currentDay: 0,
    totalWorkoutsCompleted: 0,
    lastWorkoutDate: null,
  },
  originalState: {
    currentMilestone: 0,
    currentDay: 0,
    totalWorkoutsCompleted: 0,
    lastWorkoutDate: null,
  },
  pendingUpdates: [],
  isOffline: false,
  hasErrors: false,
}

function optimisticProgressReducer(
  state: OptimisticProgressState,
  action: OptimisticProgressAction,
): OptimisticProgressState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        currentState: action.payload,
        originalState: action.payload,
      }

    case 'ADD_OPTIMISTIC_UPDATE': {
      const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const update: OptimisticUpdate = {
        ...action.payload,
        id: updateId,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
      }

      // Apply optimistic update to current state
      const newCurrentState = {
        ...state.currentState,
        ...update.optimisticState,
      }

      return {
        ...state,
        currentState: newCurrentState,
        pendingUpdates: [...state.pendingUpdates, update],
      }
    }

    case 'CONFIRM_UPDATE': {
      const updatedPendingUpdates = state.pendingUpdates.map((update) =>
        update.id === action.payload.updateId
          ? { ...update, status: 'confirmed' as const }
          : update,
      )

      // Remove confirmed update from pending list
      const finalPendingUpdates = updatedPendingUpdates.filter(
        (update) => update.id !== action.payload.updateId,
      )

      // Update original state with server confirmation if provided
      let newOriginalState = state.originalState
      if (action.payload.serverState) {
        newOriginalState = {
          ...state.originalState,
          ...action.payload.serverState,
        }
      }

      return {
        ...state,
        originalState: newOriginalState,
        pendingUpdates: finalPendingUpdates,
        hasErrors: finalPendingUpdates.some((update) => update.status === 'failed'),
      }
    }

    case 'FAIL_UPDATE': {
      const updatedPendingUpdates = state.pendingUpdates.map((update) =>
        update.id === action.payload.updateId
          ? {
              ...update,
              status: 'failed' as const,
              errorMessage: action.payload.errorMessage,
            }
          : update,
      )

      return {
        ...state,
        pendingUpdates: updatedPendingUpdates,
        hasErrors: true,
      }
    }

    case 'RETRY_UPDATE': {
      const updatedPendingUpdates = state.pendingUpdates.map((update) =>
        update.id === action.payload.updateId
          ? {
              ...update,
              status: 'retrying' as const,
              retryCount: update.retryCount + 1,
            }
          : update,
      )

      return {
        ...state,
        pendingUpdates: updatedPendingUpdates,
      }
    }

    case 'REMOVE_UPDATE': {
      const failedUpdate = state.pendingUpdates.find(
        (update) => update.id === action.payload.updateId,
      )

      // Revert optimistic changes if removing a failed update
      let newCurrentState = state.currentState
      if (failedUpdate && failedUpdate.status === 'failed') {
        // Recalculate current state without this update
        newCurrentState = state.originalState
        const remainingUpdates = state.pendingUpdates.filter(
          (update) => update.id !== action.payload.updateId,
        )

        // Reapply remaining optimistic updates
        for (const update of remainingUpdates) {
          if (update.status === 'pending' || update.status === 'retrying') {
            newCurrentState = {
              ...newCurrentState,
              ...update.optimisticState,
            }
          }
        }
      }

      const updatedPendingUpdates = state.pendingUpdates.filter(
        (update) => update.id !== action.payload.updateId,
      )

      return {
        ...state,
        currentState: newCurrentState,
        pendingUpdates: updatedPendingUpdates,
        hasErrors: updatedPendingUpdates.some((update) => update.status === 'failed'),
      }
    }

    case 'SET_OFFLINE':
      return {
        ...state,
        isOffline: action.payload,
      }

    case 'CLEAR_ERRORS':
      return {
        ...state,
        pendingUpdates: state.pendingUpdates.filter((update) => update.status !== 'failed'),
        hasErrors: false,
      }

    case 'REVERT_TO_ORIGINAL':
      return {
        ...state,
        currentState: state.originalState,
        pendingUpdates: [],
        hasErrors: false,
      }

    default:
      return state
  }
}

export interface UseOptimisticProgressOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: string, updateId: string) => void
  onSuccess?: (updateId: string) => void
  enableOfflineSupport?: boolean
}

export interface UseOptimisticProgressReturn {
  // State
  currentState: ProgressState
  originalState: ProgressState
  pendingUpdates: OptimisticUpdate[]
  isOffline: boolean
  hasErrors: boolean
  hasPendingUpdates: boolean

  // Actions
  initializeState: (initialState: ProgressState) => void
  optimisticUpdate: (
    type: OptimisticUpdate['type'],
    optimisticState: Partial<ProgressState>,
    serverAction: () => Promise<{ success: boolean; error?: string; data?: any }>,
  ) => Promise<string>
  confirmUpdate: (updateId: string, serverState?: Partial<ProgressState>) => void
  retryUpdate: (updateId: string) => Promise<void>
  removeUpdate: (updateId: string) => void
  clearErrors: () => void
  revertToOriginal: () => void

  // Recovery actions
  syncWithServer: () => Promise<void>
  getRecoveryActions: () => Array<{
    id: string
    label: string
    action: () => void
    type: 'retry' | 'remove' | 'revert'
  }>
}

/**
 * Hook for managing optimistic UI updates with comprehensive error recovery
 * Provides offline support, retry mechanisms, and rollback capabilities
 */
export function useOptimisticProgress(
  options: UseOptimisticProgressOptions = {},
): UseOptimisticProgressReturn {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
    enableOfflineSupport = true,
  } = options

  const [state, dispatch] = useReducer(optimisticProgressReducer, initialState)
  const pendingActionsRef = useRef<Map<string, () => Promise<any>>>(new Map())
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Monitor online/offline status
  useEffect(() => {
    if (!enableOfflineSupport) return

    const handleOnline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false })
      // Retry pending updates when coming back online
      state.pendingUpdates
        .filter((update) => update.status === 'pending' || update.status === 'failed')
        .forEach((update) => {
          if (pendingActionsRef.current.has(update.id)) {
            retryUpdate(update.id)
          }
        })
    }

    const handleOffline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: true })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableOfflineSupport])

  const initializeState = useCallback((initialState: ProgressState) => {
    dispatch({ type: 'SET_INITIAL_STATE', payload: initialState })
  }, [])

  const optimisticUpdate = useCallback(
    async (
      type: OptimisticUpdate['type'],
      optimisticState: Partial<ProgressState>,
      serverAction: () => Promise<{ success: boolean; error?: string; data?: any }>,
    ): Promise<string> => {
      const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Add optimistic update
      dispatch({
        type: 'ADD_OPTIMISTIC_UPDATE',
        payload: {
          type,
          optimisticState,
          originalState: state.currentState,
          maxRetries,
        },
      })

      // Store the server action for potential retries
      pendingActionsRef.current.set(updateId, serverAction)

      // Execute server action
      try {
        if (!state.isOffline) {
          const result = await serverAction()

          if (result.success) {
            const payload: { updateId: string; serverState?: Partial<ProgressState> } = { updateId }
            if (result.data) {
              payload.serverState = result.data
            }
            dispatch({
              type: 'CONFIRM_UPDATE',
              payload,
            })
            onSuccess?.(updateId)
          } else {
            dispatch({
              type: 'FAIL_UPDATE',
              payload: { updateId, errorMessage: result.error || 'Unknown error' },
            })
            onError?.(result.error || 'Unknown error', updateId)

            // Schedule retry if within retry limit
            const update = state.pendingUpdates.find((u) => u.id === updateId)
            if (update && update.retryCount < maxRetries) {
              scheduleRetry(updateId)
            }
          }
        } else {
          // Offline - update will be retried when online
          toast.info('Update saved locally. Will sync when connection is restored.')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error'
        dispatch({
          type: 'FAIL_UPDATE',
          payload: { updateId, errorMessage },
        })
        onError?.(errorMessage, updateId)
      }

      return updateId
    },
    [state.currentState, state.isOffline, maxRetries, onSuccess, onError],
  )

  const scheduleRetry = useCallback(
    (updateId: string) => {
      const timeoutId = setTimeout(
        async () => {
          await retryUpdate(updateId)
        },
        retryDelay *
          Math.pow(2, state.pendingUpdates.find((u) => u.id === updateId)?.retryCount || 0),
      )

      retryTimeoutsRef.current.set(updateId, timeoutId)
    },
    [retryDelay, state.pendingUpdates],
  )

  const confirmUpdate = useCallback((updateId: string, serverState?: Partial<ProgressState>) => {
    const confirmPayload: { updateId: string; serverState?: Partial<ProgressState> } = { updateId }
    if (serverState) {
      confirmPayload.serverState = serverState
    }
    dispatch({ type: 'CONFIRM_UPDATE', payload: confirmPayload })
    pendingActionsRef.current.delete(updateId)

    // Clear retry timeout if exists
    const timeoutId = retryTimeoutsRef.current.get(updateId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      retryTimeoutsRef.current.delete(updateId)
    }
  }, [])

  const retryUpdate = useCallback(
    async (updateId: string): Promise<void> => {
      const update = state.pendingUpdates.find((u) => u.id === updateId)
      const serverAction = pendingActionsRef.current.get(updateId)

      if (!update || !serverAction || update.retryCount >= maxRetries) {
        return
      }

      dispatch({ type: 'RETRY_UPDATE', payload: { updateId } })

      try {
        const result = await serverAction()

        if (result.success) {
          const confirmPayload: { updateId: string; serverState?: Partial<ProgressState> } = {
            updateId,
          }
          if (result.data) {
            confirmPayload.serverState = result.data
          }
          dispatch({
            type: 'CONFIRM_UPDATE',
            payload: confirmPayload,
          })
          onSuccess?.(updateId)
        } else {
          if (update.retryCount + 1 < maxRetries) {
            scheduleRetry(updateId)
          } else {
            dispatch({
              type: 'FAIL_UPDATE',
              payload: { updateId, errorMessage: `Max retries exceeded: ${result.error}` },
            })
            onError?.(`Max retries exceeded: ${result.error}`, updateId)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Retry failed'
        if (update.retryCount + 1 < maxRetries) {
          scheduleRetry(updateId)
        } else {
          dispatch({
            type: 'FAIL_UPDATE',
            payload: { updateId, errorMessage: `Max retries exceeded: ${errorMessage}` },
          })
          onError?.(`Max retries exceeded: ${errorMessage}`, updateId)
        }
      }
    },
    [state.pendingUpdates, maxRetries, onSuccess, onError, scheduleRetry],
  )

  const removeUpdate = useCallback((updateId: string) => {
    dispatch({ type: 'REMOVE_UPDATE', payload: { updateId } })
    pendingActionsRef.current.delete(updateId)

    // Clear retry timeout if exists
    const timeoutId = retryTimeoutsRef.current.get(updateId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      retryTimeoutsRef.current.delete(updateId)
    }
  }, [])

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' })

    // Clear all error-related timeouts
    state.pendingUpdates
      .filter((update) => update.status === 'failed')
      .forEach((update) => {
        const timeoutId = retryTimeoutsRef.current.get(update.id)
        if (timeoutId) {
          clearTimeout(timeoutId)
          retryTimeoutsRef.current.delete(update.id)
        }
        pendingActionsRef.current.delete(update.id)
      })
  }, [state.pendingUpdates])

  const revertToOriginal = useCallback(() => {
    dispatch({ type: 'REVERT_TO_ORIGINAL' })

    // Clear all pending actions and timeouts
    pendingActionsRef.current.clear()
    retryTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    retryTimeoutsRef.current.clear()
  }, [])

  const syncWithServer = useCallback(async (): Promise<void> => {
    // Retry all pending updates
    const pendingPromises = state.pendingUpdates
      .filter((update) => update.status === 'pending' || update.status === 'failed')
      .map((update) => retryUpdate(update.id))

    await Promise.allSettled(pendingPromises)
  }, [state.pendingUpdates, retryUpdate])

  const getRecoveryActions = useCallback(() => {
    const actions: Array<{
      id: string
      label: string
      action: () => void
      type: 'retry' | 'remove' | 'revert'
    }> = []

    // Add retry actions for failed updates
    state.pendingUpdates
      .filter((update) => update.status === 'failed' && update.retryCount < maxRetries)
      .forEach((update) => {
        actions.push({
          id: `retry-${update.id}`,
          label: `Retry ${update.type}`,
          action: () => retryUpdate(update.id),
          type: 'retry',
        })
      })

    // Add remove actions for failed updates
    state.pendingUpdates
      .filter((update) => update.status === 'failed')
      .forEach((update) => {
        actions.push({
          id: `remove-${update.id}`,
          label: `Dismiss ${update.type}`,
          action: () => removeUpdate(update.id),
          type: 'remove',
        })
      })

    // Add revert action if there are errors
    if (state.hasErrors) {
      actions.push({
        id: 'revert-all',
        label: 'Revert all changes',
        action: revertToOriginal,
        type: 'revert',
      })
    }

    return actions
  }, [
    state.pendingUpdates,
    state.hasErrors,
    maxRetries,
    retryUpdate,
    removeUpdate,
    revertToOriginal,
  ])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      retryTimeoutsRef.current.clear()
    }
  }, [])

  return {
    // State
    currentState: state.currentState,
    originalState: state.originalState,
    pendingUpdates: state.pendingUpdates,
    isOffline: state.isOffline,
    hasErrors: state.hasErrors,
    hasPendingUpdates: state.pendingUpdates.length > 0,

    // Actions
    initializeState,
    optimisticUpdate,
    confirmUpdate,
    retryUpdate,
    removeUpdate,
    clearErrors,
    revertToOriginal,

    // Recovery actions
    syncWithServer,
    getRecoveryActions,
  }
}
