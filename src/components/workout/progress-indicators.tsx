'use client'

import { CheckCircle2, Clock, Target, Dumbbell, RotateCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { MilestoneDay } from '@/types/program'
import { isAmrapDay } from '@/utils/type-guards'

interface ProgressIndicatorsProps {
  day: MilestoneDay
  completedExercises?: string[]
  currentRound?: number
  currentExerciseIndex?: number
  totalExercisesCompleted?: number
  sessionStartTime?: number
  className?: string
}

export function ProgressIndicators({
  day,
  completedExercises = [],
  currentRound = 1,
  currentExerciseIndex = 0,
  totalExercisesCompleted = 0,
  sessionStartTime,
  className = '',
}: ProgressIndicatorsProps) {
  const exercises = day.exercises || []
  const totalExercises = exercises.length
  const isAmrap = isAmrapDay(day)

  // Calculate completion percentages
  const exerciseCompletionPercentage =
    totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0

  // For AMRAP, calculate round-based progress
  const amrapProgress = isAmrap
    ? {
        currentRoundCompletion:
          totalExercises > 0 ? Math.round((currentExerciseIndex / totalExercises) * 100) : 0,
        totalRoundsCompleted: Math.floor(totalExercisesCompleted / totalExercises),
        currentRoundExercisesCompleted: totalExercisesCompleted % totalExercises,
      }
    : null

  // Calculate session time if available
  const sessionDurationMinutes = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime) / (1000 * 60))
    : null

  // Day-level progress tracking
  const dayProgress = {
    isStarted: completedExercises.length > 0 || currentExerciseIndex > 0,
    isComplete: completedExercises.length === totalExercises && !isAmrap,
    currentPosition: currentExerciseIndex + 1,
    totalPositions: totalExercises,
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Overall Day Progress */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
            <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            Day Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base text-muted-foreground font-medium">
              {isAmrap ? 'Exercises per Round' : 'Exercise Completion'}
            </span>
            <Badge
              variant={dayProgress.isComplete ? 'default' : 'secondary'}
              className="text-sm sm:text-base px-3 py-1 font-semibold"
            >
              {completedExercises.length}/{totalExercises}
              {isAmrap && ` (Round ${currentRound})`}
            </Badge>
          </div>

          <Progress value={exerciseCompletionPercentage} className="h-4 sm:h-6" />

          {!isAmrap && (
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground font-medium">
                Current Position: {dayProgress.currentPosition} of {dayProgress.totalPositions}
              </span>
              {dayProgress.isComplete && (
                <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Complete
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AMRAP-specific Progress */}
      {isAmrap && amrapProgress && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
              <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
              AMRAP Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            {/* Current Round Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-muted-foreground font-medium">
                  Current Round Progress
                </span>
                <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">
                  Round {currentRound}
                </Badge>
              </div>
              <Progress value={amrapProgress.currentRoundCompletion} className="h-3 sm:h-4" />
              <div className="text-sm sm:text-base text-muted-foreground text-center font-medium">
                {amrapProgress.currentRoundExercisesCompleted}/{totalExercises} exercises
              </div>
            </div>

            {/* Total Rounds Completed */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                <span className="text-sm sm:text-base font-medium">Completed Rounds</span>
              </div>
              <Badge className="bg-green-500 text-white px-4 py-2 text-lg font-bold">
                {amrapProgress.totalRoundsCompleted}
              </Badge>
            </div>

            {/* Total Exercises Completed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                <span className="text-sm sm:text-base font-medium">Total Exercises</span>
              </div>
              <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">
                {totalExercisesCompleted}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Information */}
      {sessionStartTime && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-muted-foreground font-medium">
                Session Duration
              </span>
              <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">
                {sessionDurationMinutes || 0} minutes
              </Badge>
            </div>

            {isAmrap && day.amrapDuration && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm sm:text-base text-muted-foreground font-medium">
                  AMRAP Time Limit
                </span>
                <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
                  {day.amrapDuration} minutes
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Exercise Status */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
            <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
            Exercise Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
            {exercises.map((exercise, index) => {
              const isCompleted = completedExercises.includes(exercise.id)
              const isCurrent = index === currentExerciseIndex

              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-primary/10 border-2 border-primary/30 shadow-sm'
                      : isCompleted
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-secondary/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm sm:text-base font-bold ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">
                      {typeof exercise.exercise === 'object'
                        ? exercise.exercise.title
                        : `Exercise ${index + 1}`}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {isCurrent && !isCompleted && (
                      <Badge
                        variant="outline"
                        className="text-xs sm:text-sm px-2 py-1 font-semibold"
                      >
                        Current
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="text-xs sm:text-sm px-2 py-1 bg-green-500 text-white font-semibold">
                        Done
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
