// Program-related types for the application

export interface Program {
  id: string
  name: string
  description: string
  objective: string
  isPublished: boolean
  milestones: ProgramMilestone[]
  createdAt: string
  updatedAt: string
}

export interface ProgramMilestone {
  id: string
  name: string
  theme: string
  objective: string
  days: MilestoneDay[]
}

export interface MilestoneDay {
  id: string
  dayType: 'workout' | 'rest'
  isAmrap?: boolean
  amrapDuration?: number
  exercises?: DayExercise[]
  restNotes?: string
}

export interface DayExercise {
  id: string
  exercise: string | Exercise // Can be populated or just ID
  sets: number
  reps: number
  restPeriod?: number
  weight?: number
  durationValue?: number
  durationUnit?: 'seconds' | 'minutes' | 'hours'
  distanceValue?: number
  distanceUnit?: 'meters' | 'miles'
  notes?: string
}

export interface Exercise {
  id: string
  title: string
  description: string
  videoUrl?: string
  category: string
}

export interface ProgramPreview {
  id: string
  name: string
  description: string
  objective: string
  totalMilestones: number
  totalDays: number
  totalWorkoutDays: number
  estimatedDuration: string
  milestonePreview: MilestonePreview[]
}

export interface MilestonePreview {
  name: string
  theme: string
  objective: string
  dayCount: number
  workoutDayCount: number
}

// Server action result types
export interface GetProgramsResult {
  success: boolean
  programs?: Program[]
  error?: string
}

export interface AssignProgramResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'not_found' | 'already_assigned' | 'system_error'
}

export interface UpdateProgressResult {
  success: boolean
  error?: string
  errorType?: 'authentication' | 'validation' | 'no_active_program' | 'not_found' | 'system_error'
}

export interface UserProgress {
  currentProgram: string | null
  currentMilestone: number
  currentDay: number
}
