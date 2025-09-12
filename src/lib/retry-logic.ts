interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attemptNumber: number, error: any) => void
  jitter?: boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: any
  attempts: number
  totalTime: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Default retry conditions for network/server errors
    if (error?.response?.status) {
      const status = error.response.status
      // Retry on server errors (5xx) and specific client errors
      return status >= 500 || status === 408 || status === 429
    }

    // Retry on network errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
      return true
    }

    // Retry on timeout errors
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      return true
    }

    return false
  },
  onRetry: () => {},
  jitter: true,
}

class RetryManager {
  private static instance: RetryManager
  private activeRetries: Map<string, Promise<any>> = new Map()

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager()
    }
    return RetryManager.instance
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
    operationId?: string,
  ): Promise<RetryResult<T>> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
    const startTime = Date.now()

    // Prevent duplicate retry operations
    if (operationId && this.activeRetries.has(operationId)) {
      try {
        const result = await this.activeRetries.get(operationId)
        return {
          success: true,
          data: result,
          attempts: 1,
          totalTime: Date.now() - startTime,
        }
      } catch (error) {
        return {
          success: false,
          error,
          attempts: 1,
          totalTime: Date.now() - startTime,
        }
      }
    }

    const retryPromise = this._executeRetryLoop(operation, config, startTime)

    if (operationId) {
      this.activeRetries.set(operationId, retryPromise)
    }

    try {
      const result = await retryPromise
      return result
    } finally {
      if (operationId) {
        this.activeRetries.delete(operationId)
      }
    }
  }

  private async _executeRetryLoop<T>(
    operation: () => Promise<T>,
    config: Required<RetryOptions>,
    startTime: number,
  ): Promise<RetryResult<T>> {
    let attempts = 0
    let lastError: any

    while (attempts <= config.maxRetries) {
      try {
        const data = await operation()
        return {
          success: true,
          data,
          attempts: attempts + 1,
          totalTime: Date.now() - startTime,
        }
      } catch (error) {
        attempts++
        lastError = error

        // Check if we should retry this error
        if (!config.retryCondition(error) || attempts > config.maxRetries) {
          return {
            success: false,
            error,
            attempts,
            totalTime: Date.now() - startTime,
          }
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempts - 1),
          config.maxDelay,
        )

        // Add jitter to prevent thundering herd
        if (config.jitter) {
          delay = delay * (0.5 + Math.random() * 0.5)
        }

        // Call retry callback
        config.onRetry(attempts, error)

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime,
    }
  }

  // Get status of active retries
  getActiveRetries(): string[] {
    return Array.from(this.activeRetries.keys())
  }

  // Cancel a specific retry operation
  cancelRetry(operationId: string): boolean {
    return this.activeRetries.delete(operationId)
  }

  // Cancel all active retries
  cancelAllRetries(): void {
    this.activeRetries.clear()
  }
}

// Workout-specific retry configurations
export const WORKOUT_RETRY_CONFIGS = {
  exerciseCompletion: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 1.5,
    retryCondition: (error: any) => {
      // Retry on network errors and server errors
      if (error?.response?.status >= 500) return true
      if (error?.code === 'NETWORK_ERROR') return true
      if (error?.message?.includes('timeout')) return true
      return false
    },
  },

  dayProgression: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // More conservative retry for day progression
      return error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR'
    },
  },

  dataPersistence: {
    maxRetries: 10,
    baseDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 1.8,
    jitter: true,
    retryCondition: (error: any) => {
      // Aggressive retry for data persistence
      const status = error?.response?.status
      if (status >= 500) return true
      if (status === 408 || status === 429) return true
      if (error?.code === 'NETWORK_ERROR') return true
      if (error?.name === 'TimeoutError') return true
      return false
    },
  },

  milestoneProgression: {
    maxRetries: 2,
    baseDelay: 3000,
    maxDelay: 15000,
    backoffMultiplier: 2.5,
    retryCondition: (error: any) => {
      // Conservative retry for milestone progression
      return error?.response?.status >= 500
    },
  },
} as const

// Convenience wrapper for workout operations
export class WorkoutRetryManager {
  private retryManager = RetryManager.getInstance()

  async retryExerciseCompletion<T>(
    operation: () => Promise<T>,
    exerciseId: string,
  ): Promise<RetryResult<T>> {
    return this.retryManager.executeWithRetry(
      operation,
      {
        ...WORKOUT_RETRY_CONFIGS.exerciseCompletion,
        onRetry: (attempt, error) => {
          console.warn(`Exercise completion retry ${attempt}/5 for ${exerciseId}:`, error.message)
        },
      },
      `exercise-completion-${exerciseId}`,
    )
  }

  async retryDayProgression<T>(
    operation: () => Promise<T>,
    dayId: string,
  ): Promise<RetryResult<T>> {
    return this.retryManager.executeWithRetry(
      operation,
      {
        ...WORKOUT_RETRY_CONFIGS.dayProgression,
        onRetry: (attempt, error) => {
          console.warn(`Day progression retry ${attempt}/3 for ${dayId}:`, error.message)
        },
      },
      `day-progression-${dayId}`,
    )
  }

  async retryDataPersistence<T>(
    operation: () => Promise<T>,
    dataType: string,
  ): Promise<RetryResult<T>> {
    return this.retryManager.executeWithRetry(
      operation,
      {
        ...WORKOUT_RETRY_CONFIGS.dataPersistence,
        onRetry: (attempt, error) => {
          console.warn(`Data persistence retry ${attempt}/10 for ${dataType}:`, error.message)
        },
      },
      `data-persistence-${dataType}`,
    )
  }

  async retryMilestoneProgression<T>(
    operation: () => Promise<T>,
    milestoneId: string,
  ): Promise<RetryResult<T>> {
    return this.retryManager.executeWithRetry(
      operation,
      {
        ...WORKOUT_RETRY_CONFIGS.milestoneProgression,
        onRetry: (attempt, error) => {
          console.warn(
            `Milestone progression retry ${attempt}/2 for ${milestoneId}:`,
            error.message,
          )
        },
      },
      `milestone-progression-${milestoneId}`,
    )
  }

  // Utility methods
  getActiveRetries(): string[] {
    return this.retryManager.getActiveRetries()
  }

  cancelRetry(operationId: string): boolean {
    return this.retryManager.cancelRetry(operationId)
  }

  cancelAllRetries(): void {
    this.retryManager.cancelAllRetries()
  }
}

// Global instance for convenience
export const workoutRetryManager = new WorkoutRetryManager()

// Hook for React components
export function useWorkoutRetry() {
  return workoutRetryManager
}
