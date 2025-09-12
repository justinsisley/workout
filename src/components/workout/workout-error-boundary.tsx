'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkoutErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface ExtendedError extends Error {
  digest?: string
}

interface WorkoutErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: ExtendedError, retry: () => void, retryCount: number) => ReactNode
  onError?: (error: ExtendedError, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
  errorType?: 'progression' | 'data' | 'exercise' | 'general'
}

const ERROR_MESSAGES = {
  progression: {
    title: 'Workout Progression Error',
    description:
      'Unable to advance your workout progress. Your current exercise data has been saved.',
  },
  data: {
    title: 'Data Sync Error',
    description: "Unable to save your workout data. We'll keep trying in the background.",
  },
  exercise: {
    title: 'Exercise Loading Error',
    description: 'Unable to load exercise details. Please check your connection and try again.',
  },
  general: {
    title: 'Workout Error',
    description: 'Something went wrong during your workout session.',
  },
} as const

class WorkoutErrorBoundary extends Component<WorkoutErrorBoundaryProps, WorkoutErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = []

  constructor(props: WorkoutErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<WorkoutErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: ExtendedError, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Log to monitoring service
    console.error('WorkoutErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout))
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      return
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000

    const timeout = setTimeout(() => {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))
    }, delay)

    this.retryTimeouts.push(timeout)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    })
  }

  render() {
    const { children, fallback, errorType = 'general', maxRetries = 3 } = this.props
    const { hasError, error, retryCount } = this.state

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleRetry, retryCount)
      }

      return (
        <WorkoutErrorFallback
          error={error}
          errorType={errorType}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      )
    }

    return children
  }
}

interface WorkoutErrorFallbackProps {
  error: Error
  errorType: 'progression' | 'data' | 'exercise' | 'general'
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onReset: () => void
}

function WorkoutErrorFallback({
  error,
  errorType,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
}: WorkoutErrorFallbackProps) {
  const router = useRouter()
  const errorConfig = ERROR_MESSAGES[errorType]

  const handleBackToDashboard = () => {
    router.push('/workout/dashboard')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const canRetry = retryCount < maxRetries
  const isRetrying = retryCount > 0

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">{errorConfig.title}</AlertTitle>
          <AlertDescription className="text-red-700">{errorConfig.description}</AlertDescription>

          {(error as any).digest && (
            <div className="mt-3 p-2 bg-red-100 rounded text-xs font-mono text-red-600">
              Error ID: {(error as any).digest}
            </div>
          )}

          {isRetrying && (
            <div className="mt-3 text-sm text-red-600">
              Retry attempt {retryCount} of {maxRetries}
            </div>
          )}
        </Alert>

        <div className="space-y-3">
          {canRetry && (
            <Button
              onClick={onRetry}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isRetrying}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <div className="flex space-x-3">
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600">
            If this problem persists, try refreshing the page
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Your workout progress is automatically saved
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkoutErrorBoundary
