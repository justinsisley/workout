import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentProductUser } from '@/lib/auth-server'
import { DayOverview } from '@/components/workout/day-overview'
import { ExerciseList } from '@/components/workout/exercise-list'
import { ProgressIndicators } from '@/components/workout/progress-indicators'
import { DayNavigation } from '@/components/workout/day-navigation'
import { TimeEstimates } from '@/components/workout/time-estimates'

// TODO: This is a placeholder - will be replaced with actual data fetching
const mockDay = {
  id: '1',
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
}

export default async function WorkoutDashboardPage() {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  const handleStartWorkout = () => {
    console.log('Starting workout...')
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
                day={mockDay}
                dayNumber={1}
                milestoneName="Week 1"
                onStartWorkout={handleStartWorkout}
              />
            </div>
          </div>

          {/* Second row: Exercise list and Progress side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Exercise list - 2 columns on desktop */}
            <div className="lg:col-span-2">
              <ExerciseList exercises={mockDay.exercises} />
            </div>

            {/* Progress indicators - 1 column on desktop */}
            <div className="space-y-4 sm:space-y-6">
              <ProgressIndicators day={mockDay} />
              <TimeEstimates day={mockDay} />
            </div>
          </div>

          {/* Navigation - full width on all screen sizes */}
          <div className="w-full">
            <DayNavigation day={mockDay} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Static metadata for the page
export const metadata = {
  title: 'Workout Dashboard - Workout App',
  description: 'View your current workout day overview and track your progress',
}
