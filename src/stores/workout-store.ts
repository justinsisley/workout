import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MilestoneDay, DayExercise, Program, ProgramMilestone } from '@/types/program'

export interface ExerciseProgress {
  exerciseId: string
  isCompleted: boolean
  hasData: boolean
  completionPercentage: number
  lastUpdatedAt: number
  amrapData?:
    | {
        totalRoundsCompleted: number
        currentRoundProgress: number
        totalExercisesInRound: number
      }
    | undefined
}

export interface WorkoutState {
  // Program and position tracking
  currentProgram: Program | null
  currentMilestoneIndex: number
  currentDayIndex: number

  // Session state
  isSessionActive: boolean
  sessionStartTime: number | null
  currentDay: MilestoneDay | null

  // Enhanced progress tracking
  currentExerciseIndex: number
  completedExercises: string[]
  exerciseProgress: Record<string, ExerciseProgress>
  currentRound: number
  totalExercisesCompleted: number

  // AMRAP timer management
  amrapTimeRemaining: number | null // in seconds
  amrapTimerActive: boolean

  // Actions
  setCurrentProgram: (program: Program, milestoneIndex?: number, dayIndex?: number) => void
  setCurrentDay: (milestoneIndex: number, dayIndex: number) => void
  startSession: (day: MilestoneDay) => void
  endSession: () => void
  setCurrentExercise: (index: number) => void
  completeExercise: (exerciseId: string) => void
  updateExerciseProgress: (exerciseId: string, progress: Partial<ExerciseProgress>) => void
  updateAmrapProgress: (exerciseId: string, amrapData: ExerciseProgress['amrapData']) => void
  completeRound: () => void
  resetSession: () => void

  // Day progression actions
  advanceToNextExercise: () => boolean // Returns true if advancement successful
  advanceToNextExerciseAmrap: (
    timeRemaining: number,
  ) => 'next_exercise' | 'round_complete' | 'day_complete'
  completeDayWorkout: () => void
  isCurrentDayComplete: () => boolean
  isAmrapDay: () => boolean
  getRemainingExercises: () => number

  // Day completion detection methods
  isDayCompleteByExercises: () => boolean
  isDayCompleteByTime: (timeRemaining: number) => boolean
  getDayCompletionStats: () => {
    totalExercises: number
    completedExercises: number
    completionPercentage: number
    totalRounds?: number
    hasAnyProgress: boolean
  }
  shouldTriggerDayCompletion: (timeRemaining?: number) => boolean

  // Day advancement methods
  advanceToNextDay: (newMilestoneIndex: number, newDayIndex: number) => void
  getSessionDuration: () => number
  resetForNewDay: () => void

  // AMRAP timer methods
  startAmrapTimer: (durationInMinutes: number) => void
  updateAmrapTimer: (timeRemaining: number) => void
  pauseAmrapTimer: () => void
  resumeAmrapTimer: () => void
  stopAmrapTimer: () => void
  isAmrapTimeExpired: () => boolean

  // Program navigation helpers
  getCurrentMilestone: () => ProgramMilestone | null
  getCurrentDay: () => MilestoneDay | null
  canNavigateToNextDay: () => boolean
  canNavigateToPreviousDay: () => boolean
  getNextDay: () => {
    milestone: ProgramMilestone
    day: MilestoneDay
    milestoneIndex: number
    dayIndex: number
  } | null
  getPreviousDay: () => {
    milestone: ProgramMilestone
    day: MilestoneDay
    milestoneIndex: number
    dayIndex: number
  } | null

  // Exercise navigation helpers
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
      currentProgram: null,
      currentMilestoneIndex: 0,
      currentDayIndex: 0,
      isSessionActive: false,
      sessionStartTime: null,
      currentDay: null,
      currentExerciseIndex: 0,
      completedExercises: [],
      exerciseProgress: {},
      currentRound: 1,
      totalExercisesCompleted: 0,
      amrapTimeRemaining: null,
      amrapTimerActive: false,

      setCurrentProgram: (program: Program, milestoneIndex = 0, dayIndex = 0) => {
        const milestone = program.milestones[milestoneIndex]
        const day = milestone?.days[dayIndex]

        set({
          currentProgram: program,
          currentMilestoneIndex: milestoneIndex,
          currentDayIndex: dayIndex,
          currentDay: day || null,
          // Reset session state when changing program
          isSessionActive: false,
          sessionStartTime: null,
          currentExerciseIndex: 0,
          completedExercises: [],
          exerciseProgress: {},
          currentRound: 1,
          totalExercisesCompleted: 0,
        })
      },

