import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWorkoutRetry } from '@/hooks/use-workout-retry'
import { workoutRetryManager } from '@/lib/retry-logic'
import { useWorkoutStore } from '@/stores/workout-store'

// Mock the retry manager and workout store
vi.mock('@/lib/retry-logic', () => ({
  workoutRetryManager: {
    retryExerciseCompletion: vi.fn(),
    retryDayProgression: vi.fn(),
    retryDataPersistence: vi.fn(),
    retryMilestoneProgression: vi.fn(),
    cancelRetry: vi.fn(),
    getActiveRetries: vi.fn(),
  },
}))

vi.mock('@/stores/workout-store', () => ({
  useWorkoutStore: vi.fn(),
}))

const mockWorkoutStore = {
  addError: vi.fn(),
  clearErrors: vi.fn(),
}

describe('useWorkoutRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWorkoutStore).mockReturnValue(mockWorkoutStore)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWorkoutRetry())

    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryAttempt).toBe(0)
    expect(result.current.lastError).toBeNull()
    expect(result.current.operationId).toBeNull()
  })

  describe('retryExerciseCompletion', () => {
    it('successfully retries exercise completion', async () => {
      const mockResult = {
        success: true,
        data: 'completed',
        attempts: 2,
        totalTime: 1000,
      }
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockResolvedValue('completed')
      const onSuccess = vi.fn()

      await act(async () => {
        const res = await result.current.retryExerciseCompletion(operation, 'exercise-1', onSuccess)
        expect(res).toEqual(mockResult)
      })

      expect(onSuccess).toHaveBeenCalledWith('completed')
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.operationId).toBeNull()
      expect(mockWorkoutStore.clearErrors).toHaveBeenCalled()
    })

    it('handles failed exercise completion retry', async () => {
      const mockResult = {
        success: false,
        error: new Error('Retry failed'),
        attempts: 3,
        totalTime: 5000,
      }
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))
      const onFailure = vi.fn()

      await act(async () => {
        await result.current.retryExerciseCompletion(operation, 'exercise-1', undefined, onFailure)
      })

      expect(onFailure).toHaveBeenCalledWith(mockResult.error)
      expect(mockWorkoutStore.addError).toHaveBeenCalledWith({
        type: 'retry_failed',
        message: 'Operation failed after 3 attempts',
        context: { operationId: 'exercise-1', totalTime: 5000 },
      })
      expect(result.current.isRetrying).toBe(false)
    })

    it('updates retry state during operation', async () => {
      const mockResult = {
        success: true,
        data: 'completed',
        attempts: 1,
        totalTime: 500,
      }

      // Mock a delay in the retry manager
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockImplementation(
        async (operation) => {
          // Simulate operation execution that updates attempt count
          await operation()
          return mockResult
        },
      )

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockResolvedValue('completed')

      await act(async () => {
        const promise = result.current.retryExerciseCompletion(operation, 'exercise-1')

        // Check state while operation is running
        expect(result.current.isRetrying).toBe(true)
        expect(result.current.operationId).toBe('exercise-1')

        await promise
      })

      expect(result.current.isRetrying).toBe(false)
    })
  })

  describe('retryDayProgression', () => {
    it('successfully retries day progression', async () => {
      const mockResult = {
        success: true,
        data: 'progressed',
        attempts: 1,
        totalTime: 200,
      }
      vi.mocked(workoutRetryManager.retryDayProgression).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockResolvedValue('progressed')
      const onSuccess = vi.fn()

      await act(async () => {
        await result.current.retryDayProgression(operation, 'day-1', onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledWith('progressed')
      expect(workoutRetryManager.retryDayProgression).toHaveBeenCalledWith(
        expect.any(Function),
        'day-1',
      )
    })

    it('handles day progression retry failure', async () => {
      const mockResult = {
        success: false,
        error: new Error('Day progression failed'),
        attempts: 2,
        totalTime: 3000,
      }
      vi.mocked(workoutRetryManager.retryDayProgression).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockRejectedValue(new Error('Server error'))
      const onFailure = vi.fn()

      await act(async () => {
        await result.current.retryDayProgression(operation, 'day-1', undefined, onFailure)
      })

      expect(onFailure).toHaveBeenCalledWith(mockResult.error)
      expect(mockWorkoutStore.addError).toHaveBeenCalled()
    })
  })

  describe('retryDataPersistence', () => {
    it('successfully retries data persistence', async () => {
      const mockResult = {
        success: true,
        data: 'persisted',
        attempts: 1,
        totalTime: 100,
      }
      vi.mocked(workoutRetryManager.retryDataPersistence).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockResolvedValue('persisted')

      await act(async () => {
        const res = await result.current.retryDataPersistence(operation, 'progress-data')
        expect(res).toEqual(mockResult)
      })

      expect(workoutRetryManager.retryDataPersistence).toHaveBeenCalledWith(
        expect.any(Function),
        'progress-data',
      )
    })
  })

  describe('retryMilestoneProgression', () => {
    it('successfully retries milestone progression', async () => {
      const mockResult = {
        success: true,
        data: 'milestone-advanced',
        attempts: 1,
        totalTime: 150,
      }
      vi.mocked(workoutRetryManager.retryMilestoneProgression).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockResolvedValue('milestone-advanced')

      await act(async () => {
        await result.current.retryMilestoneProgression(operation, 'milestone-1')
      })

      expect(workoutRetryManager.retryMilestoneProgression).toHaveBeenCalledWith(
        expect.any(Function),
        'milestone-1',
      )
    })
  })

  describe('cancelCurrentRetry', () => {
    it('cancels active retry operation', async () => {
      vi.mocked(workoutRetryManager.cancelRetry).mockReturnValue(true)

      const { result } = renderHook(() => useWorkoutRetry())

      // First start a retry to get an operation ID
      const mockResult = {
        success: false,
        error: new Error('Cancelled'),
        attempts: 1,
        totalTime: 0,
      }
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockResolvedValue(mockResult)

      await act(async () => {
        result.current.retryExerciseCompletion(
          vi.fn().mockRejectedValue(new Error('Test')),
          'exercise-1',
        )
      })

      act(() => {
        const cancelled = result.current.cancelCurrentRetry()
        expect(cancelled).toBe(true)
      })

      expect(workoutRetryManager.cancelRetry).toHaveBeenCalled()
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.operationId).toBeNull()
    })

    it('returns false when no active retry', () => {
      const { result } = renderHook(() => useWorkoutRetry())

      act(() => {
        const cancelled = result.current.cancelCurrentRetry()
        expect(cancelled).toBe(false)
      })
    })
  })

  describe('getActiveRetries', () => {
    it('returns active retry operations', () => {
      const activeRetries = ['exercise-1', 'day-1']
      vi.mocked(workoutRetryManager.getActiveRetries).mockReturnValue(activeRetries)

      const { result } = renderHook(() => useWorkoutRetry())

      act(() => {
        const retries = result.current.getActiveRetries()
        expect(retries).toEqual(activeRetries)
      })
    })
  })

  describe('resetRetryState', () => {
    it('resets all retry state', async () => {
      const { result } = renderHook(() => useWorkoutRetry())

      // First set some state
      const mockResult = {
        success: false,
        error: new Error('Failed'),
        attempts: 2,
        totalTime: 1000,
      }
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockResolvedValue(mockResult)

      await act(async () => {
        await result.current.retryExerciseCompletion(
          vi.fn().mockRejectedValue(new Error('Test')),
          'exercise-1',
        )
      })

      // Now reset
      act(() => {
        result.current.resetRetryState()
      })

      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryAttempt).toBe(0)
      expect(result.current.lastError).toBeNull()
      expect(result.current.operationId).toBeNull()
      expect(mockWorkoutStore.clearErrors).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles unexpected errors during retry', async () => {
      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockRejectedValue(
        new Error('Unexpected error'),
      )

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn()
      const onFailure = vi.fn()

      await act(async () => {
        const res = await result.current.retryExerciseCompletion(
          operation,
          'exercise-1',
          undefined,
          onFailure,
        )

        expect(res.success).toBe(false)
        expect(res.error).toBeInstanceOf(Error)
      })

      expect(onFailure).toHaveBeenCalled()
      expect(mockWorkoutStore.addError).toHaveBeenCalledWith({
        type: 'retry_error',
        message: 'Unexpected error during retry operation',
        context: { operationId: 'exercise-1', error: 'Unexpected error' },
      })
    })

    it('updates error state when operation throws', async () => {
      const testError = new Error('Operation error')
      const mockResult = {
        success: true,
        data: 'completed',
        attempts: 1,
        totalTime: 100,
      }

      vi.mocked(workoutRetryManager.retryExerciseCompletion).mockImplementation(
        async (operation) => {
          try {
            await operation()
          } catch (error) {
            // This simulates the retry manager catching and handling the error
          }
          return mockResult
        },
      )

      const { result } = renderHook(() => useWorkoutRetry())
      const operation = vi.fn().mockRejectedValue(testError)

      await act(async () => {
        await result.current.retryExerciseCompletion(operation, 'exercise-1')
      })

      // The hook should handle the error appropriately
      expect(result.current.isRetrying).toBe(false)
    })
  })
})
