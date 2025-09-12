'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutStore } from '@/stores/workout-store'
import { DayOverview } from '@/components/workout/day-overview'
import { ExerciseList } from '@/components/workout/exercise-list'
import { ProgressIndicators } from '@/components/workout/progress-indicators'
import { DayNavigation } from '@/components/workout/day-navigation'
import { TimeEstimates } from '@/components/workout/time-estimates'
import type { Program } from '@/types/program'

interface WorkoutDashboardClientProps {
  initialProgram: Program | null
  initialMilestoneIndex: number
  initialDayIndex: number
  initialError: string | null
  initialErrorType: string | null
  className?: string
}

export function WorkoutDashboardClient({
  initialProgram,
  initialMilestoneIndex,
  initialDayIndex,
  initialError,
  initialErrorType: _initialErrorType,
  className: _className = '',
}: WorkoutDashboardClientProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(initialError)

  const {
    currentProgram,
    currentDayIndex,
    getCurrentMilestone,
    getCurrentDay,
    setCurrentProgram,
    startSession,
  } = useWorkoutStore()

  // Initialize program data from server-side props
  useEffect(() => {
    if (initialProgram) {
      // Set the real program data in the workout store
      setCurrentProgram(initialProgram, initialMilestoneIndex, initialDayIndex)
    } else if (initialError) {
      // Handle error cases from server-side
      setError(initialError)
    }
  }, [initialProgram, initialMilestoneIndex, initialDayIndex, initialError, setCurrentProgram])

  const currentMilestone = getCurrentMilestone()
  const currentDay = getCurrentDay()

  // Handle starting a workout session
  const handleStartWorkout = () => {
    if (!currentDay || !currentDay.exercises || currentDay.exercises.length === 0) {
      return
    }

    startSession(currentDay)

    // Navigate to first exercise
    const firstExercise = currentDay.exercises[0]
    if (firstExercise?.exercise) {
      const exerciseId =
        typeof firstExercise.exercise === 'string'
          ? firstExercise.exercise
          : firstExercise.exercise.id

      // Build search params for exercise configuration
      const params = new URLSearchParams()
      if (firstExercise.sets > 0) params.set('sets', firstExercise.sets.toString())
      if (firstExercise.reps > 0) params.set('reps', firstExercise.reps.toString())
      if (firstExercise.weight) params.set('weight', firstExercise.weight.toString())
      if (firstExercise.durationValue && firstExercise.durationUnit) {
        params.set('durationValue', firstExercise.durationValue.toString())
        params.set('durationUnit', firstExercise.durationUnit)
      }
      if (firstExercise.distanceValue && firstExercise.distanceUnit) {
        params.set('distanceValue', firstExercise.distanceValue.toString())
        params.set('distanceUnit', firstExercise.distanceUnit)
      }
      if (firstExercise.restPeriod) params.set('restPeriod', firstExercise.restPeriod.toString())
      if (firstExercise.notes) params.set('notes', firstExercise.notes)

      const searchString = params.toString()
      const url = searchString
        ? `/workout/exercise/${exerciseId}?${searchString}`
        : `/workout/exercise/${exerciseId}`
      router.push(url)
    }
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center px-4 sm:px-6">
            <h1 className="text-lg font-semibold sm:text-xl">Workout Dashboard</h1>
          </div>
        </div>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-red-600 text-4xl">⚠️</div>
              <h2 className="text-lg font-semibold">Unable to Load Program</h2>
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle case where data isn't loaded yet
  if (!currentProgram || !currentMilestone || !currentDay) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center px-4 sm:px-6">
            <h1 className="text-lg font-semibold sm:text-xl">Workout Dashboard</h1>
          </div>
        </div>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-64">
            <p className="text-muted-foreground">No workout program available.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6">
          <h1 className="text-lg font-semibold sm:text-xl">Workout Dashboard</h1>
        </div>
      </div>

      {/* Main content with mobile-first responsive design */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile layout: single column, tablet+: two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Day overview - full width on mobile, left column on desktop */}
            <div className="lg:col-span-2">
              <DayOverview
                day={currentDay}
                dayNumber={currentDayIndex + 1}
                milestoneName={currentMilestone.name}
                onStartWorkout={handleStartWorkout}
              />
            </div>
          </div>

          {/* Second row: Exercise list and Progress side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Exercise list - 2 columns on desktop */}
            <div className="lg:col-span-2">
              <ExerciseList exercises={currentDay.exercises || []} />
            </div>

            {/* Progress indicators - 1 column on desktop */}
            <div className="space-y-4 sm:space-y-6">
              <ProgressIndicators day={currentDay} />
              <TimeEstimates day={currentDay} />
            </div>
          </div>

          {/* Navigation - full width on all screen sizes */}
          <div className="w-full">
            <DayNavigation day={currentDay} />
          </div>
        </div>
      </div>
    </div>
  )
}
