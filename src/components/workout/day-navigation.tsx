'use client'

import { useState } from 'react'
import { Play, Square, SkipForward, SkipBack, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { useWorkoutStore } from '@/stores/workout-store'
import type { MilestoneDay } from '@/types/program'
import { isAmrapDay } from '@/utils/type-guards'

interface DayNavigationProps {
  day: MilestoneDay
  className?: string
}

export function DayNavigation({ day, className = '' }: DayNavigationProps) {
  const router = useRouter()
  const [showEndDialog, setShowEndDialog] = useState(false)

  const {
    isSessionActive,
    currentExerciseIndex,
    completedExercises,
    currentRound,
    startSession,
    endSession,
    setCurrentExercise,
    resetSession,
    canNavigateNext,
    canNavigatePrevious,
    getCurrentExercise,
  } = useWorkoutStore()

  const exercises = day.exercises || []
  const totalExercises = exercises.length
  const isAmrap = isAmrapDay(day)
  const currentExercise = getCurrentExercise()

  const handleStartWorkout = () => {
    startSession(day)
    // Navigate to first exercise
    if (exercises.length > 0 && exercises[0]?.id) {
      router.push(`/workout/exercise/${exercises[0].id}`)
    }
  }

  const handleEndWorkout = () => {
    endSession()
    setShowEndDialog(false)
    router.push('/workout/dashboard')
  }

  const handleNavigateToExercise = (index: number) => {
    if (index >= 0 && index < exercises.length && exercises[index]?.id) {
      setCurrentExercise(index)
      router.push(`/workout/exercise/${exercises[index].id}`)
    }
  }

  const handlePreviousExercise = () => {
    if (canNavigatePrevious()) {
      const newIndex = currentExerciseIndex - 1
      handleNavigateToExercise(newIndex)
    }
  }

  const handleNextExercise = () => {
    if (canNavigateNext()) {
      const newIndex = currentExerciseIndex + 1
      handleNavigateToExercise(newIndex)
    }
  }

  const handleResetSession = () => {
    resetSession()
  }

  // Calculate progress for display
  const progressStats = {
    completedCount: completedExercises.length,
    totalCount: totalExercises,
    currentPosition: currentExerciseIndex + 1,
    completionPercentage:
      totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0,
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            Workout Navigation
            {isAmrap && (
              <Badge variant="secondary" className="text-xs">
                AMRAP
              </Badge>
            )}
          </span>
          {isSessionActive && <Badge className="bg-green-500 text-white">Active Session</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Controls */}
        <div className="space-y-3">
          {!isSessionActive ? (
            <Button
              onClick={handleStartWorkout}
              className="w-full h-12 text-lg"
              disabled={totalExercises === 0}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Workout
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="h-12">
                    <Square className="mr-2 h-4 w-4" />
                    End Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Workout Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to end this workout session? Your progress will be
                      saved, but you&apos;ll return to the dashboard.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleEndWorkout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      End Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={handleResetSession} className="h-12">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Progress
              </Button>
            </div>
          )}
        </div>

        {/* Session Progress */}
        {isSessionActive && (
          <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Progress</span>
              <Badge variant="outline">
                {progressStats.completedCount}/{progressStats.totalCount} exercises
                {isAmrap && ` (Round ${currentRound})`}
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold">
                Exercise {progressStats.currentPosition} of {progressStats.totalCount}
              </p>
              {currentExercise && (
                <p className="text-sm text-muted-foreground mt-1">
                  {typeof currentExercise.exercise === 'object'
                    ? currentExercise.exercise.title
                    : `Exercise ${progressStats.currentPosition}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Exercise Navigation */}
        {isSessionActive && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Exercise Navigation</h3>
              <span className="text-xs text-muted-foreground">
                Current: #{progressStats.currentPosition}
              </span>
            </div>

            {/* Previous/Next Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousExercise}
                disabled={!canNavigatePrevious()}
                className="flex-1"
              >
                <SkipBack className="mr-2 h-4 w-4" />
                Previous
                {canNavigatePrevious() && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    #{currentExerciseIndex}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleNextExercise}
                disabled={!canNavigateNext()}
                className="flex-1"
              >
                Next
                <SkipForward className="ml-2 h-4 w-4" />
                {canNavigateNext() && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    #{currentExerciseIndex + 2}
                  </span>
                )}
              </Button>
            </div>

            {/* Current Exercise Info */}
            {currentExercise && (
              <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                <p className="font-medium text-sm">Current Exercise</p>
                <p className="text-lg">
                  {typeof currentExercise.exercise === 'object'
                    ? currentExercise.exercise.title
                    : `Exercise ${progressStats.currentPosition}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentExercise.sets} sets × {currentExercise.reps} reps
                  {currentExercise.restPeriod && ` • ${currentExercise.restPeriod}s rest`}
                </p>
              </div>
            )}

            {/* Quick Exercise Jump (for advanced users) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Jump</h4>
              <div className="grid grid-cols-5 gap-1">
                {exercises.slice(0, 10).map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id)
                  const isCurrent = index === currentExerciseIndex

                  return (
                    <Button
                      key={exercise.id}
                      variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8 w-full text-xs"
                      onClick={() => handleNavigateToExercise(index)}
                    >
                      {index + 1}
                      {isCompleted && '✓'}
                    </Button>
                  )
                })}
                {exercises.length > 10 && (
                  <span className="text-xs text-muted-foreground flex items-center justify-center">
                    +{exercises.length - 10}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Day Information */}
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-medium text-sm">Day Information</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Total Exercises: {totalExercises}</p>
            <p>Day Type: {day.dayType}</p>
            {isAmrap && day.amrapDuration && <p>AMRAP Duration: {day.amrapDuration} minutes</p>}
            {day.restNotes && (
              <p className="text-xs mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <strong>Rest Notes:</strong> {day.restNotes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
