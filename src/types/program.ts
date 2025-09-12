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
  restPeriod?: number | undefined
  weight?: number | undefined
  durationValue?: number | undefined
  durationUnit?: 'seconds' | 'minutes' | 'hours' | undefined
  distanceValue?: number | undefined
  distanceUnit?: 'meters' | 'miles' | undefined
  notes?: string | undefined
}

export interface Exercise {
  id: string
  title: string | null
  description: string | null
  videoUrl?: string | null
  category?: string
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
  errorType?:
    | 'authentication'
    | 'validation'
    | 'no_active_program'
    | 'not_found'
    | 'system_error'
    | 'corrupted_progress'
    | 'program_structure_changed'
    | 'milestone_index_invalid'
    | 'day_index_invalid'
  repairAction?:
    | {
        type: 'reset_to_start' | 'adjust_to_valid_position' | 'assign_new_program'
        newMilestone?: number
        newDay?: number
        description?: string
      }
    | undefined
}

export interface UserProgress {
  currentProgram: string | null
  currentMilestone: number
  currentDay: number
}

// Exercise completion types
export interface ExerciseCompletion {
  id: string
  productUser: string // Reference to ProductUser ID
  exercise: string // Reference to Exercise ID
  program: string // Reference to Program ID
  milestoneIndex: number // Index of milestone within program
  dayIndex: number // Index of day within milestone
  sets: number
  reps: number
  weight?: number // Optional for bodyweight exercises
  time?: number // Optional - not relevant for all exercises
  distance?: number // Optional - for distance-based exercises
  distanceUnit?: 'meters' | 'miles'
  completedAt: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Previous exercise data for auto-population
export interface PreviousExerciseData {
  sets: number
  reps: number
  weight?: number | undefined
  time?: number | undefined
  distance?: number | undefined
  distanceUnit?: 'meters' | 'miles' | undefined
  lastCompletedAt: Date
}

// Smart defaults for exercise suggestions
export interface SmartDefaults {
  suggestedSets: number
  suggestedReps: number
  suggestedWeight?: number | undefined
  suggestedTime?: number | undefined
  suggestedDistance?: number | undefined
  suggestedDistanceUnit?: 'meters' | 'miles' | undefined
  confidence: 'high' | 'medium' | 'low'
  basedOnSessions: number
}

// Server action result for getting previous exercise data
export interface GetPreviousExerciseDataResult {
  success: boolean
  previousData?: PreviousExerciseData | undefined
  smartDefaults?: SmartDefaults | undefined
  error?: string
}
