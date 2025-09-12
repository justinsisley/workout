'use client'

import { useState } from 'react'
import { Play, Square, SkipForward, SkipBack, RotateCcw, RotateCw } from 'lucide-react'
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
    setCurrentDay,
    resetSession,
    completeRound,
    canNavigateNext,
    canNavigatePrevious,
    getCurrentExercise,
    canNavigateToNextDay,
    canNavigateToPreviousDay,
    getNextDay,
    getPreviousDay,
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

  const handlePreviousDay = () => {
    const prevDay = getPreviousDay()
    if (prevDay) {
      setCurrentDay(prevDay.milestoneIndex, prevDay.dayIndex)
      router.push('/workout/dashboard')
    }
  }

  const handleNextDay = () => {
    const nextDay = getNextDay()
    if (nextDay) {
      setCurrentDay(nextDay.milestoneIndex, nextDay.dayIndex)
      router.push('/workout/dashboard')
    }
  }

  const handleCompleteRound = () => {
    if (isAmrap) {
      completeRound()
      // Optionally navigate to start of next round (first exercise)
      if (exercises.length > 0 && exercises[0]?.id) {
        setCurrentExercise(0)
      }
    }
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
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-semibold touch-manipulation"
              disabled={totalExercises === 0}
              size="lg"
            >
              <Play className="mr-2 h-6 w-6 sm:h-7 sm:w-7" />
              Start Workout
            </Button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
                  >
                    <Square className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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

              <Button
                variant="outline"
                onClick={handleResetSession}
                className="h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
              >
                <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Reset Progress
              </Button>

              {/* AMRAP Round Completion Button */}
              {isAmrap && (
                <Button
                  onClick={handleCompleteRound}
                  className="h-12 sm:h-14 text-base sm:text-lg font-semibold touch-manipulation bg-orange-600 hover:bg-orange-700"
                >
                  <RotateCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Complete Round {currentRound}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Session Progress */}
        {isSessionActive && (
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-medium">Session Progress</span>
              <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                {progressStats.completedCount}/{progressStats.totalCount} exercises
                {isAmrap && ` (Round ${currentRound})`}
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-lg sm:text-xl font-semibold">
                Exercise {progressStats.currentPosition} of {progressStats.totalCount}
              </p>
              {currentExercise && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
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
            <div className="flex gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={handlePreviousExercise}
                disabled={!canNavigatePrevious()}
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
              >
                <SkipBack className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
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
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <SkipForward className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                {canNavigateNext() && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    #{currentExerciseIndex + 2}
                  </span>
                )}
              </Button>
            </div>

            {/* Current Exercise Info */}
            {currentExercise && (
              <div className="p-3 sm:p-4 bg-primary/5 rounded-md border border-primary/20">
                <p className="font-medium text-sm sm:text-base">Current Exercise</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {typeof currentExercise.exercise === 'object'
                    ? currentExercise.exercise.title
                    : `Exercise ${progressStats.currentPosition}`}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {currentExercise.sets} sets × {currentExercise.reps} reps
                  {currentExercise.restPeriod && ` • ${currentExercise.restPeriod}s rest`}
                </p>
              </div>
            )}

            {/* Quick Exercise Jump (for advanced users) */}
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-medium">Quick Jump</h4>
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                {exercises.slice(0, 12).map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id)
                  const isCurrent = index === currentExerciseIndex

                  return (
                    <Button
                      key={exercise.id}
                      variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-10 sm:h-12 w-full text-sm font-medium touch-manipulation"
                      onClick={() => handleNavigateToExercise(index)}
                    >
                      {index + 1}
                      {isCompleted && ' ✓'}
                    </Button>
                  )
                })}
                {exercises.length > 12 && (
                  <div className="flex items-center justify-center text-xs text-muted-foreground bg-secondary/50 rounded-md h-10 sm:h-12">
                    +{exercises.length - 12}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Day Navigation */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-medium text-sm sm:text-base">Day Navigation</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handlePreviousDay}
              disabled={!canNavigateToPreviousDay()}
              variant="outline"
              size="sm"
              className="h-10 sm:h-12 text-sm font-medium touch-manipulation"
            >
              <SkipBack className="mr-2 h-4 w-4" />
              Previous Day
            </Button>
            <Button
              onClick={handleNextDay}
              disabled={!canNavigateToNextDay()}
              variant="outline"
              size="sm"
              className="h-10 sm:h-12 text-sm font-medium touch-manipulation"
            >
              Next Day
              <SkipForward className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Information */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-medium text-sm sm:text-base">Day Information</h3>
          <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="font-medium">Total Exercises:</span>
                <span className="text-lg font-semibold text-foreground">{totalExercises}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Day Type:</span>
                <span className="text-lg font-semibold text-foreground capitalize">
                  {day.dayType}
                </span>
              </div>
            </div>
            {isAmrap && day.amrapDuration && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  AMRAP Duration:{' '}
                </span>
                <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {day.amrapDuration} minutes
                </span>
              </div>
            )}
            {day.restNotes && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm sm:text-base">
                  <strong className="text-blue-800 dark:text-blue-200">Rest Notes:</strong>
                  <span className="ml-2 text-blue-700 dark:text-blue-300">{day.restNotes}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
