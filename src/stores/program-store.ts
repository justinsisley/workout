import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Program, UserProgress } from '@/types/program'

const PROGRAM_STORAGE_KEY = 'workout-app-program'

export interface ProgramState {
  currentProgram: Program | null
  userProgress: UserProgress | null
  isLoading: boolean

  // Actions
  setCurrentProgram: (program: Program | null) => void
  setUserProgress: (progress: UserProgress | null) => void
  setLoading: (loading: boolean) => void
  clearProgram: () => void
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set) => ({
      currentProgram: null,
      userProgress: null,
      isLoading: false,

      setCurrentProgram: (program: Program | null) => {
        set({ currentProgram: program, isLoading: false })
      },

      setUserProgress: (progress: UserProgress | null) => {
        set({ userProgress: progress, isLoading: false })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      clearProgram: () => {
        set({
          currentProgram: null,
          userProgress: null,
          isLoading: false,
        })
      },
    }),
    {
      name: PROGRAM_STORAGE_KEY,
      partialize: (state) => ({
        currentProgram: state.currentProgram,
        userProgress: state.userProgress,
      }),
    },
  ),
)
