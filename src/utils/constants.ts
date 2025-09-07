// Application constants

export const APP_CONFIG = {
  name: 'Personal Workout App',
  version: '1.0.0',
  description: 'A mobile-first workout tracking application',
} as const

export const API_ENDPOINTS = {
  health: '/api/health',
  auth: {
    registerPasskey: '/api/auth/register-passkey',
    authenticatePasskey: '/api/auth/authenticate-passkey',
  },
  programs: '/api/programs',
  workouts: '/api/workouts',
  exercises: '/api/exercises',
} as const

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  programs: '/programs',
  workout: {
    dashboard: '/workout/dashboard',
    session: '/workout/session',
    exercise: '/workout/exercise',
  },
  progress: {
    overview: '/progress',
    history: '/progress/history',
  },
  admin: '/admin',
} as const

export const EXERCISE_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  BALANCE: 'balance',
} as const

export const WORKOUT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
} as const

export const VALIDATION_LIMITS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  MAX_SETS: 20,
  MAX_REPS: 1000,
  MAX_WEIGHT: 1000,
  MAX_NOTES_LENGTH: 500,
} as const
