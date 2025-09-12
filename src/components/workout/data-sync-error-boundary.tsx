'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import WorkoutErrorBoundary from './workout-error-boundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

interface DataSyncErrorBoundaryProps {
  children: ReactNode
  onSyncError?: (error: Error) => void
  onSyncRetry?: () => Promise<boolean>
}

export default function DataSyncErrorBoundary({
  children,
  onSyncError,
  onSyncRetry,
}: DataSyncErrorBoundaryProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleDataSyncError = (error: Error, _errorInfo: React.ErrorInfo) => {
    console.error('Data sync error occurred:', error, _errorInfo)

    // Store error info in localStorage for retry later
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context: 'data-sync',
      }
      localStorage.setItem('workout-sync-error', JSON.stringify(errorData))
    } catch (storageError) {
      console.error('Failed to store sync error:', storageError)
    }

    onSyncError?.(error)
  }

  const handleRetrySync = async () => {
    if (!isOnline) {
      return
    }

    setIsSyncing(true)
    setSyncSuccess(false)

    try {
      const result = onSyncRetry ? await onSyncRetry() : true
      if (result) {
        setSyncSuccess(true)
        // Clear stored error
        localStorage.removeItem('workout-sync-error')

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSyncSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Sync retry failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const customFallback = (_error: Error, retry: () => void, retryCount: number) => {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              {isOnline ? (
                <Wifi className="w-8 h-8 text-orange-600" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-600" />
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Sync Issue</h2>

            <div className="text-gray-600 mb-6 space-y-3">
              <p>We&apos;re having trouble saving your workout data.</p>

              {!isOnline && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    You appear to be offline. Your data will be saved locally and synced when you
                    reconnect.
                  </AlertDescription>
                </Alert>
              )}

              {syncSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600 inline mr-2" />
                  <AlertDescription className="text-green-700 inline">
                    Data successfully synced!
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  💾 Your workout data is being saved locally and will sync automatically
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isOnline && (
                <Button
                  onClick={handleRetrySync}
                  disabled={isSyncing}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Retry Sync'}
                </Button>
              )}

              <Button
                onClick={retry}
                variant="outline"
                className="w-full h-12 border-gray-300 hover:bg-gray-50"
              >
                Continue Workout
              </Button>

              <Button
                onClick={() => (window.location.href = '/workout/dashboard')}
                variant="outline"
                className="w-full h-11 border-gray-300 hover:bg-gray-50"
              >
                Back to Dashboard
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-sm text-gray-600">
                Connection Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
              </div>
              <div className="text-xs text-gray-500">Retry attempt {retryCount} of 3</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WorkoutErrorBoundary
      errorType="data"
      onError={handleDataSyncError}
      fallback={customFallback}
      maxRetries={3}
    >
      {children}
    </WorkoutErrorBoundary>
  )
}
