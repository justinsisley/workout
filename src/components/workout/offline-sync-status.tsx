'use client'

import React, { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react'
import { useOfflineSync } from '@/hooks/use-offline-sync'

interface OfflineSyncStatusProps {
  className?: string
  compact?: boolean
  showDetails?: boolean
}

export default function OfflineSyncStatus({
  className = '',
  compact = false,
  showDetails = false,
}: OfflineSyncStatusProps) {
  const { status, triggerSync, clearOfflineData, getPendingData, isOnline, canSync } =
    useOfflineSync()

  const [expanded, setExpanded] = useState(showDetails)
  const [isManuallyTriggering, setIsManuallyTriggering] = useState(false)

  const handleManualSync = async () => {
    setIsManuallyTriggering(true)
    try {
      await triggerSync(true)
    } finally {
      setIsManuallyTriggering(false)
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const getStatusColor = () => {
    if (!isOnline) return 'border-red-200 bg-red-50'
    if (status.isSyncing) return 'border-blue-200 bg-blue-50'
    if (status.pendingItems > 0) return 'border-orange-200 bg-orange-50'
    return 'border-green-200 bg-green-50'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline - Data saved locally'
    if (status.isSyncing) return 'Syncing workout data...'
    if (status.pendingItems > 0) return `${status.pendingItems} items pending sync`
    return 'All data synced'
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-600" />
    if (status.isSyncing) return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
    if (status.pendingItems > 0) return <Clock className="w-4 h-4 text-orange-600" />
    return <CheckCircle className="w-4 h-4 text-green-600" />
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm text-gray-700">{getStatusText()}</span>
        {status.pendingItems > 0 && canSync && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={isManuallyTriggering}
            className="text-xs h-6 px-2"
          >
            Sync
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <Alert className={`${getStatusColor()} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-medium text-sm">{getStatusText()}</div>
              {status.lastSyncTime && (
                <div className="text-xs opacity-75 mt-1">
                  Last sync: {formatLastSync(status.lastSyncTime)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {status.pendingItems > 0 && canSync && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                disabled={isManuallyTriggering}
                className="text-xs"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${isManuallyTriggering ? 'animate-spin' : ''}`}
                />
                Sync Now
              </Button>
            )}

            {(status.pendingItems > 0 || status.errors.length > 0) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="text-xs p-1"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {status.isSyncing && status.pendingItems > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Syncing progress</span>
              <span>{status.pendingItems} remaining</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {expanded && (
          <div className="mt-4 space-y-3">
            {status.pendingItems > 0 && (
              <div>
                <div className="font-medium text-sm mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-1" />
                  Pending Data ({status.pendingItems} items)
                </div>
                <div className="space-y-1">
                  {getPendingData()
                    .slice(0, 5)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="text-xs bg-white/50 rounded p-2 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{item.type.replace('_', ' ')}</div>
                          <div className="text-gray-600">
                            {new Date(item.timestamp).toLocaleTimeString()}
                            {item.retryCount > 0 && ` (${item.retryCount} retries)`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Priority: {item.priority}</div>
                        </div>
                      </div>
                    ))}
                  {getPendingData().length > 5 && (
                    <div className="text-xs text-gray-600 text-center py-1">
                      ... and {getPendingData().length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {status.errors.length > 0 && (
              <div>
                <div className="font-medium text-sm mb-2 flex items-center text-red-700">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Recent Errors
                </div>
                <div className="space-y-1">
                  {status.errors.slice(-3).map((error, index) => (
                    <div
                      key={index}
                      className="text-xs bg-red-50 border border-red-200 rounded p-2"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              {status.pendingItems > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearOfflineData}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear Pending
                  </Button>
                </>
              )}
              <div className="flex-1"></div>
              <div className="text-xs text-gray-500 flex items-center">
                <Wifi className="w-3 h-3 mr-1" />
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        )}
      </Alert>

      {!isOnline && status.pendingItems > 0 && (
        <div className="mt-2">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-800">
              💾 {status.pendingItems} workout changes saved locally. They&apos;ll sync
              automatically when you reconnect to the internet.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
