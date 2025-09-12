'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Repeat, Weight, Activity } from 'lucide-react'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { useWorkoutStore } from '@/stores/workout-store'
import type { DayExercise, Exercise } from '@/types/program'

export interface WorkoutDataEntryData {
  sets: number
  reps: number
  notes: string
  weight?: number | undefined
  time?: number | undefined
  distance?: number | undefined
  distanceUnit?: 'meters' | 'miles' | undefined
  timeUnit?: 'seconds' | 'minutes' | 'hours' | undefined
}

export interface AmrapDataEntry {
  totalRoundsCompleted: number
  currentRoundProgress: number
  timeTaken: number
  notes: string
}

export interface ExerciseCompletionConfirmationProps {
  exercise: Exercise
  exerciseConfig: DayExercise
  workoutData?: WorkoutDataEntryData
  amrapData?: AmrapDataEntry
  isAmrap?: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ExerciseCompletionConfirmation({
  exercise,
  exerciseConfig: _exerciseConfig,
  workoutData,
  amrapData,
  isAmrap = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ExerciseCompletionConfirmationProps) {
  const { currentRound } = useWorkoutStore()
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const renderWorkoutSummary = () => {
    if (!workoutData) return null

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Sets and Reps */}
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Sets:</span>
            <Badge variant="outline">{workoutData.sets}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Reps:</span>
            <Badge variant="outline">{workoutData.reps}</Badge>
          </div>

          {/* Weight */}
          {workoutData.weight && (
            <div className="flex items-center gap-2 col-span-2">
              <Weight className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Weight:</span>
              <Badge variant="outline">{workoutData.weight} lbs</Badge>
            </div>
          )}

          {/* Time */}
          {workoutData.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Time:</span>
              <Badge variant="outline">
                {formatDuration(workoutData.time, workoutData.timeUnit || 'seconds')}
              </Badge>
            </div>
          )}

          {/* Distance */}
          {workoutData.distance && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Distance:</span>
              <Badge variant="outline">
                {formatDistance(workoutData.distance, workoutData.distanceUnit || 'meters')}
              </Badge>
            </div>
          )}
        </div>

        {/* Notes */}
        {workoutData.notes && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm">{workoutData.notes}</p>
          </div>
        )}
      </div>
    )
  }

  const renderAmrapSummary = () => {
    if (!amrapData) return null

    const completedRounds = amrapData.totalRoundsCompleted
    const partialProgress = amrapData.currentRoundProgress
    const timeTaken = amrapData.timeTaken

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Rounds */}
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Rounds:</span>
            <Badge variant="outline">{completedRounds}</Badge>
          </div>

          {/* Time Taken */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Time:</span>
            <Badge variant="outline">{formatDuration(timeTaken, 'seconds')}</Badge>
          </div>

          {/* Partial Progress */}
          {partialProgress > 0 && (
            <div className="flex items-center gap-2 col-span-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Partial Round:</span>
              <Badge variant="outline">{partialProgress} exercises</Badge>
            </div>
          )}
        </div>

        {/* Performance Summary */}
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg border">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {completedRounds}
              {partialProgress > 0 && (
                <span className="text-sm text-muted-foreground"> + {partialProgress}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Total rounds {partialProgress > 0 ? '(+ partial)' : 'completed'}
            </div>
          </div>
        </div>

        {/* Notes */}
        {amrapData.notes && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm">{amrapData.notes}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-lg">Complete Exercise?</CardTitle>
        <p className="text-sm text-muted-foreground">{exercise.title}</p>
        {isAmrap && (
          <Badge variant="secondary" className="mx-auto w-fit">
            Round {currentRound}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exercise Summary */}
        <div className="border rounded-lg p-3 bg-muted/20">
          {isAmrap ? renderAmrapSummary() : renderWorkoutSummary()}
        </div>

        {/* Confirmation Message */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            {isAmrap
              ? 'Mark this round as complete and continue to next exercise?'
              : 'Mark this exercise as complete?'}
          </p>
        </div>

        {/* Touch-Friendly Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12 text-base"
            onClick={onCancel}
            disabled={isLoading || isConfirming}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
            onClick={handleConfirm}
            disabled={isLoading || isConfirming}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isConfirming ? 'Confirming...' : 'Complete'}
          </Button>
        </div>

        {/* Loading State */}
        {(isLoading || isConfirming) && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              {isConfirming ? 'Confirming completion...' : 'Loading...'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
