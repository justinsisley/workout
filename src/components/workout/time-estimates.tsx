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
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          Time Estimates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
        {/* Estimated Total Duration */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-sm sm:text-base font-semibold">
              {isAmrap ? 'AMRAP Duration' : 'Estimated Duration'}
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-base sm:text-lg px-3 py-2 font-bold">
            {formatTimeNatural(timeCalc.estimatedTotalSeconds)}
          </Badge>
        </div>

        {/* Exercise vs Rest Time Breakdown */}
        {!isAmrap && (
          <div className="space-y-3 p-3 sm:p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground font-medium">Exercise Time</span>
              <span className="font-mono font-bold">
                {formatTimeNatural(timeCalc.exerciseSeconds)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground font-medium">Rest Time</span>
              <span className="font-mono font-bold">{formatTimeNatural(timeCalc.restSeconds)}</span>
            </div>
          </div>
        )}

        {/* Session Progress */}
        {sessionActive && (
          <>
            <div className="space-y-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200">
                  Session Progress
                </span>
                <span className="text-lg sm:text-xl font-mono font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3 sm:h-4" />
            </div>

            {/* Session Elapsed Time */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                <span className="text-sm sm:text-base font-semibold">Elapsed</span>
              </div>
              <Badge
                variant="secondary"
                className="font-mono text-base sm:text-lg px-3 py-2 font-bold"
              >
                {formatTime(sessionElapsed)}
              </Badge>
            </div>

            {/* Time Remaining */}
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <span className="text-sm sm:text-base font-semibold text-orange-800 dark:text-orange-200">
                {isAmrap ? 'AMRAP Time Left' : 'Estimated Remaining'}
              </span>
              <Badge
                variant={timeRemaining < 60 && isAmrap ? 'destructive' : 'default'}
                className="font-mono text-lg sm:text-xl px-4 py-2 font-bold"
              >
                {formatTime(timeRemaining)}
              </Badge>
            </div>

            {/* AMRAP Round Information */}
            {isAmrap && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-200">
                  Current Round
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-base sm:text-lg px-3 py-2 font-bold"
                >
                  Round {currentRound}
                </Badge>
              </div>
            )}
          </>
        )}

        {/* Completion Stats */}
        {sessionActive && exercises.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm sm:text-base p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-purple-800 dark:text-purple-200 font-semibold">
                {isAmrap ? 'Exercises Completed' : 'Exercise Progress'}
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100">
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
