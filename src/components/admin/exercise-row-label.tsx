'use client'

import React, { useState, useEffect } from 'react'
import { useRowLabel } from '@payloadcms/ui'

export const ExerciseRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ exercise?: unknown }>()
  const [exerciseTitle, setExerciseTitle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fix: rowNumber is 0-based, so add 1 for display
  const exerciseNum = String((rowNumber ?? 0) + 1).padStart(2, '0')

  const exercise = data?.exercise

  useEffect(() => {
    const fetchExerciseTitle = async () => {
      // If exercise is just a string (ID), fetch the title
      if (typeof exercise === 'string') {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/exercises/${exercise}`)
          if (response.ok) {
            const exerciseData = await response.json()
            setExerciseTitle(exerciseData.title || 'Untitled Exercise')
          } else {
            setExerciseTitle('Unknown Exercise')
          }
        } catch (error) {
          console.error('Failed to fetch exercise:', error)
          setExerciseTitle(`ID: ${exercise.slice(0, 8)}...`)
        } finally {
          setIsLoading(false)
        }
      } else if (exercise && typeof exercise === 'object') {
        // Check various possible structures for the exercise data
        const exerciseObj = exercise as Record<string, unknown>
        if (typeof exerciseObj.title === 'string') {
          setExerciseTitle(exerciseObj.title)
        } else if (
          exerciseObj.value &&
          typeof exerciseObj.value === 'object' &&
          exerciseObj.value !== null &&
          'title' in exerciseObj.value &&
          typeof (exerciseObj.value as Record<string, unknown>).title === 'string'
        ) {
          setExerciseTitle((exerciseObj.value as Record<string, unknown>).title as string)
        } else {
          setExerciseTitle('Unknown Exercise')
        }
        setIsLoading(false)
      } else {
        // No exercise selected - don't show any suffix
        setExerciseTitle(null)
        setIsLoading(false)
      }
    }

    fetchExerciseTitle()
  }, [exercise])

  // Show different formats based on state
  if (!exercise) {
    return <span>Exercise {exerciseNum}</span>
  } else if (isLoading) {
    return <span>Exercise {exerciseNum} (Loading...)</span>
  } else if (exerciseTitle) {
    return (
      <span>
        Exercise {exerciseNum} ({exerciseTitle})
      </span>
    )
  } else {
    return <span>Exercise {exerciseNum}</span>
  }
}
