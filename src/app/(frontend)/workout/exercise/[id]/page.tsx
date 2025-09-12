import React from 'react'
import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { getCurrentProductUser } from '@/lib/auth-server'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { Clock, Dumbbell, Route, Timer } from 'lucide-react'
import type { Exercise } from '@/types/workout'

interface ExerciseDetailPageProps {
  params: {
    id: string
  }
  searchParams: {
    sets?: string
    reps?: string
    weight?: string
    durationValue?: string
    durationUnit?: string
    distanceValue?: string
    distanceUnit?: string
    restPeriod?: string
    notes?: string
  }
}

export default async function ExerciseDetailPage({ params, searchParams }: ExerciseDetailPageProps) {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  // Fetch exercise data using PayloadCMS Local API
  let exercise: Exercise | null = null
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.findByID({
      collection: 'exercises',
      id: params.id,
    })
    exercise = result as Exercise
  } catch (error) {
    console.error('Error fetching exercise:', error)
    notFound()
  }

  if (!exercise) {
    notFound()
  }

  // Parse exercise configuration from search params
  const exerciseConfig = {
    sets: searchParams.sets ? parseInt(searchParams.sets, 10) : 0,
    reps: searchParams.reps ? parseInt(searchParams.reps, 10) : 0,
    weight: searchParams.weight ? parseInt(searchParams.weight, 10) : undefined,
    durationValue: searchParams.durationValue ? parseInt(searchParams.durationValue, 10) : undefined,
    durationUnit: searchParams.durationUnit as 'seconds' | 'minutes' | 'hours' | undefined,
    distanceValue: searchParams.distanceValue ? parseInt(searchParams.distanceValue, 10) : undefined,
    distanceUnit: searchParams.distanceUnit as 'meters' | 'miles' | undefined,
    restPeriod: searchParams.restPeriod ? parseInt(searchParams.restPeriod, 10) : undefined,
    notes: searchParams.notes || undefined,
  }

  // Type guard helpers for exercise config
  const hasConfigDistance = exerciseConfig.distanceValue && exerciseConfig.distanceValue > 0 && exerciseConfig.distanceUnit
  const hasConfigDuration = exerciseConfig.durationValue && exerciseConfig.durationValue > 0 && exerciseConfig.durationUnit

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {exercise.title}
          </h1>
        </div>

        {/* Exercise Specifications */}
        {(exerciseConfig.sets > 0 || exerciseConfig.reps > 0 || exerciseConfig.weight || hasConfigDuration || hasConfigDistance) && (
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Exercise Specifications
            </h2>
            <div className="flex flex-wrap gap-3 text-sm sm:text-base">
              {exerciseConfig.sets > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Dumbbell className="w-4 h-4" />
                  <span className="font-medium">{exerciseConfig.sets} sets</span>
                </div>
              )}

              {exerciseConfig.reps > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <span className="font-bold">×</span>
                  <span className="font-medium">{exerciseConfig.reps} reps</span>
                </div>
              )}

              {exerciseConfig.weight && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <span className="font-bold">@</span>
                  <span className="font-medium">{exerciseConfig.weight} lbs</span>
                </div>
              )}

              {hasConfigDuration && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Timer className="w-4 h-4" />
                  <span className="font-medium">
                    {formatDuration(exerciseConfig.durationValue!, exerciseConfig.durationUnit!)}
                  </span>
                </div>
              )}

              {hasConfigDistance && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Route className="w-4 h-4" />
                  <span className="font-medium">
                    {formatDistance(exerciseConfig.distanceValue!, exerciseConfig.distanceUnit!)}
                  </span>
                </div>
              )}
            </div>

            {/* Rest period */}
            {exerciseConfig.restPeriod && exerciseConfig.restPeriod > 0 && (
              <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Rest: {exerciseConfig.restPeriod}s between sets</span>
              </div>
            )}

            {/* Exercise notes */}
            {exerciseConfig.notes && (
              <div className="text-sm sm:text-base text-gray-700 mt-4 border-l-4 border-orange-300 pl-4 py-2 bg-orange-50 rounded-r-lg">
                <span className="font-medium">Note:</span> {exerciseConfig.notes}
              </div>
            )}
          </div>
        )}

        {/* Exercise Description */}
        {exercise.description && (
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Description & Instructions
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              {exercise.description}
            </p>
          </div>
        )}

        {/* Video Section - Placeholder for now */}
        {exercise.videoUrl && (
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Exercise Demonstration
            </h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <div className="text-lg font-medium mb-2">Video Coming Soon</div>
                <div className="text-sm">
                  Video URL: {exercise.videoUrl}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Placeholder for now */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            ← Back to Workout
          </button>
          <div className="text-sm text-gray-500">
            Exercise Details
          </div>
        </div>
      </div>
    </div>
  )
}

// Static metadata for the page
export const metadata = {
  title: 'Exercise Details - Workout App',
  description: 'View exercise instructions and demonstration videos',
}