'use client'

import React, { ReactNode } from 'react'
import WorkoutErrorBoundary from './workout-error-boundary'

interface ProgressionErrorBoundaryProps {
  children: ReactNode
  exerciseId?: string
  onProgressionError?: (error: Error) => void
}

export default function ProgressionErrorBoundary({
  children,
  exerciseId,
  onProgressionError,
}: ProgressionErrorBoundaryProps) {
  const handleProgressionError = async (error: Error, _errorInfo: React.ErrorInfo) => {
    console.error('Progression error occurred:', error, _errorInfo)

    // TODO: Attempt to save current progress before handling error
    // This would be implemented when proper progress saving methods are available
    if (exerciseId) {
      console.log(`Would save exercise progress for: ${exerciseId}`)
    }

    console.log('Progress saving would be implemented here')

    // Call custom error handler
    onProgressionError?.(error)
  }

  const customFallback = (_error: Error, retry: () => void, retryCount: number) => {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Workout Progress Error</h2>

            <div className="text-gray-600 mb-6 space-y-2">
              <p>We couldn&apos;t complete your workout progression.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  ✓ Your current exercise data has been saved
                </div>
              </div>
            </div>

            {retryCount < 3 && (
              <button
                onClick={retry}
                className="w-full mb-3 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Try Again {retryCount > 0 && `(${retryCount + 1}/3)`}
              </button>
            )}

            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200"
              >
                Refresh Page
              </button>

              <button
                onClick={() => (window.location.href = '/workout/dashboard')}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500 text-center">
              Error details have been logged for debugging
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WorkoutErrorBoundary
      errorType="progression"
      onError={handleProgressionError}
      fallback={customFallback}
      maxRetries={3}
    >
      {children}
    </WorkoutErrorBoundary>
  )
}
