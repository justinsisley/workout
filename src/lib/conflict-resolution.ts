interface ConflictData {
  local: any
  remote: any
  lastSyncTime: number
  conflictType: 'exercise_progress' | 'day_completion' | 'milestone_advancement' | 'user_progress'
  fieldPath: string[]
  conflictId: string
}

interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'merge' | 'user_decides'
  resolvedData: any
  metadata: {
    resolvedAt: number
    strategy: string
    userChoice?: boolean
    mergeDetails?: string[]
  }
}

interface ConflictResolver {
  canResolve: (conflict: ConflictData) => boolean
  resolve: (conflict: ConflictData, userChoice?: any) => ConflictResolution
  priority: number
}

class DataConflictManager {
  private static instance: DataConflictManager
  private resolvers: Map<string, ConflictResolver> = new Map()
  private activeConflicts: Map<string, ConflictData> = new Map()
  private resolvedConflicts: Map<string, ConflictResolution> = new Map()

  static getInstance(): DataConflictManager {
    if (!DataConflictManager.instance) {
      DataConflictManager.instance = new DataConflictManager()
    }
    return DataConflictManager.instance
  }

  constructor() {
    this.registerDefaultResolvers()
  }

  private registerDefaultResolvers(): void {
    // Exercise Progress Resolver - Latest timestamp wins for exercise data
    this.registerResolver('exercise_progress_timestamp', {
      canResolve: (conflict) => conflict.conflictType === 'exercise_progress',
      resolve: (conflict) => {
        const localTime = conflict.local?.completedAt || conflict.local?.timestamp || 0
        const remoteTime = conflict.remote?.completedAt || conflict.remote?.timestamp || 0

        const useLocal = localTime > remoteTime
        return {
          strategy: useLocal ? 'local_wins' : 'remote_wins',
          resolvedData: useLocal ? conflict.local : conflict.remote,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'timestamp_based',
            mergeDetails: [
              `Chose ${useLocal ? 'local' : 'remote'} data based on timestamp (${useLocal ? localTime : remoteTime})`,
            ],
          },
        }
      },
      priority: 8,
    })

