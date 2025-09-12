'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workout-store'

interface ExerciseBreadcrumbProps {
  currentExerciseTitle?: string | null | undefined
  className?: string
}

export function ExerciseBreadcrumb({
  currentExerciseTitle,
  className = '',
}: ExerciseBreadcrumbProps) {
  const { currentProgram, getCurrentMilestone, getCurrentDay, currentExerciseIndex } =
    useWorkoutStore()

  const currentMilestone = getCurrentMilestone()
  const currentDay = getCurrentDay()

  if (!currentProgram || !currentMilestone || !currentDay) {
    return null
  }

  return (
    <nav
      className={`flex items-center text-sm text-gray-500 mb-4 ${className}`}
      aria-label="Breadcrumb"
    >
      <div className="flex items-center space-x-1 overflow-hidden">
        {/* Program Name */}
        <Link
          href="/workout/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-[120px] sm:max-w-none"
          title={currentProgram.name}
        >
          {currentProgram.name}
        </Link>

        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* Milestone Name */}
        <Link
          href="/workout/dashboard"
          className="text-blue-600 hover:text-blue-800 truncate max-w-[100px] sm:max-w-none"
          title={currentMilestone.name}
        >
          {currentMilestone.name}
        </Link>

        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* Day Type */}
        <Link
          href="/workout/dashboard"
          className="text-blue-600 hover:text-blue-800 truncate max-w-[80px] sm:max-w-none"
          title={`${currentDay.dayType === 'workout' ? 'Workout' : 'Rest'} Day`}
        >
          {currentDay.dayType === 'workout' ? 'Workout' : 'Rest'} Day
        </Link>

        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* Current Exercise */}
        <span
          className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none"
          title={currentExerciseTitle || `Exercise ${currentExerciseIndex + 1}`}
        >
          {currentExerciseTitle || `Exercise ${currentExerciseIndex + 1}`}
        </span>
      </div>
    </nav>
  )
}
