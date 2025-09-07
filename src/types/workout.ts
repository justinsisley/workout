// Workout-related types

export interface Program {
  id: string
  name?: string
  description?: string
  objective?: string
  culminatingEvent?: string
  milestones: {
    milestone: string // Reference to Milestone ID
  }[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Milestone {
  id: string
  name?: string
  theme?: string
  objective?: string
  culminatingEvent?: string
  days: {
    dayType: 'workout' | 'rest'
    sessions?: {
      session: string // Reference to Session ID
    }[]
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  name?: string // Optional - for admin organization only
  exercises: {
    exercise: string // Reference to Exercise ID
    sets: number
    reps: number
    restPeriod: number // in seconds
    weight?: number // in pounds
    notes?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface Exercise {
  id: string
  title?: string
  description?: string
  videoUrl?: string
  alternatives: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ExerciseCompletion {
  id: string
  productUser: string // Reference to ProductUser ID
  exercise: string
  session: string
  sets: number
  reps: number
  weight?: number // Optional for bodyweight exercises
  time?: number // Optional - not relevant for all exercises
  completedAt: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}