    // Day Completion Resolver - Merge exercise completions, use latest day status
    this.registerResolver('day_completion_merge', {
      canResolve: (conflict) => conflict.conflictType === 'day_completion',
      resolve: (conflict) => {
        const localData = conflict.local || {}
        const remoteData = conflict.remote || {}

        // Merge completed exercises (union of both sets)
        const localCompletedExercises = new Set(localData.completedExercises || [])
        const remoteCompletedExercises = new Set(remoteData.completedExercises || [])
        const mergedCompletedExercises = Array.from(
          new Set([...localCompletedExercises, ...remoteCompletedExercises]),
        )

        // Use latest completion time for day status
        const localDayCompletedAt = localData.dayCompletedAt || 0
        const remoteDayCompletedAt = remoteData.dayCompletedAt || 0
        const useLocalDayStatus = localDayCompletedAt > remoteDayCompletedAt

        const resolved = {
          ...localData,
          ...remoteData,
          completedExercises: mergedCompletedExercises,
          dayCompleted: useLocalDayStatus ? localData.dayCompleted : remoteData.dayCompleted,
          dayCompletedAt: Math.max(localDayCompletedAt, remoteDayCompletedAt),
          currentExerciseIndex: Math.max(
            localData.currentExerciseIndex || 0,
            remoteData.currentExerciseIndex || 0,
          ),
        }

        return {
          strategy: 'merge',
          resolvedData: resolved,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'smart_merge',
            mergeDetails: [
              `Merged ${mergedCompletedExercises.length} completed exercises`,
              `Used ${useLocalDayStatus ? 'local' : 'remote'} day completion status`,
              `Advanced to exercise index ${resolved.currentExerciseIndex}`,
            ],
          },
        }
      },
      priority: 9,
    })

    // Milestone Progress Resolver - Use higher milestone/day progress
    this.registerResolver('milestone_progress_advance', {
      canResolve: (conflict) => conflict.conflictType === 'milestone_advancement',
      resolve: (conflict) => {
        const localData = conflict.local || {}
        const remoteData = conflict.remote || {}

        const localMilestone = localData.currentMilestone || 0
        const remoteMilestone = remoteData.currentMilestone || 0
        const localDay = localData.currentDay || 0
        const remoteDay = remoteData.currentDay || 0

        // Choose the most advanced progress
        let useLocal = false
        if (localMilestone > remoteMilestone) {
          useLocal = true
        } else if (localMilestone === remoteMilestone && localDay > remoteDay) {
          useLocal = true
        }

        const resolved = useLocal ? localData : remoteData

        return {
          strategy: useLocal ? 'local_wins' : 'remote_wins',
          resolvedData: resolved,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'progress_advancement',
            mergeDetails: [
              `Chose ${useLocal ? 'local' : 'remote'} progress`,
              `Milestone ${resolved.currentMilestone}, Day ${resolved.currentDay}`,
              `Total workouts: ${resolved.totalWorkoutsCompleted || 0}`,
            ],
          },
        }
      },
      priority: 10,
    })

    // User Progress Resolver - Merge stats, use latest for position data
    this.registerResolver('user_progress_merge', {
      canResolve: (conflict) => conflict.conflictType === 'user_progress',
      resolve: (conflict) => {
        const localData = conflict.local || {}
        const remoteData = conflict.remote || {}

        // Merge statistics (take max values)
        const resolved = {
          ...remoteData,
          ...localData,
          totalWorkoutsCompleted: Math.max(
            localData.totalWorkoutsCompleted || 0,
            remoteData.totalWorkoutsCompleted || 0,
          ),
          totalExercisesCompleted: Math.max(
            localData.totalExercisesCompleted || 0,
            remoteData.totalExercisesCompleted || 0,
          ),
          totalWorkoutTime: Math.max(
            localData.totalWorkoutTime || 0,
            remoteData.totalWorkoutTime || 0,
          ),
          // Use most advanced position
          currentMilestone: Math.max(
            localData.currentMilestone || 0,
            remoteData.currentMilestone || 0,
          ),
          currentDay: Math.max(localData.currentDay || 0, remoteData.currentDay || 0),
          lastWorkoutDate: Math.max(
            new Date(localData.lastWorkoutDate || 0).getTime(),
            new Date(remoteData.lastWorkoutDate || 0).getTime(),
          ),
        }

        return {
          strategy: 'merge',
          resolvedData: resolved,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'stats_merge',
            mergeDetails: [
              `Total workouts: ${resolved.totalWorkoutsCompleted}`,
              `Current position: M${resolved.currentMilestone}D${resolved.currentDay}`,
              `Last workout: ${new Date(resolved.lastWorkoutDate).toLocaleString()}`,
            ],
          },
        }
      },
      priority: 7,
    })

    // Generic Timestamp Resolver - Fallback for any timestamped data
    this.registerResolver('generic_timestamp', {
      canResolve: (conflict) => {
        return !!(
          conflict.local?.timestamp ||
          conflict.remote?.timestamp ||
          conflict.local?.updatedAt ||
          conflict.remote?.updatedAt
        )
      },
      resolve: (conflict) => {
        const localTime = conflict.local?.timestamp || conflict.local?.updatedAt || 0
        const remoteTime = conflict.remote?.timestamp || conflict.remote?.updatedAt || 0

        const useLocal = localTime > remoteTime
        return {
          strategy: useLocal ? 'local_wins' : 'remote_wins',
          resolvedData: useLocal ? conflict.local : conflict.remote,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'generic_timestamp',
            mergeDetails: [`Used ${useLocal ? 'local' : 'remote'} data (newer timestamp)`],
          },
        }
      },
      priority: 1, // Lowest priority - fallback
    })
  }

  registerResolver(name: string, resolver: ConflictResolver): void {
    this.resolvers.set(name, resolver)
  }

  detectConflict(
    localData: any,
    remoteData: any,
    conflictType: ConflictData['conflictType'],
    fieldPath: string[] = [],
  ): ConflictData | null {
    // Skip if data is identical
    if (JSON.stringify(localData) === JSON.stringify(remoteData)) {
      return null
    }

    // Generate conflict ID
    const conflictId = `${conflictType}_${fieldPath.join('.')}_${Date.now()}`

    const conflict: ConflictData = {
      local: localData,
      remote: remoteData,
      lastSyncTime: this.getLastSyncTime(),
      conflictType,
      fieldPath,
      conflictId,
    }

    return conflict
  }

  async resolveConflict(conflict: ConflictData, userChoice?: any): Promise<ConflictResolution> {
    // Check if already resolved
    const existingResolution = this.resolvedConflicts.get(conflict.conflictId)
    if (existingResolution) {
      return existingResolution
    }

    // Find appropriate resolver
    const applicableResolvers = Array.from(this.resolvers.values())
      .filter((resolver) => resolver.canResolve(conflict))
      .sort((a, b) => b.priority - a.priority)

    if (applicableResolvers.length === 0) {
      // No resolver found - user must decide
      return {
        strategy: 'user_decides',
        resolvedData: null,
        metadata: {
          resolvedAt: Date.now(),
          strategy: 'user_decision_required',
        },
      }
    }

    // Use highest priority resolver
    const resolver = applicableResolvers[0]
    if (!resolver) {
      return {
        strategy: 'user_decides',
        resolvedData: null,
        metadata: {
          resolvedAt: Date.now(),
          strategy: 'no_resolver_found',
        },
      }
    }
    const resolution = resolver.resolve(conflict, userChoice)

    // Store resolution
    this.resolvedConflicts.set(conflict.conflictId, resolution)
    this.activeConflicts.delete(conflict.conflictId)

    return resolution
  }

  addActiveConflict(conflict: ConflictData): void {
    this.activeConflicts.set(conflict.conflictId, conflict)
  }

  getActiveConflicts(): ConflictData[] {
    return Array.from(this.activeConflicts.values())
  }

  getResolvedConflicts(): ConflictResolution[] {
    return Array.from(this.resolvedConflicts.values())
  }

  clearResolvedConflicts(): void {
    this.resolvedConflicts.clear()
  }

  // Utility methods
  private getLastSyncTime(): number {
    try {
      const lastSync = localStorage.getItem('workout-last-sync')
      return lastSync ? parseInt(lastSync, 10) : 0
    } catch {
      return 0
    }
  }

  // Batch conflict resolution for multiple conflicts
  async resolveBatchConflicts(
    conflicts: ConflictData[],
    strategy: 'auto' | 'local_wins_all' | 'remote_wins_all' = 'auto',
  ): Promise<ConflictResolution[]> {
    const results: ConflictResolution[] = []

    for (const conflict of conflicts) {
      let resolution: ConflictResolution

      if (strategy === 'auto') {
        resolution = await this.resolveConflict(conflict)
      } else {
        const winStrategy = strategy === 'local_wins_all' ? 'local_wins' : 'remote_wins'
        const data = strategy === 'local_wins_all' ? conflict.local : conflict.remote

        resolution = {
          strategy: winStrategy,
          resolvedData: data,
          metadata: {
            resolvedAt: Date.now(),
            strategy: 'batch_resolution',
            userChoice: true,
          },
        }
      }

      results.push(resolution)
    }

    return results
  }

  // Export conflict data for debugging
  exportConflictData(): {
    active: ConflictData[]
    resolved: ConflictResolution[]
    resolverCount: number
  } {
    return {
      active: this.getActiveConflicts(),
      resolved: this.getResolvedConflicts(),
      resolverCount: this.resolvers.size,
    }
  }
}

