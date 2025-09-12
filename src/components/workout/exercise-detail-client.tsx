'use client'

import React, { useEffect, useState } from 'react'
import { useWorkoutStore } from '@/stores/workout-store'
import { ExerciseNavigation } from '@/components/workout/exercise-navigation'
import { ExerciseBreadcrumb } from '@/components/workout/exercise-breadcrumb'
import { ExerciseAmrapContext } from '@/components/workout/exercise-amrap-context'
import type { Exercise } from '@/types/workout'

interface ExerciseDetailClientProps {
  exercise: Exercise
  exerciseId: string
  children: React.ReactNode
}

export function ExerciseDetailClient({
  exercise,
  exerciseId,
  children,
}: ExerciseDetailClientProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const { getCurrentDay, currentExerciseIndex, setCurrentExercise } = useWorkoutStore()

  // Prevent hydration mismatch by only accessing store after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const currentDay = isHydrated ? getCurrentDay() : null

  // Sync current exercise index based on the exercise ID
  useEffect(() => {
    if (isHydrated && currentDay?.exercises) {
      const exerciseIndex = currentDay.exercises.findIndex((dayExercise) => {
        const currentExerciseId =
          typeof dayExercise.exercise === 'string' ? dayExercise.exercise : dayExercise.exercise.id
        return currentExerciseId === exerciseId
      })

      if (exerciseIndex !== -1 && exerciseIndex !== currentExerciseIndex) {
        setCurrentExercise(exerciseIndex)
      }
    }
  }, [isHydrated, exerciseId, currentDay, currentExerciseIndex, setCurrentExercise])

  return (
    <>
      {/* Breadcrumb Navigation */}
      <ExerciseBreadcrumb currentExerciseTitle={exercise.title} className="mb-4" />

      {/* AMRAP Context Display */}
      {currentDay && <ExerciseAmrapContext day={currentDay} className="mb-6" />}

      {/* Main Content */}
      {children}

      {/* Exercise Navigation */}
      <ExerciseNavigation
        currentExerciseId={exerciseId}
        className="pt-6 border-t border-gray-200"
      />
    </>
  )
}
