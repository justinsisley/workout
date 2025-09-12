'use client'

import React, { useEffect } from 'react'
import { useWorkoutStore } from '@/stores/workout-store'
import { DayOverview } from '@/components/workout/day-overview'
import { ExerciseList } from '@/components/workout/exercise-list'
import { ProgressIndicators } from '@/components/workout/progress-indicators'
import { DayNavigation } from '@/components/workout/day-navigation'
import { TimeEstimates } from '@/components/workout/time-estimates'

// TODO: This is a placeholder - will be replaced with actual data fetching from PayloadCMS
const mockProgram = {
  id: '1',
  name: 'Beginner Bodyweight Program',
  description: 'A comprehensive bodyweight training program for beginners',
  objective: 'Build foundational strength and endurance',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [
    {
      id: 'milestone1',
      name: 'Week 1',
      theme: 'Foundation Building',
      objective: 'Establish basic movement patterns',
      days: [
        {
          id: 'day1',
          dayType: 'workout' as const,
          isAmrap: false,
          exercises: [
            {
              id: 'ex1',
              exercise: {
                id: 'exercise1',
                title: 'Push-ups',
                description: 'Standard push-ups',
                category: 'Bodyweight',
              },
              sets: 3,
              reps: 15,
              restPeriod: 60,
            },
            {
              id: 'ex2',
              exercise: {
                id: 'exercise2',
                title: 'Squats',
                description: 'Bodyweight squats',
                category: 'Bodyweight',
              },
              sets: 3,
              reps: 20,
              restPeriod: 90,
            },
          ],
        },
        {
          id: 'day2',
          dayType: 'rest' as const,
          restNotes: 'Active recovery - light walking or stretching',
        },
        {
          id: 'day3',
          dayType: 'workout' as const,
          isAmrap: true,
          amrapDuration: 12,
          exercises: [
            {
              id: 'ex3',
              exercise: {
                id: 'exercise3',
                title: 'Burpees',
                description: 'Full body burpees',
                category: 'Cardio',
              },
              sets: 1,
              reps: 5,
              restPeriod: 0,
            },
            {
              id: 'ex4',
              exercise: {
                id: 'exercise4',
                title: 'Mountain Climbers',
                description: 'Alternate leg mountain climbers',
                category: 'Cardio',
              },
              sets: 1,
              reps: 10,
              restPeriod: 0,
            },
          ],
        },
      ],
    },
  ],
}

export function WorkoutDashboardClient() {
  const { currentProgram, currentDayIndex, getCurrentMilestone, getCurrentDay, setCurrentProgram } =
    useWorkoutStore()

  // Initialize with mock program if no current program
  useEffect(() => {
    if (!currentProgram) {
      setCurrentProgram(mockProgram, 0, 0)
    }
  }, [currentProgram, setCurrentProgram])

  const currentMilestone = getCurrentMilestone()
  const currentDay = getCurrentDay()

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
            <p className="text-muted-foreground">Loading workout data...</p>
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
                onStartWorkout={() => {
                  // Start workout functionality is handled by DayNavigation component
                  console.log('Starting workout...')
                }}
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
