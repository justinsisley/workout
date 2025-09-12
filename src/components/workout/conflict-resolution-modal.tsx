'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConflictData, ConflictResolution, dataConflictManager } from '@/lib/conflict-resolution'
import {
  GitCompare,
  Smartphone,
  Server,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Calendar,
  Trophy,
} from 'lucide-react'

interface ConflictResolutionModalProps {
  isOpen: boolean
  conflicts: ConflictData[]
  onResolve: (resolutions: ConflictResolution[]) => void
  onCancel: () => void
}

interface ConflictItemProps {
  conflict: ConflictData
  resolution: ConflictResolution | null
  onResolve: (resolution: ConflictResolution) => void
}

function ConflictItem({ conflict, resolution, onResolve }: ConflictItemProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'remote' | 'merge' | null>(
    null,
  )

  const handleResolve = async (strategy: 'local' | 'remote' | 'merge') => {
    setSelectedStrategy(strategy)

    let resolvedResolution: ConflictResolution

    if (strategy === 'merge') {
      // Use automatic resolution
      resolvedResolution = await dataConflictManager.resolveConflict(conflict)
    } else {
      resolvedResolution = {
        strategy: strategy === 'local' ? 'local_wins' : 'remote_wins',
        resolvedData: strategy === 'local' ? conflict.local : conflict.remote,
        metadata: {
          resolvedAt: Date.now(),
          strategy: 'user_choice',
          userChoice: true,
        },
      }
    }

    onResolve(resolvedResolution)
  }

  const getConflictIcon = () => {
    switch (conflict.conflictType) {
      case 'exercise_progress':
        return <Activity className="w-5 h-5" />
      case 'day_completion':
        return <Calendar className="w-5 h-5" />
      case 'milestone_advancement':
        return <Trophy className="w-5 h-5" />
      case 'user_progress':
        return <User className="w-5 h-5" />
      default:
        return <GitCompare className="w-5 h-5" />
    }
  }

  const getConflictTitle = () => {
    switch (conflict.conflictType) {
      case 'exercise_progress':
        return 'Exercise Progress Conflict'
      case 'day_completion':
        return 'Day Completion Conflict'
      case 'milestone_advancement':
        return 'Milestone Progress Conflict'
      case 'user_progress':
        return 'User Progress Conflict'
      default:
        return 'Data Conflict'
    }
  }

  const formatDataPreview = (data: any) => {
    if (!data) return 'No data'

    switch (conflict.conflictType) {
      case 'exercise_progress':
        return `${data.sets || 0} sets, ${data.reps || 0} reps, ${data.weight || 0}lbs`
      case 'day_completion':
        return `${data.completedExercises?.length || 0} exercises completed, Day ${data.dayCompleted ? 'completed' : 'in progress'}`
      case 'milestone_advancement':
        return `Milestone ${data.currentMilestone || 0}, Day ${data.currentDay || 0}`
      case 'user_progress':
        return `${data.totalWorkoutsCompleted || 0} workouts, Last: ${data.lastWorkoutDate ? new Date(data.lastWorkoutDate).toLocaleDateString() : 'Never'}`
      default:
        return JSON.stringify(data).substring(0, 50) + '...'
    }
  }

  if (resolution) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-green-800">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">Resolved: {getConflictTitle()}</span>
        </div>
        <div className="text-sm text-green-700 mt-1">
          Strategy: {resolution.strategy} •
          {resolution.metadata.mergeDetails?.join(', ') || 'User decision applied'}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-orange-800 mb-3">
        {getConflictIcon()}
        <span className="font-medium">{getConflictTitle()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">This Device</span>
          </div>
          <div className="text-sm text-blue-700">{formatDataPreview(conflict.local)}</div>
          <div className="text-xs text-blue-600 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(conflict.local?.timestamp || conflict.local?.updatedAt || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Server className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-800">Server Data</span>
          </div>
          <div className="text-sm text-purple-700">{formatDataPreview(conflict.remote)}</div>
          <div className="text-xs text-purple-600 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(
              conflict.remote?.timestamp || conflict.remote?.updatedAt || 0,
            ).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Choose resolution:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedStrategy === 'local' ? 'default' : 'outline'}
            onClick={() => handleResolve('local')}
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            Use This Device
          </Button>

          <Button
            size="sm"
            variant={selectedStrategy === 'remote' ? 'default' : 'outline'}
            onClick={() => handleResolve('remote')}
            className="text-purple-700 border-purple-300 hover:bg-purple-50"
          >
            <Server className="w-4 h-4 mr-1" />
            Use Server Data
          </Button>

          <Button
            size="sm"
            variant={selectedStrategy === 'merge' ? 'default' : 'outline'}
            onClick={() => handleResolve('merge')}
            className="text-green-700 border-green-300 hover:bg-green-50"
          >
            <GitCompare className="w-4 h-4 mr-1" />
            Smart Merge
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ConflictResolutionModal({
  isOpen,
  conflicts,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map())
  const [isResolving, setIsResolving] = useState(false)

  const handleConflictResolve = (conflict: ConflictData, resolution: ConflictResolution) => {
    setResolutions((prev) => new Map(prev.set(conflict.conflictId, resolution)))
  }

  const handleResolveAll = async (strategy: 'local' | 'remote' | 'auto') => {
    setIsResolving(true)

    try {
      const unresolvedConflicts = conflicts.filter((c) => !resolutions.has(c.conflictId))

      let batchStrategy: 'auto' | 'local_wins_all' | 'remote_wins_all' = 'auto'
      if (strategy === 'local') batchStrategy = 'local_wins_all'
      if (strategy === 'remote') batchStrategy = 'remote_wins_all'

      const batchResolutions = await dataConflictManager.resolveBatchConflicts(
        unresolvedConflicts,
        batchStrategy,
      )

      // Add batch resolutions to our map
      const newResolutions = new Map(resolutions)
      unresolvedConflicts.forEach((conflict, index) => {
        const resolution = batchResolutions[index]
        if (resolution) {
          newResolutions.set(conflict.conflictId, resolution)
        }
      })

      setResolutions(newResolutions)
    } catch (error) {
      console.error('Batch resolution failed:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const handleFinish = () => {
    const allResolutions = Array.from(resolutions.values())
    onResolve(allResolutions)
  }

  const unresolvedCount = conflicts.length - resolutions.size
  const canFinish = resolutions.size === conflicts.length

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Data Conflicts Detected</span>
          </DialogTitle>
          <DialogDescription>
            We found {conflicts.length} conflicts between your local workout data and server data.
            Please choose how to resolve each conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              💡 <strong>Smart Merge</strong> automatically combines the best parts of both versions
              when possible. Choose individual options if you prefer specific data.
            </AlertDescription>
          </Alert>

          {unresolvedCount > 1 && (
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Resolve all remaining:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveAll('local')}
                disabled={isResolving}
                className="text-blue-700 border-blue-300"
              >
                Use This Device
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveAll('remote')}
                disabled={isResolving}
                className="text-purple-700 border-purple-300"
              >
                Use Server Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResolveAll('auto')}
                disabled={isResolving}
                className="text-green-700 border-green-300"
              >
                Smart Merge All
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <ConflictItem
                key={conflict.conflictId}
                conflict={conflict}
                resolution={resolutions.get(conflict.conflictId) || null}
                onResolve={(resolution) => handleConflictResolve(conflict, resolution)}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {unresolvedCount} of {conflicts.length} conflicts remaining
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel} disabled={isResolving}>
                Cancel
              </Button>

              <Button
                onClick={handleFinish}
                disabled={!canFinish || isResolving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Resolutions
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
