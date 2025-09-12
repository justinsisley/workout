'use client'

import { useEffect, useState } from 'react'
import { Clock, Timer, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { MilestoneDay } from '@/types/program'
import { isAmrapDay, hasDuration } from '@/utils/type-guards'
import { useWorkoutStore } from '@/stores/workout-store'

interface TimeEstimatesProps {
  day: MilestoneDay
  sessionActive?: boolean
}

interface TimeCalculation {
  totalSeconds: number
  exerciseSeconds: number
  restSeconds: number
  estimatedTotalSeconds: number
}

export function TimeEstimates({ day, sessionActive = false }: TimeEstimatesProps) {
  const [sessionElapsed, setSessionElapsed] = useState<number>(0)
  const [amrapTimeRemaining, setAmrapTimeRemaining] = useState<number | null>(null)

  const { sessionStartTime, currentExerciseIndex, currentRound, totalExercisesCompleted } =
    useWorkoutStore()

  const isAmrap = isAmrapDay(day)
  const exercises = day.exercises || []

  // Calculate total day duration from exercise specifications
  const calculateDayDuration = (): TimeCalculation => {
    let exerciseSeconds = 0
    let restSeconds = 0

    exercises.forEach((exercise) => {
      // Add exercise duration
      if (hasDuration(exercise)) {
        const multiplier =
          exercise.durationUnit === 'minutes' ? 60 : exercise.durationUnit === 'hours' ? 3600 : 1
        exerciseSeconds += (exercise.durationValue || 0) * multiplier * (exercise.sets || 1)
      } else {
        // Estimate time for non-duration exercises (assume 30 seconds per set)
        exerciseSeconds += 30 * (exercise.sets || 1)
      }

      // Add rest period between sets
      if (exercise.restPeriod && exercise.sets && exercise.sets > 1) {
        restSeconds += exercise.restPeriod * (exercise.sets - 1)
      }
    })

    const totalSeconds = exerciseSeconds + restSeconds

    // For AMRAP, use the specified duration
    const estimatedTotalSeconds =
      isAmrap && day.amrapDuration ? day.amrapDuration * 60 : totalSeconds

    return {
      totalSeconds,
      exerciseSeconds,
      restSeconds,
      estimatedTotalSeconds,
    }
  }

  const timeCalc = calculateDayDuration()

  // Calculate session elapsed time
  useEffect(() => {
    if (sessionActive && sessionStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        setSessionElapsed(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setSessionElapsed(0)
      return undefined
    }
  }, [sessionActive, sessionStartTime])

  // AMRAP timer countdown
  useEffect(() => {
    if (isAmrap && day.amrapDuration && sessionActive && sessionStartTime) {
      const totalAmrapSeconds = day.amrapDuration * 60

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        const remaining = Math.max(0, totalAmrapSeconds - elapsed)
        setAmrapTimeRemaining(remaining)

        if (remaining <= 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setAmrapTimeRemaining(null)
      return undefined
    }
  }, [isAmrap, day.amrapDuration, sessionActive, sessionStartTime])

  // Calculate time remaining based on current progress
  const calculateTimeRemaining = (): number => {
    if (isAmrap && amrapTimeRemaining !== null) {
      return amrapTimeRemaining
    }

    // For regular workouts, estimate based on progress
    const totalExercises = exercises.length
    const progressRatio = totalExercises > 0 ? currentExerciseIndex / totalExercises : 0
    const remainingSeconds = Math.max(0, timeCalc.estimatedTotalSeconds * (1 - progressRatio))

    return Math.floor(remainingSeconds)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeNatural = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
    return minutes > 0 ? `${minutes}m` : `${seconds}s`
  }

  const timeRemaining = calculateTimeRemaining()
  const progressPercentage = sessionActive
    ? Math.min(100, (sessionElapsed / timeCalc.estimatedTotalSeconds) * 100)
    : (totalExercisesCompleted / exercises.length) * 100

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Time Estimates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimated Total Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isAmrap ? 'AMRAP Duration' : 'Estimated Duration'}
            </span>
          </div>
          <Badge variant="outline" className="font-mono">
            {formatTimeNatural(timeCalc.estimatedTotalSeconds)}
          </Badge>
        </div>

        {/* Exercise vs Rest Time Breakdown */}
        {!isAmrap && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exercise Time</span>
              <span className="font-mono">{formatTimeNatural(timeCalc.exerciseSeconds)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rest Time</span>
              <span className="font-mono">{formatTimeNatural(timeCalc.restSeconds)}</span>
            </div>
          </div>
        )}

        {/* Session Progress */}
        {sessionActive && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session Progress</span>
                <span className="text-sm font-mono">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Session Elapsed Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Elapsed</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {formatTime(sessionElapsed)}
              </Badge>
            </div>

            {/* Time Remaining */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isAmrap ? 'AMRAP Time Left' : 'Estimated Remaining'}
              </span>
              <Badge
                variant={timeRemaining < 60 && isAmrap ? 'destructive' : 'default'}
                className="font-mono"
              >
                {formatTime(timeRemaining)}
              </Badge>
            </div>

            {/* AMRAP Round Information */}
            {isAmrap && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Round</span>
                <Badge variant="outline" className="font-mono">
                  Round {currentRound}
                </Badge>
              </div>
            )}
          </>
        )}

        {/* Completion Stats */}
        {sessionActive && exercises.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isAmrap ? 'Exercises Completed' : 'Exercise Progress'}
              </span>
              <span className="font-mono">
                {isAmrap
                  ? `${totalExercisesCompleted} completed`
                  : `${currentExerciseIndex + 1} of ${exercises.length}`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
