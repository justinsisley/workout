'use client'

import React from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorBoundaryProps) {
  React.useEffect(() => {
    // Log the error to monitoring service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <div className="text-red-800">
              <div className="font-medium">Unable to load workout dashboard</div>
              <div className="text-sm mt-1">
                Something went wrong while loading your workout data. Please try again.
              </div>
              {error.digest && (
                <div className="text-xs mt-2 font-mono text-red-600">Error ID: {error.digest}</div>
              )}
            </div>
          </Alert>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={reset}
              variant="outline"
              className="text-red-700 border-red-200 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
