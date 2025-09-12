export interface WorkoutError {
  type: string
  code?: string
  message: string
  details?: string
  context?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  actionable: boolean
  userActions: UserAction[]
  technicalDetails?: string
}

export interface UserAction {
  label: string
  type: 'retry' | 'navigate' | 'refresh' | 'contact' | 'custom'
  action: string | (() => void)
  primary?: boolean
  icon?: string
}

// Common error types with user-friendly messages
export const WORKOUT_ERROR_CONFIGS: Record<string, (context?: any) => WorkoutError> = {
  // Exercise Completion Errors
  exercise_completion_failed: (context) => ({
    type: 'exercise_completion_failed',
    code: 'EX_001',
    message: 'Unable to Complete Exercise',
    details:
      "We couldn't save your exercise completion. Your workout data is safe and we'll keep trying.",
    context,
    severity: 'medium',
    actionable: true,
    userActions: [
      {
        label: 'Try Again',
        type: 'retry',
        action: 'retry-exercise-completion',
        primary: true,
        icon: 'RefreshCw',
      },
      {
        label: 'Continue Workout',
        type: 'custom',
        action: () => {},
        icon: 'Play',
      },
      {
        label: 'Save Locally',
        type: 'custom',
        action: 'save-local',
        icon: 'Save',
      },
    ],
  }),

  exercise_data_invalid: (context) => ({
    type: 'exercise_data_invalid',
    code: 'EX_002',
    message: 'Invalid Exercise Data',
    details:
      "Some of your exercise data doesn't look right. Please check your entries and try again.",
    context,
    severity: 'medium',
    actionable: true,
    userActions: [
      {
        label: 'Review Data',
        type: 'custom',
        action: 'review-exercise-data',
        primary: true,
        icon: 'Edit',
      },
      {
        label: 'Reset Exercise',
        type: 'custom',
        action: 'reset-exercise',
        icon: 'RotateCcw',
      },
    ],
  }),

  // Day Progression Errors
  day_progression_failed: (context) => ({
    type: 'day_progression_failed',
    code: 'DP_001',
    message: "Can't Advance to Next Exercise",
    details:
      "We're having trouble moving you to the next exercise. Your current progress has been saved.",
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Try Again',
        type: 'retry',
        action: 'retry-day-progression',
        primary: true,
        icon: 'RefreshCw',
      },
      {
        label: 'Back to Dashboard',
        type: 'navigate',
        action: '/workout/dashboard',
        icon: 'Home',
      },
      {
        label: 'Manual Navigation',
        type: 'custom',
        action: 'manual-navigation',
        icon: 'Navigation',
      },
    ],
  }),

  day_completion_error: (context) => ({
    type: 'day_completion_error',
    code: 'DP_002',
    message: 'Day Completion Issue',
    details: "We couldn't complete your workout day. All your exercise data has been saved safely.",
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Complete Day',
        type: 'retry',
        action: 'retry-day-completion',
        primary: true,
        icon: 'CheckCircle',
      },
      {
        label: 'Review Exercises',
        type: 'custom',
        action: 'review-day-exercises',
        icon: 'List',
      },
      {
        label: 'End Workout',
        type: 'navigate',
        action: '/workout/dashboard',
        icon: 'Square',
      },
    ],
  }),

  // Network and Connectivity Errors
  network_error: (context) => ({
    type: 'network_error',
    code: 'NET_001',
    message: 'Connection Problem',
    details:
      "We're having trouble connecting to our servers. Your workout data is being saved locally.",
    context,
    severity: 'medium',
    actionable: true,
    userActions: [
      {
        label: 'Retry Connection',
        type: 'retry',
        action: 'retry-network',
        primary: true,
        icon: 'Wifi',
      },
      {
        label: 'Work Offline',
        type: 'custom',
        action: 'enable-offline-mode',
        icon: 'WifiOff',
      },
      {
        label: 'Check Connection',
        type: 'custom',
        action: 'check-connection',
        icon: 'Signal',
      },
    ],
  }),

  sync_failed: (context) => ({
    type: 'sync_failed',
    code: 'NET_002',
    message: 'Data Sync Failed',
    details:
      "Your workout data couldn't be synced to the cloud. It's saved locally and we'll try again automatically.",
    context,
    severity: 'low',
    actionable: true,
    userActions: [
      {
        label: 'Retry Sync',
        type: 'retry',
        action: 'retry-sync',
        primary: true,
        icon: 'RefreshCw',
      },
      {
        label: 'Continue Offline',
        type: 'custom',
        action: 'continue-offline',
        icon: 'WifiOff',
      },
    ],
  }),

  // Data Validation Errors
  data_conflict: (context) => ({
    type: 'data_conflict',
    code: 'DATA_001',
    message: 'Data Conflict Detected',
    details:
      'It looks like you have workout data from another device. We need to resolve this conflict.',
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Keep This Device',
        type: 'custom',
        action: 'resolve-conflict-local',
        primary: true,
        icon: 'Smartphone',
      },
      {
        label: 'Use Server Data',
        type: 'custom',
        action: 'resolve-conflict-server',
        icon: 'Server',
      },
      {
        label: 'Review Differences',
        type: 'custom',
        action: 'review-conflict',
        icon: 'GitCompare',
      },
    ],
  }),

  program_mismatch: (context) => ({
    type: 'program_mismatch',
    code: 'DATA_002',
    message: 'Program Structure Changed',
    details:
      'Your workout program has been updated. We need to sync your progress with the new structure.',
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Update Program',
        type: 'custom',
        action: 'update-program-structure',
        primary: true,
        icon: 'Download',
      },
      {
        label: 'Keep Current',
        type: 'custom',
        action: 'keep-current-program',
        icon: 'Lock',
      },
      {
        label: 'Start Fresh',
        type: 'custom',
        action: 'restart-program',
        icon: 'RotateCcw',
      },
    ],
  }),

  // Authentication and Access Errors
  auth_expired: (context) => ({
    type: 'auth_expired',
    code: 'AUTH_001',
    message: 'Session Expired',
    details: 'Your login session has expired. Please log in again to continue your workout.',
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Log In',
        type: 'navigate',
        action: '/login',
        primary: true,
        icon: 'LogIn',
      },
      {
        label: 'Save Progress',
        type: 'custom',
        action: 'save-progress-local',
        icon: 'Save',
      },
    ],
  }),

  // Server Errors
  server_error: (context) => ({
    type: 'server_error',
    code: 'SRV_001',
    message: 'Server Temporarily Unavailable',
    details:
      "Our servers are experiencing issues. Your workout data is safe and we're working to fix this.",
    context,
    severity: 'high',
    actionable: true,
    userActions: [
      {
        label: 'Try Again',
        type: 'retry',
        action: 'retry-server-request',
        primary: true,
        icon: 'RefreshCw',
      },
      {
        label: 'Work Offline',
        type: 'custom',
        action: 'enable-offline-mode',
        icon: 'WifiOff',
      },
      {
        label: 'Check Status',
        type: 'navigate',
        action: 'https://status.app.com',
        icon: 'ExternalLink',
      },
    ],
  }),

  // Generic Fallback Error
  unknown_error: (context) => ({
    type: 'unknown_error',
    code: 'GEN_001',
    message: 'Something Went Wrong',
    details: "An unexpected error occurred. Don't worry - your workout data is safe.",
    context,
    severity: 'medium',
    actionable: true,
    userActions: [
      {
        label: 'Try Again',
        type: 'retry',
        action: 'retry-operation',
        primary: true,
        icon: 'RefreshCw',
      },
      {
        label: 'Refresh Page',
        type: 'refresh',
        action: 'refresh',
        icon: 'RotateCcw',
      },
      {
        label: 'Back to Dashboard',
        type: 'navigate',
        action: '/workout/dashboard',
        icon: 'Home',
      },
    ],
  }),
}