      setCurrentDay: (milestoneIndex: number, dayIndex: number) => {
        const { currentProgram } = get()
        if (!currentProgram) return

        const milestone = currentProgram.milestones[milestoneIndex]
        const day = milestone?.days[dayIndex]

        if (day) {
          set({
            currentMilestoneIndex: milestoneIndex,
            currentDayIndex: dayIndex,
            currentDay: day,
            // Reset session state when changing day
            isSessionActive: false,
            sessionStartTime: null,
            currentExerciseIndex: 0,
            completedExercises: [],
            exerciseProgress: {},
            currentRound: 1,
            totalExercisesCompleted: 0,
          })
        }
      },

      startSession: (day: MilestoneDay) => {
        set({
          isSessionActive: true,
          sessionStartTime: Date.now(),
          currentDay: day,
          currentExerciseIndex: 0,
          completedExercises: [],
          exerciseProgress: {},
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
          exerciseProgress: {},
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
          exerciseProgress: {},
          currentRound: 1,
          totalExercisesCompleted: 0,
        })
      },

      updateExerciseProgress: (exerciseId: string, progress: Partial<ExerciseProgress>) => {
        const { exerciseProgress } = get()
        const currentProgress = exerciseProgress[exerciseId] || {
          exerciseId,
          isCompleted: false,
          hasData: false,
          completionPercentage: 0,
          lastUpdatedAt: Date.now(),
        }

        const updatedProgress = {
          ...currentProgress,
          ...progress,
          lastUpdatedAt: Date.now(),
        }

        set({
          exerciseProgress: {
            ...exerciseProgress,
            [exerciseId]: updatedProgress,
          },
        })

        // Update completedExercises array if exercise is now completed
        if (updatedProgress.isCompleted && !get().completedExercises.includes(exerciseId)) {
          const { completedExercises, totalExercisesCompleted } = get()
          set({
            completedExercises: [...completedExercises, exerciseId],
            totalExercisesCompleted: totalExercisesCompleted + 1,
          })
        }
      },

      updateAmrapProgress: (exerciseId: string, amrapData: ExerciseProgress['amrapData']) => {
        const { exerciseProgress } = get()
        const currentProgress = exerciseProgress[exerciseId] || {
          exerciseId,
          isCompleted: false,
          hasData: false,
          completionPercentage: 0,
          lastUpdatedAt: Date.now(),
        }

        const updatedProgress: ExerciseProgress = {
          ...currentProgress,
          lastUpdatedAt: Date.now(),
          // Update completion status based on AMRAP progress
          hasData: Boolean(amrapData?.totalRoundsCompleted),
          completionPercentage: amrapData
            ? Math.min(
                100,
                (amrapData.currentRoundProgress / amrapData.totalExercisesInRound) * 100,
              )
            : 0,
        }

        // Conditionally set amrapData only if it's provided
        if (amrapData !== undefined) {
          updatedProgress.amrapData = amrapData
        }

        set({
          exerciseProgress: {
            ...exerciseProgress,
            [exerciseId]: updatedProgress,
          },
        })
      },

      // Program navigation helpers
      getCurrentMilestone: () => {
        const { currentProgram, currentMilestoneIndex } = get()
        if (!currentProgram) return null
        return currentProgram.milestones[currentMilestoneIndex] || null
      },

      getCurrentDay: () => {
        const { currentProgram, currentMilestoneIndex, currentDayIndex } = get()
        if (!currentProgram) return null
        const milestone = currentProgram.milestones[currentMilestoneIndex]
        return milestone?.days[currentDayIndex] || null
      },

      canNavigateToNextDay: () => {
        const { currentProgram, currentMilestoneIndex, currentDayIndex } = get()
        if (!currentProgram) return false

        const milestone = currentProgram.milestones[currentMilestoneIndex]
        if (!milestone) return false

        // Check if there's a next day in current milestone
        if (currentDayIndex < milestone.days.length - 1) return true

        // Check if there's a next milestone
        return currentMilestoneIndex < currentProgram.milestones.length - 1
      },

      canNavigateToPreviousDay: () => {
        const { currentMilestoneIndex, currentDayIndex } = get()
        return currentMilestoneIndex > 0 || currentDayIndex > 0
      },

