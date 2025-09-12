import { describe, it, expect, beforeEach } from 'vitest'
import {
  dataConflictManager,
  detectWorkoutConflicts,
  type ConflictData,
} from '@/lib/conflict-resolution'

describe('ConflictResolution', () => {
  beforeEach(() => {
    // Clear any existing conflicts
    dataConflictManager.getActiveConflicts().forEach((conflict) => {
      dataConflictManager['activeConflicts'].delete(conflict.conflictId)
    })
    dataConflictManager.clearResolvedConflicts()
  })

  describe('DataConflictManager', () => {
    describe('detectConflict', () => {
      it('returns null for identical data', () => {
        const data = { value: 'same' }
        const conflict = dataConflictManager.detectConflict(data, data, 'exercise_progress')

        expect(conflict).toBeNull()
      })

      it('detects conflicts in different data', () => {
        const localData = { value: 'local', timestamp: 1000 }
        const remoteData = { value: 'remote', timestamp: 2000 }

        const conflict = dataConflictManager.detectConflict(
          localData,
          remoteData,
          'exercise_progress',
          ['exercises', 'ex-1'],
        )

        expect(conflict).not.toBeNull()
        expect(conflict!.conflictType).toBe('exercise_progress')
        expect(conflict!.local).toEqual(localData)
        expect(conflict!.remote).toEqual(remoteData)
        expect(conflict!.fieldPath).toEqual(['exercises', 'ex-1'])
      })

      it('generates unique conflict IDs', () => {
        const data1 = { value: 'local1' }
        const data2 = { value: 'remote1' }

        const conflict1 = dataConflictManager.detectConflict(data1, data2, 'exercise_progress')
        const conflict2 = dataConflictManager.detectConflict(data1, data2, 'exercise_progress')

        expect(conflict1!.conflictId).not.toBe(conflict2!.conflictId)
      })
    })

    describe('resolveConflict - Exercise Progress', () => {
      it('resolves exercise progress conflicts using timestamp', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3, reps: 10, timestamp: 2000 },
          remote: { sets: 4, reps: 8, timestamp: 1000 },
          lastSyncTime: 500,
          fieldPath: ['exercises', 'ex-1'],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('local_wins')
        expect(resolution.resolvedData).toEqual(conflict.local)
        expect(resolution.metadata.strategy).toBe('timestamp_based')
      })

      it('prefers remote data when remote timestamp is newer', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3, reps: 10, timestamp: 1000 },
          remote: { sets: 4, reps: 8, timestamp: 2000 },
          lastSyncTime: 500,
          fieldPath: ['exercises', 'ex-1'],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('remote_wins')
        expect(resolution.resolvedData).toEqual(conflict.remote)
      })
    })

    describe('resolveConflict - Day Completion', () => {
      it('merges completed exercises and uses latest day status', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'day_completion',
          local: {
            completedExercises: ['ex-1', 'ex-2'],
            dayCompleted: true,
            dayCompletedAt: 2000,
            currentExerciseIndex: 2,
          },
          remote: {
            completedExercises: ['ex-2', 'ex-3'],
            dayCompleted: false,
            dayCompletedAt: 1000,
            currentExerciseIndex: 1,
          },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('merge')
        expect(resolution.resolvedData.completedExercises).toContain('ex-1')
        expect(resolution.resolvedData.completedExercises).toContain('ex-2')
        expect(resolution.resolvedData.completedExercises).toContain('ex-3')
        expect(resolution.resolvedData.dayCompleted).toBe(true) // Local is newer
        expect(resolution.resolvedData.currentExerciseIndex).toBe(2) // Max of both
      })
    })

    describe('resolveConflict - Milestone Advancement', () => {
      it('uses most advanced milestone progress', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'milestone_advancement',
          local: {
            currentMilestone: 2,
            currentDay: 1,
            totalWorkoutsCompleted: 10,
          },
          remote: {
            currentMilestone: 1,
            currentDay: 5,
            totalWorkoutsCompleted: 8,
          },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('local_wins')
        expect(resolution.resolvedData).toEqual(conflict.local)
        expect(resolution.metadata.strategy).toBe('progress_advancement')
      })

      it('prefers remote when remote milestone is higher', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'milestone_advancement',
          local: { currentMilestone: 1, currentDay: 5 },
          remote: { currentMilestone: 2, currentDay: 1 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('remote_wins')
        expect(resolution.resolvedData).toEqual(conflict.remote)
      })

      it('uses day comparison when milestones are equal', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'milestone_advancement',
          local: { currentMilestone: 1, currentDay: 5 },
          remote: { currentMilestone: 1, currentDay: 3 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('local_wins')
        expect(resolution.resolvedData).toEqual(conflict.local)
      })
    })

    describe('resolveConflict - User Progress', () => {
      it('merges user statistics and uses most advanced position', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'user_progress',
          local: {
            totalWorkoutsCompleted: 15,
            totalExercisesCompleted: 150,
            currentMilestone: 2,
            currentDay: 1,
            lastWorkoutDate: '2023-12-01',
          },
          remote: {
            totalWorkoutsCompleted: 12,
            totalExercisesCompleted: 200,
            currentMilestone: 1,
            currentDay: 8,
            lastWorkoutDate: '2023-12-02',
          },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        expect(resolution.strategy).toBe('merge')
        expect(resolution.resolvedData.totalWorkoutsCompleted).toBe(15) // Max
        expect(resolution.resolvedData.totalExercisesCompleted).toBe(200) // Max
        expect(resolution.resolvedData.currentMilestone).toBe(2) // Max
        expect(resolution.resolvedData.lastWorkoutDate).toBe(new Date('2023-12-02').getTime()) // Latest date
      })
    })

    describe('resolveBatchConflicts', () => {
      it('resolves multiple conflicts automatically', async () => {
        const conflicts: ConflictData[] = [
          {
            conflictId: 'conflict-1',
            conflictType: 'exercise_progress',
            local: { sets: 3, timestamp: 2000 },
            remote: { sets: 4, timestamp: 1000 },
            lastSyncTime: 500,
            fieldPath: [],
          },
          {
            conflictId: 'conflict-2',
            conflictType: 'day_completion',
            local: { completedExercises: ['ex-1'] },
            remote: { completedExercises: ['ex-2'] },
            lastSyncTime: 500,
            fieldPath: [],
          },
        ]

        const resolutions = await dataConflictManager.resolveBatchConflicts(conflicts, 'auto')

        expect(resolutions).toHaveLength(2)
        expect(resolutions[0]?.strategy).toBe('local_wins') // Local timestamp is newer
        expect(resolutions[1]?.strategy).toBe('merge') // Day completion merges
      })

      it('applies local wins all strategy', async () => {
        const conflicts: ConflictData[] = [
          {
            conflictId: 'conflict-1',
            conflictType: 'exercise_progress',
            local: { sets: 3 },
            remote: { sets: 4 },
            lastSyncTime: 500,
            fieldPath: [],
          },
          {
            conflictId: 'conflict-2',
            conflictType: 'user_progress',
            local: { workouts: 10 },
            remote: { workouts: 8 },
            lastSyncTime: 500,
            fieldPath: [],
          },
        ]

        const resolutions = await dataConflictManager.resolveBatchConflicts(
          conflicts,
          'local_wins_all',
        )

        expect(resolutions).toHaveLength(2)
        expect(resolutions[0]?.strategy).toBe('local_wins')
        expect(resolutions[0]?.resolvedData).toEqual({ sets: 3 })
        expect(resolutions[1]?.strategy).toBe('local_wins')
        expect(resolutions[1]?.resolvedData).toEqual({ workouts: 10 })
      })

      it('applies remote wins all strategy', async () => {
        const conflicts: ConflictData[] = [
          {
            conflictId: 'conflict-1',
            conflictType: 'exercise_progress',
            local: { sets: 3 },
            remote: { sets: 4 },
            lastSyncTime: 500,
            fieldPath: [],
          },
        ]

        const resolutions = await dataConflictManager.resolveBatchConflicts(
          conflicts,
          'remote_wins_all',
        )

        expect(resolutions).toHaveLength(1)
        expect(resolutions[0]?.strategy).toBe('remote_wins')
        expect(resolutions[0]?.resolvedData).toEqual({ sets: 4 })
      })
    })

    describe('conflict tracking', () => {
      it('tracks active conflicts', () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3 },
          remote: { sets: 4 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        dataConflictManager.addActiveConflict(conflict)

        const activeConflicts = dataConflictManager.getActiveConflicts()
        expect(activeConflicts).toContain(conflict)
        expect(activeConflicts).toHaveLength(1)
      })

      it('stores resolved conflicts', async () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3, timestamp: 2000 },
          remote: { sets: 4, timestamp: 1000 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        const resolution = await dataConflictManager.resolveConflict(conflict)

        const resolvedConflicts = dataConflictManager.getResolvedConflicts()
        expect(resolvedConflicts).toContain(resolution)
      })

      it('clears resolved conflicts', () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3 },
          remote: { sets: 4 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        dataConflictManager['resolvedConflicts'].set(conflict.conflictId, {
          strategy: 'local_wins',
          resolvedData: conflict.local,
          metadata: { resolvedAt: Date.now(), strategy: 'test' },
        })

        expect(dataConflictManager.getResolvedConflicts()).toHaveLength(1)

        dataConflictManager.clearResolvedConflicts()

        expect(dataConflictManager.getResolvedConflicts()).toHaveLength(0)
      })

      it('exports conflict data for debugging', () => {
        const conflict: ConflictData = {
          conflictId: 'test-conflict',
          conflictType: 'exercise_progress',
          local: { sets: 3 },
          remote: { sets: 4 },
          lastSyncTime: 500,
          fieldPath: [],
        }

        dataConflictManager.addActiveConflict(conflict)

        const exportData = dataConflictManager.exportConflictData()

        expect(exportData.active).toContain(conflict)
        expect(exportData.resolverCount).toBeGreaterThan(0)
      })
    })
  })

  describe('detectWorkoutConflicts', () => {
    it('detects exercise progress conflicts', () => {
      const localData = {
        exerciseProgress: {
          'ex-1': { sets: 3, reps: 10, timestamp: 2000 },
          'ex-2': { sets: 2, reps: 15, timestamp: 1500 },
        },
      }

      const remoteData = {
        exerciseProgress: {
          'ex-1': { sets: 4, reps: 8, timestamp: 1000 },
          'ex-3': { sets: 1, reps: 20, timestamp: 1800 },
        },
      }

      const conflicts = detectWorkoutConflicts(localData, remoteData)

      expect(conflicts).toHaveLength(2) // ex-1 conflict + day completion
      const exerciseConflict = conflicts.find((c) => c.conflictType === 'exercise_progress')
      expect(exerciseConflict).toBeDefined()
      expect(exerciseConflict!.fieldPath).toEqual(['exerciseProgress', 'ex-1'])
    })

    it('detects day completion conflicts', () => {
      const localData = {
        completedExercises: ['ex-1', 'ex-2'],
        dayCompleted: true,
        currentExerciseIndex: 2,
      }

      const remoteData = {
        completedExercises: ['ex-2', 'ex-3'],
        dayCompleted: false,
        currentExerciseIndex: 1,
      }

      const conflicts = detectWorkoutConflicts(localData, remoteData)

      expect(conflicts).toHaveLength(2) // day completion + user progress
      const dayConflict = conflicts.find((c) => c.conflictType === 'day_completion')
      expect(dayConflict).toBeDefined()
    })

    it('detects user progress conflicts', () => {
      const localData = {
        currentMilestone: 2,
        currentDay: 1,
        totalWorkoutsCompleted: 15,
      }

      const remoteData = {
        currentMilestone: 1,
        currentDay: 8,
        totalWorkoutsCompleted: 12,
      }

      const conflicts = detectWorkoutConflicts(localData, remoteData)

      expect(conflicts).toHaveLength(2) // day completion + user progress
      const progressConflict = conflicts.find((c) => c.conflictType === 'user_progress')
      expect(progressConflict).toBeDefined()
    })

    it('returns empty array when no conflicts exist', () => {
      const identicalData = {
        exerciseProgress: { 'ex-1': { sets: 3 } },
        completedExercises: ['ex-1'],
        dayCompleted: true,
        currentMilestone: 1,
        currentDay: 1,
      }

      const conflicts = detectWorkoutConflicts(identicalData, identicalData)

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('Generic timestamp resolver fallback', () => {
    it('resolves unknown conflict types using timestamps', async () => {
      const conflict: ConflictData = {
        conflictId: 'test-conflict',
        conflictType: 'unknown_type' as any,
        local: { value: 'local', updatedAt: 2000 },
        remote: { value: 'remote', updatedAt: 1000 },
        lastSyncTime: 500,
        fieldPath: [],
      }

      const resolution = await dataConflictManager.resolveConflict(conflict)

      expect(resolution.strategy).toBe('local_wins')
      expect(resolution.resolvedData).toEqual(conflict.local)
      expect(resolution.metadata.strategy).toBe('generic_timestamp')
    })

    it('requires user decision when no resolver matches', async () => {
      const conflict: ConflictData = {
        conflictId: 'test-conflict',
        conflictType: 'unknown_type' as any,
        local: { value: 'local' }, // No timestamp
        remote: { value: 'remote' }, // No timestamp
        lastSyncTime: 500,
        fieldPath: [],
      }

      const resolution = await dataConflictManager.resolveConflict(conflict)

      expect(resolution.strategy).toBe('user_decides')
      expect(resolution.resolvedData).toBeNull()
    })
  })
})
