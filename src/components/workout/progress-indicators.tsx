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
    <div className={`space-y-4 ${className}`}>
      {/* Overall Day Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Day Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isAmrap ? 'Exercises per Round' : 'Exercise Completion'}
            </span>
            <Badge variant={dayProgress.isComplete ? 'default' : 'secondary'}>
              {completedExercises.length}/{totalExercises}
              {isAmrap && ` (Round ${currentRound})`}
            </Badge>
          </div>

          <Progress value={exerciseCompletionPercentage} className="h-3" />

          {!isAmrap && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Current Position: {dayProgress.currentPosition} of {dayProgress.totalPositions}
              </span>
              {dayProgress.isComplete && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCw className="h-5 w-5" />
              AMRAP Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Round Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Round Progress</span>
                <Badge variant="outline">Round {currentRound}</Badge>
              </div>
              <Progress value={amrapProgress.currentRoundCompletion} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {amrapProgress.currentRoundExercisesCompleted}/{totalExercises} exercises
              </div>
            </div>

            {/* Total Rounds Completed */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completed Rounds</span>
              </div>
              <Badge className="bg-green-500 text-white">
                {amrapProgress.totalRoundsCompleted}
              </Badge>
            </div>

            {/* Total Exercises Completed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Exercises</span>
              </div>
              <Badge variant="secondary">{totalExercisesCompleted}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Information */}
      {sessionStartTime && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session Duration</span>
              <Badge variant="outline">{sessionDurationMinutes || 0} minutes</Badge>
            </div>

            {isAmrap && day.amrapDuration && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">AMRAP Time Limit</span>
                <Badge variant="secondary">{day.amrapDuration} minutes</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Exercise Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Exercise Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {exercises.map((exercise, index) => {
              const isCompleted = completedExercises.includes(exercise.id)
              const isCurrent = index === currentExerciseIndex

              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20'
                      : isCompleted
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : 'hover:bg-secondary/50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
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
                    <p className="text-sm font-medium truncate">
                      {typeof exercise.exercise === 'object'
                        ? exercise.exercise.title
                        : `Exercise ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {isCurrent && !isCompleted && (
                      <Badge variant="outline" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {isCompleted && <Badge className="text-xs bg-green-500 text-white">Done</Badge>}
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