// Helper function to get user-friendly error
export function getWorkoutError(errorType: string, context?: any): WorkoutError {
  const errorConfig = WORKOUT_ERROR_CONFIGS[errorType] || WORKOUT_ERROR_CONFIGS['unknown_error']
  if (!errorConfig) {
    throw new Error(`Unknown error type: ${errorType}`)
  }
  return errorConfig(context)
}

// Function to determine error type from raw error
export function categorizeError(error: any): string {
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
    return 'network_error'
  }

  // Authentication errors
  if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
    return 'auth_expired'
  }

  // Server errors
  if (error?.response?.status >= 500) {
    return 'server_error'
  }

  // Validation errors
  if (error?.response?.status === 400 || error?.message?.includes('validation')) {
    return 'exercise_data_invalid'
  }

  // Conflict errors
  if (error?.response?.status === 409 || error?.message?.includes('conflict')) {
    return 'data_conflict'
  }

  // Exercise-specific errors
  if (error?.context?.type === 'exercise') {
    return 'exercise_completion_failed'
  }

  // Day progression errors
  if (error?.context?.type === 'progression') {
    return 'day_progression_failed'
  }

  // Default to unknown error
  return 'unknown_error'
}

// Helper to get severity color classes
export function getSeverityClass(severity: WorkoutError['severity']): string {
  switch (severity) {
    case 'low':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
    case 'high':
      return 'border-orange-200 bg-orange-50 text-orange-800'
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800'
  }
}

// Helper to get severity icon
export function getSeverityIcon(severity: WorkoutError['severity']): string {
  switch (severity) {
    case 'low':
      return 'Info'
    case 'medium':
      return 'AlertTriangle'
    case 'high':
      return 'AlertCircle'
    case 'critical':
      return 'XCircle'
    default:
      return 'AlertCircle'
  }
}
