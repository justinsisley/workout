import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Program, UserProgress } from '@/types/program'
import type { ProgramProgress, ProgramAnalytics } from '@/utils/progress'
import {
  calculateProgramProgress,
  calculateProgramAnalytics,
  validateProgressConsistency,
} from '@/utils/progress'

const PROGRAM_STORAGE_KEY = 'workout-app-program'

export interface ProgramState {
  currentProgram: Program | null
  userProgress: UserProgress | null
  isLoading: boolean
  isSyncing: boolean
  lastSyncTimestamp: number | null

  // Calculated progress data
  calculatedProgress: ProgramProgress | null
  programAnalytics: ProgramAnalytics | null

  // Optimistic update state
  pendingProgressUpdates: UserProgress | null
  optimisticUpdateId: string | null

  // Actions
  setCurrentProgram: (program: Program | null) => void
  setUserProgress: (progress: UserProgress | null) => void
  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
  clearProgram: () => void

  // Progress-specific actions
  updateProgressOptimistically: (progress: UserProgress) => void
  revertOptimisticUpdate: () => void
  confirmOptimisticUpdate: () => void
  calculateAndSetProgress: () => void
  initializeProgressData: (program: Program, progress: UserProgress, startDate?: Date) => void

  // Data synchronization
  markSyncTimestamp: () => void
  needsSync: () => boolean
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      currentProgram: null,
      userProgress: null,
      isLoading: false,
      isSyncing: false,
      lastSyncTimestamp: null,
      calculatedProgress: null,
      programAnalytics: null,
      pendingProgressUpdates: null,
      optimisticUpdateId: null,

      setCurrentProgram: (program: Program | null) => {
        set({ currentProgram: program, isLoading: false })

        // Recalculate progress when program changes
        const { userProgress } = get()
        if (program && userProgress) {
          get().calculateAndSetProgress()
        }
      },

      setUserProgress: (progress: UserProgress | null) => {
        set({ userProgress: progress, isLoading: false })

        // Recalculate progress when user progress changes
        const { currentProgram } = get()
        if (currentProgram && progress) {
          get().calculateAndSetProgress()
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setSyncing: (syncing: boolean) => {
        set({ isSyncing: syncing })
      },

      clearProgram: () => {
        set({
          currentProgram: null,
          userProgress: null,
          isLoading: false,
          isSyncing: false,
          lastSyncTimestamp: null,
          calculatedProgress: null,
          programAnalytics: null,
          pendingProgressUpdates: null,
          optimisticUpdateId: null,
        })
      },

      // Progress-specific actions
      updateProgressOptimistically: (progress: UserProgress) => {
        const optimisticUpdateId = Date.now().toString()

        set({
          pendingProgressUpdates: progress,
          optimisticUpdateId,
          userProgress: progress, // Apply optimistic update immediately
        })

        // Recalculate progress with optimistic data
        get().calculateAndSetProgress()
      },

      revertOptimisticUpdate: () => {
        const { pendingProgressUpdates } = get()
        if (pendingProgressUpdates) {
          // Revert to the state before optimistic update
          set({
            pendingProgressUpdates: null,
            optimisticUpdateId: null,
          })

          // Note: In a real scenario, we'd need to store the previous state
          // For now, we'll let the next sync resolve any discrepancies
          get().calculateAndSetProgress()
        }
      },

      confirmOptimisticUpdate: () => {
        set({
          pendingProgressUpdates: null,
          optimisticUpdateId: null,
        })

        // Mark successful sync
        get().markSyncTimestamp()
      },

      calculateAndSetProgress: () => {
        const { currentProgram, userProgress } = get()

        if (!currentProgram || !userProgress) {
          set({
            calculatedProgress: null,
            programAnalytics: null,
          })
          return
        }

        // Validate progress consistency
        const validation = validateProgressConsistency(currentProgram, userProgress)
        if (!validation.isValid) {
          console.warn('Progress validation failed:', validation.errors)
          // Continue with calculation but log issues
        }

        // Calculate comprehensive progress data
        const calculatedProgress = calculateProgramProgress(currentProgram, userProgress)

        // Calculate program analytics (without start date for now)
        const programAnalytics = calculateProgramAnalytics(currentProgram, userProgress)

        set({
          calculatedProgress,
          programAnalytics,
        })
      },

      initializeProgressData: (program: Program, progress: UserProgress, startDate?: Date) => {
        // Set core data
        set({
          currentProgram: program,
          userProgress: progress,
          isLoading: false,
        })

        // Calculate comprehensive progress data
        const calculatedProgress = calculateProgramProgress(program, progress)
        const programAnalytics = calculateProgramAnalytics(program, progress, startDate)

        set({
          calculatedProgress,
          programAnalytics,
        })

        // Mark as synced
        get().markSyncTimestamp()
      },

      // Data synchronization
      markSyncTimestamp: () => {
        set({ lastSyncTimestamp: Date.now() })
      },

      needsSync: () => {
        const { lastSyncTimestamp, pendingProgressUpdates } = get()

        // Need sync if there are pending updates or no recent sync
        if (pendingProgressUpdates) return true
        if (!lastSyncTimestamp) return true

        // Consider sync needed if it's been more than 5 minutes
        const SYNC_THRESHOLD = 5 * 60 * 1000 // 5 minutes
        return Date.now() - lastSyncTimestamp > SYNC_THRESHOLD
      },
    }),
    {
      name: PROGRAM_STORAGE_KEY,
      partialize: (state) => ({
        currentProgram: state.currentProgram,
        userProgress: state.userProgress,
        lastSyncTimestamp: state.lastSyncTimestamp,
        // Note: We don't persist calculated progress as it can be recalculated
        // We also don't persist pending updates as they should be resolved on app start
      }),
      onRehydrateStorage: () => (state) => {
        // Recalculate progress data on app initialization
        if (state?.currentProgram && state?.userProgress) {
          state.calculateAndSetProgress()
        }
      },
    },
  ),
)
