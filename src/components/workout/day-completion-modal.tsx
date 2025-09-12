'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Calendar,
  Trophy,
  Clock,
  Target,
  ArrowRight,
  Zap,
  Activity,
  Repeat,
} from 'lucide-react'
import { formatDuration } from '@/utils/formatters'
import type { MilestoneDay, ProgramMilestone } from '@/types/program'

export interface DayCompletionModalProps {
  completedMilestone: ProgramMilestone
  nextDay?: {
    day: MilestoneDay
    milestone: ProgramMilestone
    milestoneIndex: number
    dayIndex: number
  } | null
  sessionDuration: number // in milliseconds
  isAmrapDay: boolean
  completionStats: {
    totalExercises: number
    completedExercises: number
    completionPercentage: number
    totalRounds?: number
    hasAnyProgress: boolean
  }
  onAdvanceToNextDay: () => void
  onStayOnCurrentDay: () => void
  onFinishWorkout: () => void
  isLoading?: boolean
}

export function DayCompletionModal({
  completedMilestone,
  nextDay,
  sessionDuration,
  isAmrapDay,
  completionStats,
  onAdvanceToNextDay,
  onStayOnCurrentDay,
  onFinishWorkout,
  isLoading = false,
}: DayCompletionModalProps) {
  const [showNextDayPreview, setShowNextDayPreview] = useState(false)

  const formatSessionTime = (duration: number) => {
    const seconds = Math.floor(duration / 1000)
    return formatDuration(seconds, 'seconds')
  }

  const getCompletionMessage = () => {
    if (isAmrapDay) {
      if (completionStats.totalRounds && completionStats.totalRounds > 1) {
        return `Amazing work! You completed ${completionStats.totalRounds} rounds in your AMRAP workout!`
      }
      return 'Great effort on your AMRAP workout!'
    }

    if (completionStats.completionPercentage === 100) {
      return 'Excellent! You&apos;ve completed all exercises for today!'
    }

    return `Good work! You&apos;ve made progress on ${completionStats.completedExercises} out of ${completionStats.totalExercises} exercises.`
  }

  const getNextDayType = () => {
    if (!nextDay) return null

    if (nextDay.day.dayType === 'rest') {
      return {
        icon: <Calendar className="w-4 h-4" />,
        label: 'Rest Day',
        description: 'Time to recover and recharge',
        color: 'bg-blue-100 text-blue-700',
      }
    }

    if (nextDay.day.isAmrap) {
      return {
        icon: <Zap className="w-4 h-4" />,
        label: 'AMRAP Workout',
        description: `${nextDay.day.amrapDuration} min time challenge`,
        color: 'bg-orange-100 text-orange-700',
      }
    }

    return {
      icon: <Activity className="w-4 h-4" />,
      label: 'Workout Day',
      description: `${nextDay.day.exercises?.length || 0} exercises planned`,
      color: 'bg-green-100 text-green-700',
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Day Complete! 🎉</CardTitle>
          <p className="text-muted-foreground mt-2">{getCompletionMessage()}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Workout Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Today&apos;s Summary</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {completedMilestone.name}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Time: {formatSessionTime(sessionDuration)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span>
                  Exercises: {completionStats.completedExercises}/{completionStats.totalExercises}
                </span>
              </div>

              {isAmrapDay && completionStats.totalRounds && (
                <div className="flex items-center gap-2 col-span-2">
                  <Repeat className="w-4 h-4 text-gray-500" />
                  <span>Total Rounds: {completionStats.totalRounds}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(completionStats.completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStats.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Next Day Preview */}
          {nextDay && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowNextDayPreview(!showNextDayPreview)}
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Next Up</span>
                </div>
                {(() => {
                  const nextType = getNextDayType()
                  return nextType ? (
                    <Badge className={nextType.color}>
                      {nextType.icon}
                      <span className="ml-1">{nextType.label}</span>
                    </Badge>
                  ) : null
                })()}
              </div>

              {showNextDayPreview && nextDay && (
                <div className="mt-3 pl-6 text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p>
                      <strong>Milestone:</strong> {nextDay.milestone.name}
                    </p>
                    {(() => {
                      const nextType = getNextDayType()
                      return nextType ? <p>{nextType.description}</p> : null
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {nextDay ? (
              <>
                <Button
                  onClick={onAdvanceToNextDay}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Advancing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Continue to Next Day</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                <Button
                  onClick={onStayOnCurrentDay}
                  variant="outline"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  Stay Here
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 text-center">
                    🎉 Congratulations! You&apos;ve completed this program!
                  </p>
                </div>
                <Button
                  onClick={onFinishWorkout}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? 'Finishing...' : 'Finish Program'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
