'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ConflictData,
  ConflictResolution,
  dataConflictManager,
  detectWorkoutConflicts,
} from '@/lib/conflict-resolution'
import { useWorkoutStore } from '@/stores/workout-store'

interface UseConflictResolutionState {
  activeConflicts: ConflictData[]
  isCheckingConflicts: boolean
  hasUnresolvedConflicts: boolean
  lastConflictCheck: number | null
}

interface UseConflictResolutionReturn extends UseConflictResolutionState {
  checkForConflicts: (remoteData: any) => Promise<ConflictData[]>
  resolveConflicts: (resolutions: ConflictResolution[]) => Promise<boolean>
  resolveConflict: (conflict: ConflictData, userChoice?: any) => Promise<ConflictResolution>
  clearConflicts: () => void
  exportConflictData: () => any
}

export function useConflictResolution(): UseConflictResolutionReturn {
  const [state, setState] = useState<UseConflictResolutionState>({
    activeConflicts: [],
    isCheckingConflicts: false,
    hasUnresolvedConflicts: false,
    lastConflictCheck: null,
  })

  const workoutStore = useWorkoutStore()

  const updateState = useCallback((updates: Partial<UseConflictResolutionState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Check for conflicts between local and remote data
  const checkForConflicts = useCallback(
    async (remoteData: any): Promise<ConflictData[]> => {
      updateState({ isCheckingConflicts: true })

      try {
        // Get current local workout data from store
        const localData = {
          exerciseProgress: workoutStore.exerciseProgress,
          completedExercises: workoutStore.completedExercises,
          dayCompleted: workoutStore.shouldTriggerDayCompletion(),
          currentExerciseIndex: workoutStore.currentExerciseIndex,
          currentMilestone: workoutStore.currentMilestoneIndex,
          currentDay: workoutStore.currentDayIndex,
          totalWorkoutsCompleted: 0, // This would come from user data
          sessionStartTime: workoutStore.sessionStartTime,
          lastWorkoutDate: new Date().toISOString(),
        }

        // Detect conflicts
        const conflicts = detectWorkoutConflicts(localData, remoteData)

        // Add conflicts to manager
        conflicts.forEach((conflict) => {
          dataConflictManager.addActiveConflict(conflict)
        })

        updateState({
          activeConflicts: conflicts,
          hasUnresolvedConflicts: conflicts.length > 0,
          lastConflictCheck: Date.now(),
        })

        return conflicts
      } catch (error) {
        console.error('Conflict checking failed:', error)
        return []
      } finally {
        updateState({ isCheckingConflicts: false })
      }
    },
    [workoutStore, updateState],
  )

  // Resolve multiple conflicts
  const resolveConflicts = useCallback(
    async (resolutions: ConflictResolution[]): Promise<boolean> => {
      try {
        let allSuccess = true

        for (const resolution of resolutions) {
          if (resolution.strategy === 'user_decides') {
            console.warn('Cannot automatically apply user_decides resolution')
            allSuccess = false
            continue
          }

          // Apply resolution to workout store
          const success = await applyResolutionToStore(resolution)
          if (!success) {
            allSuccess = false
          }
        }

        // Clear resolved conflicts from state
        if (allSuccess) {
          updateState({
            activeConflicts: [],
            hasUnresolvedConflicts: false,
          })
        }

        return allSuccess
      } catch (error) {
        console.error('Failed to resolve conflicts:', error)
        return false
      }
    },
    [updateState],
  )

  // Resolve single conflict
  const resolveConflict = useCallback(
    async (conflict: ConflictData, userChoice?: any): Promise<ConflictResolution> => {
      try {
        const resolution = await dataConflictManager.resolveConflict(conflict, userChoice)

        // Apply resolution to store if successful
        if (resolution.strategy !== 'user_decides') {
          await applyResolutionToStore(resolution)

          // Remove from active conflicts
          const updatedConflicts = state.activeConflicts.filter(
            (c) => c.conflictId !== conflict.conflictId,
          )
          updateState({
            activeConflicts: updatedConflicts,
            hasUnresolvedConflicts: updatedConflicts.length > 0,
          })
        }

        return resolution
      } catch (error) {
        console.error('Failed to resolve conflict:', error)
        throw error
      }
    },
    [state.activeConflicts, updateState],
  )

  // Apply resolution data to workout store
  const applyResolutionToStore = async (resolution: ConflictResolution): Promise<boolean> => {
    try {
      const { resolvedData } = resolution

      if (!resolvedData) {
        return false
      }

      // Apply different types of resolved data
      if (resolvedData.exerciseProgress) {
        // Update exercise progress in store
        Object.entries(resolvedData.exerciseProgress).forEach(([exerciseId, progress]) => {
          workoutStore.updateExerciseProgress(exerciseId, progress as any)
        })
      }

      if (resolvedData.completedExercises && Array.isArray(resolvedData.completedExercises)) {
        // Update completed exercises by completing each exercise individually
        resolvedData.completedExercises.forEach((exerciseId: string) => {
          workoutStore.completeExercise(exerciseId)
        })
      }

      if (resolvedData.currentExerciseIndex !== undefined) {
        // Update current exercise index
        workoutStore.setCurrentExercise(resolvedData.currentExerciseIndex)
      }

      if (resolvedData.currentMilestone !== undefined && resolvedData.currentDay !== undefined) {
        // Update milestone and day progress together
        workoutStore.setCurrentDay(resolvedData.currentMilestone, resolvedData.currentDay)
      }

      return true
    } catch (error) {
      console.error('Failed to apply resolution to store:', error)
      return false
    }
  }

  // Clear all conflicts
  const clearConflicts = useCallback(() => {
    dataConflictManager.clearResolvedConflicts()
    updateState({
      activeConflicts: [],
      hasUnresolvedConflicts: false,
    })
  }, [updateState])

  // Export conflict data for debugging
  const exportConflictData = useCallback(() => {
    return {
      ...dataConflictManager.exportConflictData(),
      hookState: state,
      workoutStoreSnapshot: {
        exerciseProgress: workoutStore.exerciseProgress,
        completedExercises: workoutStore.completedExercises,
        currentExerciseIndex: workoutStore.currentExerciseIndex,
        currentMilestone: workoutStore.currentMilestoneIndex,
        currentDay: workoutStore.currentDayIndex,
      },
    }
  }, [state, workoutStore])

  // Auto-check for conflicts on store changes (debounced)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // This would typically check against server data periodically
      // For now, we'll just update the manager's active conflicts
      const managerConflicts = dataConflictManager.getActiveConflicts()

      if (managerConflicts.length !== state.activeConflicts.length) {
        updateState({
          activeConflicts: managerConflicts,
          hasUnresolvedConflicts: managerConflicts.length > 0,
        })
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkInterval)
  }, [state.activeConflicts.length, updateState])

  return {
    ...state,
    checkForConflicts,
    resolveConflicts,
    resolveConflict,
    clearConflicts,
    exportConflictData,
  }
}

