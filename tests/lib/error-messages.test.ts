import { describe, it, expect } from 'vitest'
import {
  getWorkoutError,
  categorizeError,
  getSeverityClass,
  getSeverityIcon,
  WORKOUT_ERROR_CONFIGS,
} from '@/lib/error-messages'

describe('ErrorMessages', () => {
  describe('getWorkoutError', () => {
    it('returns exercise completion failed error config', () => {
      const error = getWorkoutError('exercise_completion_failed', { exerciseId: 'ex-1' })

      expect(error.type).toBe('exercise_completion_failed')
      expect(error.code).toBe('EX_001')
      expect(error.message).toBe('Unable to Complete Exercise')
      expect(error.severity).toBe('medium')
      expect(error.actionable).toBe(true)
      expect(error.userActions).toHaveLength(3)
      expect(error.context).toEqual({ exerciseId: 'ex-1' })
    })

    it('returns exercise data invalid error config', () => {
      const error = getWorkoutError('exercise_data_invalid')

      expect(error.type).toBe('exercise_data_invalid')
      expect(error.code).toBe('EX_002')
      expect(error.message).toBe('Invalid Exercise Data')
      expect(error.severity).toBe('medium')
      expect(error.userActions).toHaveLength(2)
    })

    it('returns day progression failed error config', () => {
      const error = getWorkoutError('day_progression_failed')

      expect(error.type).toBe('day_progression_failed')
      expect(error.code).toBe('DP_001')
      expect(error.message).toBe("Can't Advance to Next Exercise")
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns day completion error config', () => {
      const error = getWorkoutError('day_completion_error')

      expect(error.type).toBe('day_completion_error')
      expect(error.code).toBe('DP_002')
      expect(error.message).toBe('Day Completion Issue')
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns network error config', () => {
      const error = getWorkoutError('network_error')

      expect(error.type).toBe('network_error')
      expect(error.code).toBe('NET_001')
      expect(error.message).toBe('Connection Problem')
      expect(error.severity).toBe('medium')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns sync failed error config', () => {
      const error = getWorkoutError('sync_failed')

      expect(error.type).toBe('sync_failed')
      expect(error.code).toBe('NET_002')
      expect(error.message).toBe('Data Sync Failed')
      expect(error.severity).toBe('low')
      expect(error.userActions).toHaveLength(2)
    })

    it('returns data conflict error config', () => {
      const error = getWorkoutError('data_conflict')

      expect(error.type).toBe('data_conflict')
      expect(error.code).toBe('DATA_001')
      expect(error.message).toBe('Data Conflict Detected')
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns program mismatch error config', () => {
      const error = getWorkoutError('program_mismatch')

      expect(error.type).toBe('program_mismatch')
      expect(error.code).toBe('DATA_002')
      expect(error.message).toBe('Program Structure Changed')
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns auth expired error config', () => {
      const error = getWorkoutError('auth_expired')

      expect(error.type).toBe('auth_expired')
      expect(error.code).toBe('AUTH_001')
      expect(error.message).toBe('Session Expired')
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(2)
    })

    it('returns server error config', () => {
      const error = getWorkoutError('server_error')

      expect(error.type).toBe('server_error')
      expect(error.code).toBe('SRV_001')
      expect(error.message).toBe('Server Temporarily Unavailable')
      expect(error.severity).toBe('high')
      expect(error.userActions).toHaveLength(3)
    })

    it('returns unknown error config for invalid error type', () => {
      const error = getWorkoutError('invalid_error_type')

      expect(error.type).toBe('unknown_error')
      expect(error.code).toBe('GEN_001')
      expect(error.message).toBe('Something Went Wrong')
      expect(error.severity).toBe('medium')
      expect(error.userActions).toHaveLength(3)
    })

    it('passes context to error config function', () => {
      const context = { exerciseId: 'ex-1', userId: 'user-1' }
      const error = getWorkoutError('exercise_completion_failed', context)

      expect(error.context).toEqual(context)
    })
  })

  describe('categorizeError', () => {
    it('categorizes network errors', () => {
      expect(categorizeError({ code: 'NETWORK_ERROR' })).toBe('network_error')
      expect(categorizeError({ message: 'fetch failed' })).toBe('network_error')
    })

    it('categorizes authentication errors', () => {
      expect(categorizeError({ response: { status: 401 } })).toBe('auth_expired')
      expect(categorizeError({ message: 'unauthorized access' })).toBe('auth_expired')
    })

    it('categorizes server errors', () => {
      expect(categorizeError({ response: { status: 500 } })).toBe('server_error')
      expect(categorizeError({ response: { status: 503 } })).toBe('server_error')
    })

    it('categorizes validation errors', () => {
      expect(categorizeError({ response: { status: 400 } })).toBe('exercise_data_invalid')
      expect(categorizeError({ message: 'validation failed' })).toBe('exercise_data_invalid')
    })

    it('categorizes conflict errors', () => {
      expect(categorizeError({ response: { status: 409 } })).toBe('data_conflict')
      expect(categorizeError({ message: 'conflict detected' })).toBe('data_conflict')
    })

    it('categorizes exercise-specific errors', () => {
      expect(categorizeError({ context: { type: 'exercise' } })).toBe('exercise_completion_failed')
    })

    it('categorizes progression errors', () => {
      expect(categorizeError({ context: { type: 'progression' } })).toBe('day_progression_failed')
    })

    it('defaults to unknown error for unrecognized errors', () => {
      expect(categorizeError({ someRandomField: 'value' })).toBe('unknown_error')
      expect(categorizeError({})).toBe('unknown_error')
      expect(categorizeError(null)).toBe('unknown_error')
    })
  })

  describe('getSeverityClass', () => {
    it('returns correct classes for low severity', () => {
      expect(getSeverityClass('low')).toBe('border-blue-200 bg-blue-50 text-blue-800')
    })

    it('returns correct classes for medium severity', () => {
      expect(getSeverityClass('medium')).toBe('border-yellow-200 bg-yellow-50 text-yellow-800')
    })

    it('returns correct classes for high severity', () => {
      expect(getSeverityClass('high')).toBe('border-orange-200 bg-orange-50 text-orange-800')
    })

    it('returns correct classes for critical severity', () => {
      expect(getSeverityClass('critical')).toBe('border-red-200 bg-red-50 text-red-800')
    })

    it('returns default classes for unknown severity', () => {
      expect(getSeverityClass('unknown' as any)).toBe('border-gray-200 bg-gray-50 text-gray-800')
    })
  })

  describe('getSeverityIcon', () => {
    it('returns correct icon for low severity', () => {
      expect(getSeverityIcon('low')).toBe('Info')
    })

    it('returns correct icon for medium severity', () => {
      expect(getSeverityIcon('medium')).toBe('AlertTriangle')
    })

    it('returns correct icon for high severity', () => {
      expect(getSeverityIcon('high')).toBe('AlertCircle')
    })

    it('returns correct icon for critical severity', () => {
      expect(getSeverityIcon('critical')).toBe('XCircle')
    })

    it('returns default icon for unknown severity', () => {
      expect(getSeverityIcon('unknown' as any)).toBe('AlertCircle')
    })
  })

  describe('User Actions', () => {
    it('exercise completion failed has correct user actions', () => {
      const error = getWorkoutError('exercise_completion_failed')

      expect(error.userActions).toHaveLength(3)
      expect(error.userActions[0]?.label).toBe('Try Again')
      expect(error.userActions[0]?.type).toBe('retry')
      expect(error.userActions[0]?.action).toBe('retry-exercise-completion')
      expect(error.userActions[0]?.primary).toBe(true)
      expect(error.userActions[0]?.icon).toBe('RefreshCw')
    })

    it('network error has correct user actions', () => {
      const error = getWorkoutError('network_error')

      expect(error.userActions).toHaveLength(3)
      expect(error.userActions[0]?.label).toBe('Retry Connection')
      expect(error.userActions[1]?.label).toBe('Work Offline')
      expect(error.userActions[2]?.label).toBe('Check Connection')
    })

    it('data conflict has correct user actions', () => {
      const error = getWorkoutError('data_conflict')

      expect(error.userActions).toHaveLength(3)
      expect(error.userActions[0]?.label).toBe('Keep This Device')
      expect(error.userActions[1]?.label).toBe('Use Server Data')
      expect(error.userActions[2]?.label).toBe('Review Differences')
    })
  })

  describe('Error Configuration Coverage', () => {
    it('all error types have required fields', () => {
      Object.entries(WORKOUT_ERROR_CONFIGS).forEach(([_errorType, configFn]) => {
        const error = configFn({})

        expect(error).toHaveProperty('type')
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('details')
        expect(error).toHaveProperty('severity')
        expect(error).toHaveProperty('actionable')
        expect(error).toHaveProperty('userActions')
        expect(Array.isArray(error.userActions)).toBe(true)

        // Ensure severity is valid
        expect(['low', 'medium', 'high', 'critical']).toContain(error.severity)

        // Ensure at least one user action if actionable
        if (error.actionable) {
          expect(error.userActions.length).toBeGreaterThan(0)
        }
      })
    })

    it('all user actions have required fields', () => {
      Object.entries(WORKOUT_ERROR_CONFIGS).forEach(([_errorType, configFn]) => {
        const error = configFn({})

        error.userActions.forEach((action) => {
          expect(action).toHaveProperty('label')
          expect(action).toHaveProperty('type')
          expect(action).toHaveProperty('action')
          expect(['retry', 'navigate', 'refresh', 'contact', 'custom']).toContain(action.type)
        })
      })
    })

    it('has at least one primary action per error when actionable', () => {
      Object.entries(WORKOUT_ERROR_CONFIGS).forEach(([_errorType, configFn]) => {
        const error = configFn({})

        if (error.actionable && error.userActions.length > 0) {
          const primaryActions = error.userActions.filter((action) => action.primary)
          expect(primaryActions.length).toBeGreaterThanOrEqual(1)
        }
      })
    })
  })
})