      getNextDay: () => {
        const { currentProgram, currentMilestoneIndex, currentDayIndex } = get()
        if (!currentProgram || !get().canNavigateToNextDay()) return null

        const milestone = currentProgram.milestones[currentMilestoneIndex]
        if (!milestone) return null

        // Try next day in current milestone first
        if (currentDayIndex < milestone.days.length - 1) {
          const nextDay = milestone.days[currentDayIndex + 1]
          if (nextDay) {
            return {
              milestone,
              day: nextDay,
              milestoneIndex: currentMilestoneIndex,
              dayIndex: currentDayIndex + 1,
            }
          }
        }

        // Move to first day of next milestone
        const nextMilestone = currentProgram.milestones[currentMilestoneIndex + 1]
        if (nextMilestone && nextMilestone.days.length > 0) {
          const firstDay = nextMilestone.days[0]
          if (firstDay) {
            return {
              milestone: nextMilestone,
              day: firstDay,
              milestoneIndex: currentMilestoneIndex + 1,
              dayIndex: 0,
            }
          }
        }

        return null
      },

      getPreviousDay: () => {
        const { currentProgram, currentMilestoneIndex, currentDayIndex } = get()
        if (!currentProgram || !get().canNavigateToPreviousDay()) return null

        // Try previous day in current milestone first
        if (currentDayIndex > 0) {
          const milestone = currentProgram.milestones[currentMilestoneIndex]
          if (!milestone) return null

          const prevDay = milestone.days[currentDayIndex - 1]
          if (prevDay) {
            return {
              milestone,
              day: prevDay,
              milestoneIndex: currentMilestoneIndex,
              dayIndex: currentDayIndex - 1,
            }
          }
        }

        // Move to last day of previous milestone
        const prevMilestone = currentProgram.milestones[currentMilestoneIndex - 1]
        if (prevMilestone && prevMilestone.days.length > 0) {
          const lastDayIndex = prevMilestone.days.length - 1
          const lastDay = prevMilestone.days[lastDayIndex]
          if (lastDay) {
            return {
              milestone: prevMilestone,
              day: lastDay,
              milestoneIndex: currentMilestoneIndex - 1,
              dayIndex: lastDayIndex,
            }
          }
        }

        return null
      },

      // Exercise navigation helpers
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

