import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { workoutRetryManager, WORKOUT_RETRY_CONFIGS } from '@/lib/retry-logic'

describe('RetryLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    workoutRetryManager.cancelAllRetries()
  })

  afterEach(() => {
    vi.useRealTimers()
    workoutRetryManager.cancelAllRetries()
  })

  describe('RetryManager', () => {
    it('executes operation successfully on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(1)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('retries on retryable errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      // Advance time for retry delay
      vi.advanceTimersByTime(2000)

      const result = await promise

      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(2)
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('respects max retry limit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'))

      const promise = workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      // Advance through all retry attempts
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(5000)
      }

      const result = await promise

      expect(result.success).toBe(false)
      expect(result.attempts).toBe(6) // Initial + 5 retries
      expect(operation).toHaveBeenCalledTimes(6)
    })

    it('uses exponential backoff for retry delays', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const promise = workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      // First retry after ~1.5s (with jitter)
      vi.advanceTimersByTime(1000)
      expect(operation).toHaveBeenCalledTimes(2)

      // Second retry after ~2.25s more (with jitter)
      vi.advanceTimersByTime(2000)
      expect(operation).toHaveBeenCalledTimes(3)

      // Third retry after ~3.375s more (with jitter)
      vi.advanceTimersByTime(4000)
      expect(operation).toHaveBeenCalledTimes(4)

      await promise
      consoleSpy.mockRestore()
    })

    it('does not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue({
        response: { status: 400 },
        message: 'Bad request',
      })

      const result = await workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      expect(result.success).toBe(false)
      expect(result.attempts).toBe(1)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('prevents duplicate operations with same ID', async () => {
      const operation1 = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('result1'), 1000)),
        )
      const operation2 = vi.fn().mockResolvedValue('result2')

      const promise1 = workoutRetryManager.retryExerciseCompletion(operation1, 'exercise-1')
      const promise2 = workoutRetryManager.retryExerciseCompletion(operation2, 'exercise-1')

      vi.advanceTimersByTime(1000)

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(operation1).toHaveBeenCalledTimes(1)
      expect(operation2).toHaveBeenCalledTimes(0) // Should not be called
      expect(result1.data).toBe('result1')
      expect(result2.data).toBe('result1') // Should get same result
    })

    it('cancels active retry operation', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')

      // Cancel the retry
      const cancelled = workoutRetryManager.cancelRetry('exercise-completion-exercise-1')
      expect(cancelled).toBe(true)

      vi.advanceTimersByTime(5000)

      // Operation should not continue retrying
      expect(operation).toHaveBeenCalledTimes(1) // Only initial call
    })

    it('tracks active retries', () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')
      workoutRetryManager.retryDayProgression(operation, 'day-1')

      const activeRetries = workoutRetryManager.getActiveRetries()
      expect(activeRetries).toContain('exercise-completion-exercise-1')
      expect(activeRetries).toContain('day-progression-day-1')
      expect(activeRetries).toHaveLength(2)
    })

    it('clears all active retries', () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')
      workoutRetryManager.retryDayProgression(operation, 'day-1')

      expect(workoutRetryManager.getActiveRetries()).toHaveLength(2)

      workoutRetryManager.cancelAllRetries()

      expect(workoutRetryManager.getActiveRetries()).toHaveLength(0)
    })
  })

  describe('Workout-specific retry configs', () => {
    it('has correct config for exercise completion', () => {
      const config = WORKOUT_RETRY_CONFIGS.exerciseCompletion

      expect(config.maxRetries).toBe(5)
      expect(config.baseDelay).toBe(1000)
      expect(config.maxDelay).toBe(8000)
      expect(config.backoffMultiplier).toBe(1.5)
    })

    it('has correct config for day progression', () => {
      const config = WORKOUT_RETRY_CONFIGS.dayProgression

      expect(config.maxRetries).toBe(3)
      expect(config.baseDelay).toBe(2000)
      expect(config.maxDelay).toBe(10000)
      expect(config.backoffMultiplier).toBe(2)
    })

    it('has correct config for data persistence', () => {
      const config = WORKOUT_RETRY_CONFIGS.dataPersistence

      expect(config.maxRetries).toBe(10)
      expect(config.baseDelay).toBe(500)
      expect(config.maxDelay).toBe(30000)
      expect(config.backoffMultiplier).toBe(1.8)
      expect(config.jitter).toBe(true)
    })

    it('has correct config for milestone progression', () => {
      const config = WORKOUT_RETRY_CONFIGS.milestoneProgression

      expect(config.maxRetries).toBe(2)
      expect(config.baseDelay).toBe(3000)
      expect(config.maxDelay).toBe(15000)
      expect(config.backoffMultiplier).toBe(2.5)
    })
  })

  describe('Retry conditions', () => {
    it('retries on server errors (5xx)', () => {
      const config = WORKOUT_RETRY_CONFIGS.exerciseCompletion

      expect(config.retryCondition({ response: { status: 500 } })).toBe(true)
      expect(config.retryCondition({ response: { status: 503 } })).toBe(true)
    })

    it('retries on network errors', () => {
      const config = WORKOUT_RETRY_CONFIGS.exerciseCompletion

      expect(config.retryCondition({ code: 'NETWORK_ERROR' })).toBe(true)
      expect(config.retryCondition({ message: 'fetch failed' })).toBe(true)
    })

    it('retries on timeout errors', () => {
      const config = WORKOUT_RETRY_CONFIGS.exerciseCompletion

      expect(config.retryCondition({ message: 'timeout' })).toBe(true)
      expect(config.retryCondition({ name: 'TimeoutError' })).toBe(true)
    })

    it('does not retry on client errors (4xx)', () => {
      const config = WORKOUT_RETRY_CONFIGS.exerciseCompletion

      expect(config.retryCondition({ response: { status: 400 } })).toBe(false)
      expect(config.retryCondition({ response: { status: 404 } })).toBe(false)
    })
  })

  describe('WorkoutRetryManager methods', () => {
    it('logs retry attempts for exercise completion', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = workoutRetryManager.retryExerciseCompletion(operation, 'exercise-1')
      vi.advanceTimersByTime(2000)

      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        'Exercise completion retry 1/5 for exercise-1:',
        'Network error',
      )

      consoleSpy.mockRestore()
    })

    it('logs retry attempts for day progression', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = workoutRetryManager.retryDayProgression(operation, 'day-1')
      vi.advanceTimersByTime(3000)

      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        'Day progression retry 1/3 for day-1:',
        'Network error',
      )

      consoleSpy.mockRestore()
    })

    it('logs retry attempts for data persistence', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = workoutRetryManager.retryDataPersistence(operation, 'progress')
      vi.advanceTimersByTime(1000)

      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        'Data persistence retry 1/10 for progress:',
        'Network error',
      )

      consoleSpy.mockRestore()
    })

    it('logs retry attempts for milestone progression', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const promise = workoutRetryManager.retryMilestoneProgression(operation, 'milestone-1')
      vi.advanceTimersByTime(4000)

      await promise

      expect(consoleSpy).toHaveBeenCalledWith(
        'Milestone progression retry 1/2 for milestone-1:',
        'Network error',
      )

      consoleSpy.mockRestore()
    })
  })
})