// Higher-order hook for workout operations with conflict resolution
export function useWorkoutWithConflictResolution() {
  const conflictResolution = useConflictResolution()
  const workoutStore = useWorkoutStore()

  const executeWithConflictCheck = useCallback(
    async <T>(
      operation: () => Promise<T>,
      onConflict?: (conflicts: ConflictData[]) => void,
    ): Promise<{ result?: T; conflicts?: ConflictData[]; success: boolean }> => {
      try {
        // Execute the operation
        const result = await operation()

        // This would typically include a server check here
        // For now, we'll simulate checking for conflicts
        const conflicts = conflictResolution.activeConflicts

        if (conflicts.length > 0) {
          onConflict?.(conflicts)
          return { conflicts, success: false }
        }

        return { result, success: true }
      } catch (error) {
        console.error('Operation failed:', error)

        // Check if this might be a conflict-related error
        if (error instanceof Error && error.message.includes('conflict')) {
          // Trigger conflict detection
          // This would normally be done with server data
          const conflicts = conflictResolution.activeConflicts
          onConflict?.(conflicts)
          return { conflicts, success: false }
        }

        throw error
      }
    },
    [conflictResolution],
  )

  return {
    ...conflictResolution,
    executeWithConflictCheck,
    workoutStore,
  }
}