      // Day progression methods
      advanceToNextExercise: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises) return false

        const totalExercises = currentDay.exercises.length
        const nextIndex = currentExerciseIndex + 1

        // Check if we can advance to next exercise
        if (nextIndex < totalExercises) {
          set({ currentExerciseIndex: nextIndex })
          return true
        }

        // No more exercises - day is complete
        return false
      },

      advanceToNextExerciseAmrap: (timeRemaining: number) => {
        const { currentDay, currentExerciseIndex, currentRound } = get()
        if (!currentDay?.exercises) return 'day_complete'

        const totalExercises = currentDay.exercises.length

        // Check if time has expired
        if (timeRemaining <= 0) {
          return 'day_complete'
        }

        // Check if we've completed the last exercise in the round
        if (currentExerciseIndex >= totalExercises - 1) {
          // Round completed - restart at first exercise
          set({
            currentExerciseIndex: 0,
            currentRound: currentRound + 1,
          })
          return 'round_complete'
        } else {
          // Move to next exercise in current round
          set({ currentExerciseIndex: currentExerciseIndex + 1 })
          return 'next_exercise'
        }
      },

      completeDayWorkout: () => {
        const { currentDay } = get()
        if (!currentDay?.exercises) return

        const allExerciseIds = currentDay.exercises.map((ex) => ex.id)

        // Mark all exercises as completed
        set({
          completedExercises: allExerciseIds,
          totalExercisesCompleted: allExerciseIds.length,
        })
      },

      isCurrentDayComplete: () => {
        const { currentDay, completedExercises } = get()
        if (!currentDay?.exercises) return true

        const totalExercises = currentDay.exercises.length

        if (currentDay.isAmrap) {
          // For AMRAP days, completion is time-based, but we check if any exercise was completed
          return completedExercises.length > 0
        } else {
          // For regular days, all exercises must be completed
          return completedExercises.length >= totalExercises
        }
      },

      isAmrapDay: () => {
        const { currentDay } = get()
        return Boolean(currentDay?.isAmrap && currentDay.amrapDuration)
      },

      getRemainingExercises: () => {
        const { currentDay, currentExerciseIndex } = get()
        if (!currentDay?.exercises) return 0

        return Math.max(0, currentDay.exercises.length - currentExerciseIndex - 1)
      },

      // Day completion detection methods
      isDayCompleteByExercises: () => {
        const { currentDay, completedExercises } = get()
        if (!currentDay?.exercises) return true

        const totalExercises = currentDay.exercises.length
        return completedExercises.length >= totalExercises
      },

      isDayCompleteByTime: (timeRemaining: number) => {
        const { currentDay } = get()
        if (!currentDay?.isAmrap) return false

        return timeRemaining <= 0
      },

      getDayCompletionStats: () => {
        const { currentDay, completedExercises, currentRound, exerciseProgress } = get()

        if (!currentDay?.exercises) {
          return {
            totalExercises: 0,
            completedExercises: 0,
            completionPercentage: 100,
            hasAnyProgress: false,
          }
        }

        const totalExercises = currentDay.exercises.length
        const completedCount = completedExercises.length
        const completionPercentage =
          totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

        // Check if any exercise has progress data
        const hasAnyProgress = Object.values(exerciseProgress).some(
          (progress) =>
            progress.hasData || progress.isCompleted || progress.completionPercentage > 0,
        )

        const stats = {
          totalExercises,
          completedExercises: completedCount,
          completionPercentage,
          hasAnyProgress,
        }

        // Add AMRAP-specific data
        if (currentDay.isAmrap) {
          return {
            ...stats,
            totalRounds: currentRound,
          }
        }

        return stats
      },

      shouldTriggerDayCompletion: (timeRemaining?: number) => {
        const { currentDay } = get()
        if (!currentDay) return false

        if (currentDay.isAmrap) {
          // AMRAP completion is time-based
          if (timeRemaining !== undefined && timeRemaining <= 0) {
            // Check that user has made some progress
            const stats = get().getDayCompletionStats()
            return stats.hasAnyProgress
          }
          return false
        } else {
          // Regular workout completion is exercise-based
          return get().isDayCompleteByExercises()
        }
      },

      // Day advancement methods
      advanceToNextDay: (newMilestoneIndex: number, newDayIndex: number) => {
        const { currentProgram } = get()
        if (!currentProgram) return

        const milestone = currentProgram.milestones[newMilestoneIndex]
        const day = milestone?.days[newDayIndex]

        if (day) {
          set({
            currentMilestoneIndex: newMilestoneIndex,
            currentDayIndex: newDayIndex,
            currentDay: day,
          })

          // Reset session state for new day
          get().resetForNewDay()
        }
      },

      getSessionDuration: () => {
        const { sessionStartTime, isSessionActive } = get()
        if (!isSessionActive || !sessionStartTime) return 0

        return Date.now() - sessionStartTime
      },

      resetForNewDay: () => {
        set({
          isSessionActive: false,
          sessionStartTime: null,
          currentExerciseIndex: 0,
          completedExercises: [],
          exerciseProgress: {},
          currentRound: 1,
          totalExercisesCompleted: 0,
          amrapTimeRemaining: null,
          amrapTimerActive: false,
        })
      },

      // AMRAP timer methods
      startAmrapTimer: (durationInMinutes: number) => {
        const durationInSeconds = durationInMinutes * 60
        set({
          amrapTimeRemaining: durationInSeconds,
          amrapTimerActive: true,
        })
      },

      updateAmrapTimer: (timeRemaining: number) => {
        set({
          amrapTimeRemaining: Math.max(0, timeRemaining),
        })
      },

      pauseAmrapTimer: () => {
        set({ amrapTimerActive: false })
      },

      resumeAmrapTimer: () => {
        set({ amrapTimerActive: true })
      },

      stopAmrapTimer: () => {
        set({
          amrapTimeRemaining: null,
          amrapTimerActive: false,
        })
      },

      isAmrapTimeExpired: () => {
        const { amrapTimeRemaining } = get()
        return amrapTimeRemaining !== null && amrapTimeRemaining <= 0
      },
    }),
    {
      name: 'workout-session',
      partialize: (state) => ({
        currentProgram: state.currentProgram,
        currentMilestoneIndex: state.currentMilestoneIndex,
        currentDayIndex: state.currentDayIndex,
        isSessionActive: state.isSessionActive,
        sessionStartTime: state.sessionStartTime,
        currentDay: state.currentDay,
        currentExerciseIndex: state.currentExerciseIndex,
        completedExercises: state.completedExercises,
        exerciseProgress: state.exerciseProgress,
        currentRound: state.currentRound,
        totalExercisesCompleted: state.totalExercisesCompleted,
        amrapTimeRemaining: state.amrapTimeRemaining,
        amrapTimerActive: state.amrapTimerActive,
      }),
    },
  ),
)
