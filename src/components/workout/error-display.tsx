'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  WorkoutError,
  UserAction,
  getWorkoutError,
  categorizeError,
  getSeverityClass,
  getSeverityIcon,
} from '@/lib/error-messages'
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Home,
  ArrowLeft,
  Play,
  Save,
  Edit,
  RotateCcw,
  CheckCircle,
  List,
  Square,
  Wifi,
  WifiOff,
  Signal,
  Smartphone,
  Server,
  GitCompare,
  Download,
  Lock,
  LogIn,
  ExternalLink,
  Navigation,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const iconMap = {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Home,
  ArrowLeft,
  Play,
  Save,
  Edit,
  RotateCcw,
  CheckCircle,
  List,
  Square,
  Wifi,
  WifiOff,
  Signal,
  Smartphone,
  Server,
  GitCompare,
  Download,
  Lock,
  LogIn,
  ExternalLink,
  Navigation,
}

interface ErrorDisplayProps {
  error: any
  onRetry?: () => void
  onCustomAction?: (actionType: string) => void
  className?: string
  compact?: boolean
}

interface UserFriendlyErrorProps {
  workoutError: WorkoutError
  onRetry?: () => void
  onCustomAction?: (actionType: string) => void
  className?: string
  compact?: boolean
}

export function ErrorDisplay({
  error,
  onRetry,
  onCustomAction,
  className = '',
  compact = false,
}: ErrorDisplayProps) {
  const errorType = categorizeError(error)
  const workoutError = getWorkoutError(errorType, { originalError: error })

  return (
    <UserFriendlyError
      workoutError={workoutError}
      {...(onRetry && { onRetry })}
      {...(onCustomAction && { onCustomAction })}
      className={className}
      compact={compact}
    />
  )
}

export function UserFriendlyError({
  workoutError,
  onRetry,
  onCustomAction,
  className = '',
  compact = false,
}: UserFriendlyErrorProps) {
  const router = useRouter()
  const SeverityIcon = iconMap[getSeverityIcon(workoutError.severity) as keyof typeof iconMap]

  const handleAction = (action: UserAction) => {
    switch (action.type) {
      case 'retry':
        onRetry?.()
        break

      case 'navigate':
        if (typeof action.action === 'string') {
          if (action.action.startsWith('http')) {
            window.open(action.action, '_blank')
          } else {
            router.push(action.action)
          }
        }
        break

      case 'refresh':
        window.location.reload()
        break

      case 'custom':
        if (typeof action.action === 'function') {
          action.action()
        } else if (typeof action.action === 'string') {
          onCustomAction?.(action.action)
        }
        break

      default:
        console.warn('Unknown action type:', action.type)
    }
  }

  const severityClass = getSeverityClass(workoutError.severity)

  if (compact) {
    return (
      <div className={`${className}`}>
        <Alert className={`${severityClass} border`}>
          <SeverityIcon className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">{workoutError.message}</AlertTitle>
          {workoutError.details && (
            <AlertDescription className="text-xs mt-1">{workoutError.details}</AlertDescription>
          )}
        </Alert>

        {workoutError.actionable && workoutError.userActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {workoutError.userActions.slice(0, 2).map((action, index) => {
              const ActionIcon = iconMap[action.icon as keyof typeof iconMap]
              return (
                <Button
                  key={index}
                  size="sm"
                  variant={action.primary ? 'default' : 'outline'}
                  onClick={() => handleAction(action)}
                  className="text-xs h-8"
                >
                  {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Alert className={`${severityClass} border`}>
        <SeverityIcon className="h-5 w-5" />
        <AlertTitle className="font-semibold text-base">{workoutError.message}</AlertTitle>
        <AlertDescription className="mt-2">{workoutError.details}</AlertDescription>

        {workoutError.code && (
          <div className="mt-3 text-xs opacity-75 font-mono">Error Code: {workoutError.code}</div>
        )}
      </Alert>

      {workoutError.actionable && workoutError.userActions.length > 0 && (
        <div className="mt-4 space-y-2">
          {workoutError.userActions.map((action, index) => {
            const ActionIcon = iconMap[action.icon as keyof typeof iconMap]
            return (
              <Button
                key={index}
                size="lg"
                variant={action.primary ? 'default' : 'outline'}
                onClick={() => handleAction(action)}
                className={`w-full h-12 font-medium ${
                  action.primary
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      )}

      {workoutError.technicalDetails && process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
            Technical Details (Dev Only)
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
            {workoutError.technicalDetails}
          </pre>
        </details>
      )}

      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 mb-1">
          💾 Your workout progress is automatically saved
        </div>
        {workoutError.severity === 'low' && (
          <div className="text-xs text-gray-500">
            This won&apos;t affect your current workout session
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorDisplay
