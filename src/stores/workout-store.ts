import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MilestoneDay, DayExercise } from '@/types/program'

export interface WorkoutState {
  // Session state
  isSessionActive: boolean
  sessionStartTime: number | null
  currentDay: MilestoneDay | null

  // Progress tracking
  currentExerciseIndex: number
  completedExercises: string[]
  currentRound: number
  totalExercisesCompleted: number

  // Actions
  startSession: (day: MilestoneDay) => void
  endSession: () => void
  setCurrentExercise: (index: number) => void
  completeExercise: (exerciseId: string) => void
  completeRound: () => void
  resetSession: () => void

  // Navigation helpers
  canNavigateNext: () => boolean
  canNavigatePrevious: () => boolean
  getNextExercise: () => DayExercise | null
  getPreviousExercise: () => DayExercise | null
  getCurrentExercise: () => DayExercise | null
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSessionActive: false,
      sessionStartTime: null,
      currentDay: null,
      currentExerciseIndex: 0,
      completedExercises: [],
      currentRound: 1,
      totalExercisesCompleted: 0,

      startSession: (day: MilestoneDay) => {
        set({
          isSessionActive: true,
          sessionStartTime: Date.now(),
          currentDay: day,
          currentExerciseIndex: 0,
          completedExercises: [],
          currentRound: 1,
          totalExercisesCompleted: 0,
        })
      },

      endSession: () => {
        set({
          isSessionActive: false,
          sessionStartTime: null,
          currentDay: null,
          currentExerciseIndex: 0,
          completedExercises: [],
          currentRound: 1,
          totalExercisesCompleted: 0,
        })
      },

      setCurrentExercise: (index: number) => {
        const { currentDay } = get()
        if (currentDay?.exercises && index >= 0 && index < currentDay.exercises.length) {
          set({ currentExerciseIndex: index })
        }
      },

      completeExercise: (exerciseId: string) => {
        const { completedExercises, totalExercisesCompleted } = get()

        // Only add if not already completed
        if (!completedExercises.includes(exerciseId)) {
          set({
            completedExercises: [...completedExercises, exerciseId],
            totalExercisesCompleted: totalExercisesCompleted + 1,
          })
        }
      },

      completeRound: () => {
        const { currentRound } = get()
        set({
          currentRound: currentRound + 1,
          currentExerciseIndex: 0, // Reset to start of round for AMRAP
        })
      },

      resetSession: () => {
        set({
          currentExerciseIndex: 0,
          completedExercises: [],
          currentRound: 1,
          totalExercisesCompleted: 0,
        })
      },

      // Navigation helpers
      canNavigateNext: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises) return false
        return currentExerciseIndex < currentDay.exercises.length - 1
      },

      canNavigatePrevious: () => {
        const { currentExerciseIndex } = get()
        return currentExerciseIndex > 0
      },

      getNextExercise: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises || !get().canNavigateNext()) return null
        return currentDay.exercises[currentExerciseIndex + 1] || null
      },

      getPreviousExercise: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises || !get().canNavigatePrevious()) return null
        return currentDay.exercises[currentExerciseIndex - 1] || null
      },

      getCurrentExercise: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises) return null
        return currentDay.exercises[currentExerciseIndex] || null
      },
    }),
    {
      name: 'workout-session',
      partialize: (state) => ({
        isSessionActive: state.isSessionActive,
        sessionStartTime: state.sessionStartTime,
        currentDay: state.currentDay,
        currentExerciseIndex: state.currentExerciseIndex,
        completedExercises: state.completedExercises,
        currentRound: state.currentRound,
        totalExercisesCompleted: state.totalExercisesCompleted,
      }),
    },
  ),
)
