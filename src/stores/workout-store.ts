import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MilestoneDay, DayExercise, Program, ProgramMilestone } from '@/types/program'

export interface ExerciseProgress {
  exerciseId: string
  isCompleted: boolean
  hasData: boolean
  completionPercentage: number
  lastUpdatedAt: number
  amrapData?: {
    totalRoundsCompleted: number
    currentRoundProgress: number
    totalExercisesInRound: number
  } | undefined
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
          completionPercentage: amrapData ? Math.min(100, (amrapData.currentRoundProgress / amrapData.totalExercisesInRound) * 100) : 0,
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
      }),
    },
  ),
)
