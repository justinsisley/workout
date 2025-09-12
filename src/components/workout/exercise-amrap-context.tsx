'use client'

import { useState, useEffect } from 'react'
import { Clock, RotateCw, Target, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useWorkoutStore } from '@/stores/workout-store'
import { isAmrapDay } from '@/utils/type-guards'
import type { MilestoneDay } from '@/types/program'
import { cn } from '@/lib/utils'

interface ExerciseAmrapContextProps {
  day: MilestoneDay
  className?: string
}

export function ExerciseAmrapContext({ day, className = '' }: ExerciseAmrapContextProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const { currentRound, totalExercisesCompleted, sessionStartTime } = useWorkoutStore()

  // Prevent hydration mismatch by only accessing store after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Check if this is an AMRAP day
  if (!isAmrapDay(day)) {
    return null
  }

  // Don't render anything until hydrated to prevent mismatch with store state
  if (!isHydrated) {
    return (
      <Card className={cn('border-orange-200 bg-orange-50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-2" />
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const exercises = day.exercises || []
  const totalExercises = exercises.length
  const amrapDuration = day.amrapDuration || 0

  // Calculate AMRAP-specific metrics
  const totalRoundsCompleted =
    totalExercises > 0 ? Math.floor(totalExercisesCompleted / totalExercises) : 0
  const currentRoundExercisesCompleted =
    totalExercises > 0 ? totalExercisesCompleted % totalExercises : 0
  const currentRoundProgress =
    totalExercises > 0 ? Math.round((currentRoundExercisesCompleted / totalExercises) * 100) : 0

  // Calculate session time remaining
  const sessionDurationMinutes = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime) / (1000 * 60))
    : 0
  const timeRemainingMinutes = Math.max(0, amrapDuration - sessionDurationMinutes)

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
    return `${minutes}m`
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RotateCw className="h-5 w-5 text-orange-600" />
            AMRAP Workout
            <Badge variant="outline" className="ml-auto border-orange-300 text-orange-700">
              {formatTime(amrapDuration)} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Round Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Round {currentRound}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentRoundExercisesCompleted} of {totalExercises} exercises
            </div>
          </div>

          {/* Current Round Progress */}
          <div className="space-y-2">
            <Progress value={currentRoundProgress} className="h-2 bg-orange-100" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Round Progress</span>
              <span>{currentRoundProgress}%</span>
            </div>
          </div>

          {/* Rounds Completed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Completed Rounds</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {totalRoundsCompleted}
            </Badge>
          </div>

          {/* Time Information */}
          <div className="flex items-center justify-between pt-2 border-t border-orange-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Time Remaining</span>
            </div>
            <Badge
              variant={timeRemainingMinutes <= 5 ? 'destructive' : 'outline'}
              className={timeRemainingMinutes <= 5 ? '' : 'border-orange-300 text-orange-700'}
            >
              {formatTime(timeRemainingMinutes)}
            </Badge>
          </div>

          {/* AMRAP Instructions */}
          <div className="pt-2 text-xs text-muted-foreground border-t border-orange-200">
            Complete as many rounds as possible in {formatTime(amrapDuration)}. Focus on form over
            speed.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
