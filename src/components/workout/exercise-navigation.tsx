'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Home, CheckCircle2, Clock } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workout-store'
import { Button } from '@/components/ui/button'
import type { DayExercise } from '@/types/program'

interface ExerciseNavigationProps {
  currentExerciseId: string
  className?: string
}

export function ExerciseNavigation({
  currentExerciseId: _currentExerciseId,
  className = '',
}: ExerciseNavigationProps) {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const {
    getCurrentDay,
    canNavigateNext,
    canNavigatePrevious,
    getNextExercise,
    getPreviousExercise,
    setCurrentExercise,
    currentExerciseIndex,
    exerciseProgress,
  } = useWorkoutStore()

  // Prevent hydration mismatch by only showing content after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Don't render anything until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div className={`flex justify-between items-center ${className}`}>
        <div className="w-32 h-11 bg-gray-100 rounded animate-pulse" />
        <div className="w-20 h-6 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="w-16 h-11 bg-gray-100 rounded animate-pulse" />
          <div className="w-16 h-11 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const currentDay = getCurrentDay()
  const nextExercise = getNextExercise()
  const prevExercise = getPreviousExercise()
  const hasNext = canNavigateNext()
  const hasPrev = canNavigatePrevious()

  if (!currentDay?.exercises) {
    return null
  }

  const handlePreviousExercise = () => {
    if (hasPrev && prevExercise) {
      const prevIndex = currentExerciseIndex - 1
      setCurrentExercise(prevIndex)

      // Navigate to previous exercise page
      const exerciseId =
        typeof prevExercise.exercise === 'string' ? prevExercise.exercise : prevExercise.exercise.id

      const searchParams = buildExerciseSearchParams(prevExercise)
      router.push(`/workout/exercise/${exerciseId}${searchParams}`)
    }
  }

  const handleNextExercise = () => {
    if (hasNext && nextExercise) {
      const nextIndex = currentExerciseIndex + 1
      setCurrentExercise(nextIndex)

      // Navigate to next exercise page
      const exerciseId =
        typeof nextExercise.exercise === 'string' ? nextExercise.exercise : nextExercise.exercise.id

      const searchParams = buildExerciseSearchParams(nextExercise)
      router.push(`/workout/exercise/${exerciseId}${searchParams}`)
    }
  }

  const handleBackToDashboard = () => {
    router.push('/workout/dashboard')
  }

  return (
    <div className={`flex justify-between items-center ${className}`}>
      {/* Back to Dashboard */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleBackToDashboard}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Workout</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Exercise Progress Indicator with Completion Status */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm text-gray-500 font-medium">
          Exercise {currentExerciseIndex + 1} of {currentDay.exercises.length}
        </div>
        {currentDay.exercises && currentDay.exercises[currentExerciseIndex] && (() => {
          const currentExercise = currentDay.exercises[currentExerciseIndex]
          const exerciseId = typeof currentExercise.exercise === 'string' 
            ? currentExercise.exercise 
            : currentExercise.exercise.id
          const progress = exerciseProgress[exerciseId]
          
          if (progress?.isCompleted) {
            return (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>Complete</span>
              </div>
            )
          } else if (progress?.hasData) {
            return (
              <div className="flex items-center gap-1 text-blue-600 text-xs">
                <Clock className="w-3 h-3" />
                <span>{progress.completionPercentage}%</span>
              </div>
            )
          } else {
            return (
              <div className="text-xs text-gray-400">
                Not started
              </div>
            )
          }
        })()}
      </div>

      {/* Previous/Next Navigation */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handlePreviousExercise}
          disabled={!hasPrev}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] h-11 relative"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
          {prevExercise && (() => {
            const exerciseId = typeof prevExercise.exercise === 'string' 
              ? prevExercise.exercise 
              : prevExercise.exercise.id
            const progress = exerciseProgress[exerciseId]
            
            if (progress?.isCompleted) {
              return (
                <CheckCircle2 className="w-3 h-3 text-green-600 absolute -top-1 -right-1" />
              )
            }
            return null
          })()}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleNextExercise}
          disabled={!hasNext}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] h-11 relative"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="w-4 h-4" />
          {nextExercise && (() => {
            const exerciseId = typeof nextExercise.exercise === 'string' 
              ? nextExercise.exercise 
              : nextExercise.exercise.id
            const progress = exerciseProgress[exerciseId]
            
            if (progress?.isCompleted) {
              return (
                <CheckCircle2 className="w-3 h-3 text-green-600 absolute -top-1 -right-1" />
              )
            }
            return null
          })()}
        </Button>
      </div>
    </div>
  )
}

/**
 * Helper function to build search parameters for exercise configuration
 */
function buildExerciseSearchParams(exercise: DayExercise): string {
  const params = new URLSearchParams()

  if (exercise.sets > 0) params.set('sets', exercise.sets.toString())
  if (exercise.reps > 0) params.set('reps', exercise.reps.toString())
  if (exercise.weight) params.set('weight', exercise.weight.toString())
  if (exercise.durationValue && exercise.durationUnit) {
    params.set('durationValue', exercise.durationValue.toString())
    params.set('durationUnit', exercise.durationUnit)
  }
  if (exercise.distanceValue && exercise.distanceUnit) {
    params.set('distanceValue', exercise.distanceValue.toString())
    params.set('distanceUnit', exercise.distanceUnit)
  }
  if (exercise.restPeriod) params.set('restPeriod', exercise.restPeriod.toString())
  if (exercise.notes) params.set('notes', exercise.notes)

  const searchString = params.toString()
  return searchString ? `?${searchString}` : ''
}