// Export singleton instance
export const dataConflictManager = DataConflictManager.getInstance()

// Export types
export type { ConflictData, ConflictResolution, ConflictResolver }

// Helper functions for workout-specific conflict detection
export function detectWorkoutConflicts(
  localWorkoutData: any,
  remoteWorkoutData: any,
): ConflictData[] {
  const conflicts: ConflictData[] = []

  // Check exercise progress conflicts
  if (localWorkoutData.exerciseProgress && remoteWorkoutData.exerciseProgress) {
    for (const exerciseId in localWorkoutData.exerciseProgress) {
      if (remoteWorkoutData.exerciseProgress[exerciseId]) {
        const conflict = dataConflictManager.detectConflict(
          localWorkoutData.exerciseProgress[exerciseId],
          remoteWorkoutData.exerciseProgress[exerciseId],
          'exercise_progress',
          ['exerciseProgress', exerciseId],
        )
        if (conflict) conflicts.push(conflict)
      }
    }
  }

  // Check day completion conflicts
  const dayConflict = dataConflictManager.detectConflict(
    {
      completedExercises: localWorkoutData.completedExercises,
      dayCompleted: localWorkoutData.dayCompleted,
      currentExerciseIndex: localWorkoutData.currentExerciseIndex,
    },
    {
      completedExercises: remoteWorkoutData.completedExercises,
      dayCompleted: remoteWorkoutData.dayCompleted,
      currentExerciseIndex: remoteWorkoutData.currentExerciseIndex,
    },
    'day_completion',
  )
  if (dayConflict) conflicts.push(dayConflict)

  // Check user progress conflicts
  const progressConflict = dataConflictManager.detectConflict(
    {
      currentMilestone: localWorkoutData.currentMilestone,
      currentDay: localWorkoutData.currentDay,
      totalWorkoutsCompleted: localWorkoutData.totalWorkoutsCompleted,
    },
    {
      currentMilestone: remoteWorkoutData.currentMilestone,
      currentDay: remoteWorkoutData.currentDay,
      totalWorkoutsCompleted: remoteWorkoutData.totalWorkoutsCompleted,
    },
    'user_progress',
  )
  if (progressConflict) conflicts.push(progressConflict)

  return conflicts
}
