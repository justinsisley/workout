'use client'

import { useState, useEffect } from 'react'
import { useWorkoutStore } from '@/stores/workout-store'
import { WorkoutDataEntry } from '@/components/workout/workout-data-entry'
import { AmrapDataEntry } from '@/components/workout/amrap-data-entry'
import { isAmrapDay } from '@/utils/type-guards'
import type { Exercise, DayExercise } from '@/types/program'
import type { WorkoutDataEntryData } from '@/components/workout/workout-data-entry'
import type { AmrapDataEntryData } from '@/components/workout/amrap-data-entry'

interface ExerciseDataEntryClientProps {
  exercise: Exercise
  exerciseConfig: DayExercise
}

export function ExerciseDataEntryClient({
  exercise,
  exerciseConfig,
}: ExerciseDataEntryClientProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { getCurrentDay, completeExercise } = useWorkoutStore()

  // Prevent hydration mismatch by only accessing store after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const currentDay = getCurrentDay()

  if (!currentDay) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <p className="text-center text-gray-500">No active workout session</p>
      </div>
    )
  }

  const handleRegularWorkoutSave = async (data: WorkoutDataEntryData) => {
    setIsLoading(true)
    try {
      // TODO: Implement server action to save workout data
      console.log('Saving regular workout data:', data)

      // Mark exercise as completed
      completeExercise(exercise.id)

      // TODO: Navigate to next exercise or show success message
    } catch (error) {
      console.error('Error saving workout data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmrapSave = async (data: AmrapDataEntryData) => {
    setIsLoading(true)
    try {
      // TODO: Implement server action to save AMRAP data
      console.log('Saving AMRAP workout data:', data)

      // Mark exercise as completed
      completeExercise(exercise.id)

      // TODO: Navigate to next exercise or show success message
    } catch (error) {
      console.error('Error saving AMRAP data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // TODO: Navigate back to workout overview or previous page
    console.log('Data entry cancelled')
  }

  // Check if this is an AMRAP day
  if (isAmrapDay(currentDay)) {
    // For AMRAP days, we need to collect all exercises in the day
    const exercisesWithConfigs =
      currentDay.exercises
        ?.map((dayExercise) => {
          // Extract the exercise data
          const exerciseData =
            typeof dayExercise.exercise === 'string'
              ? null // We'd need to fetch this from the server
              : dayExercise.exercise

          // Ensure we have a complete exercise object
          const completeExercise = exerciseData || exercise

          return {
            exercise: completeExercise,
            config: dayExercise,
          }
        })
        .filter((item) => item.exercise) || []

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Your AMRAP Progress</h2>
        <AmrapDataEntry
          exercises={exercisesWithConfigs}
          amrapDuration={currentDay.amrapDuration || 0}
          onSave={handleAmrapSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    )
  }

  // Regular workout data entry
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Your Exercise Data</h2>
      <WorkoutDataEntry
        exercise={exercise}
        exerciseConfig={exerciseConfig}
        onSave={handleRegularWorkoutSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  )
}
