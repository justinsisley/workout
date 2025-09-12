'use client'

import { useEffect, useState } from 'react'
import { Clock, Dumbbell, RotateCw, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { MilestoneDay, Exercise } from '@/types/program'
import { isAmrapDay } from '@/utils/type-guards'
import { formatDuration } from '@/utils/formatters'

interface DayOverviewProps {
  day: MilestoneDay
  dayNumber: number
  milestoneName: string
  onStartWorkout: () => void
  completedExercises?: string[]
  currentRound?: number
}

export function DayOverview({
  day,
  dayNumber,
  milestoneName,
  onStartWorkout,
  completedExercises = [],
  currentRound = 1,
}: DayOverviewProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isTimerActive, setIsTimerActive] = useState(false)

  const isAmrap = isAmrapDay(day)
  const exercises = day.exercises || []
  const totalExercises = exercises.length
  const completedCount = completedExercises.length
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

  useEffect(() => {
    if (isAmrap && day.amrapDuration && isTimerActive) {
      const duration = day.amrapDuration * 60
      let currentTime = duration

      setTimeRemaining(currentTime)

      const interval = setInterval(() => {
        currentTime -= 1
        setTimeRemaining(Math.max(0, currentTime))

        if (currentTime <= 0) {
          setIsTimerActive(false)
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
    return undefined
  }, [isAmrap, day.amrapDuration, isTimerActive])

  const formatRemainingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const estimateTotalDuration = (): string => {
    if (isAmrap && day.amrapDuration) {
      return formatDuration(day.amrapDuration, 'minutes')
    }

    let totalSeconds = 0
    exercises.forEach((exercise) => {
      const sets = exercise.sets || 1
      const restPeriod = exercise.restPeriod || 60

      if (exercise.durationValue && exercise.durationUnit) {
        let exerciseSeconds = exercise.durationValue
        if (exercise.durationUnit === 'minutes') exerciseSeconds *= 60
        if (exercise.durationUnit === 'hours') exerciseSeconds *= 3600
        totalSeconds += exerciseSeconds * sets
      } else {
        const timePerRep = 3
        const reps = exercise.reps || 10
        totalSeconds += reps * timePerRep * sets
      }

      totalSeconds += restPeriod * (sets - 1)
    })

    const minutes = Math.ceil(totalSeconds / 60)
    return formatDuration(minutes, 'minutes')
  }

  const handleStartWorkout = () => {
    if (isAmrap) {
      setIsTimerActive(true)
    }
    onStartWorkout()
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Day {dayNumber}
            </CardTitle>
            <CardDescription className="mt-1 sm:mt-2 text-base sm:text-lg">
              {milestoneName}
            </CardDescription>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {isAmrap && (
              <Badge
                variant="secondary"
                className="flex items-center gap-2 px-3 py-2 text-sm sm:text-base font-semibold"
              >
                <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                AMRAP
              </Badge>
            )}
            {day.dayType === 'rest' && (
              <Badge variant="outline" className="px-3 py-2 text-sm sm:text-base font-semibold">
                Rest Day
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 sm:space-y-8">
        {day.dayType === 'rest' ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-lg sm:text-xl text-muted-foreground mb-2 sm:mb-4 font-medium">
              Rest and Recovery
            </p>
            {day.restNotes && (
              <p className="text-sm sm:text-base text-muted-foreground bg-secondary/50 p-4 rounded-lg max-w-md mx-auto">
                {day.restNotes}
              </p>
            )}
          </div>
        ) : (
          <>
            {isAmrap && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <span className="text-base sm:text-lg font-semibold">AMRAP Duration</span>
                  </div>
                  <span className="font-bold text-xl sm:text-2xl text-primary">
                    {day.amrapDuration} minutes
                  </span>
                </div>

                {isTimerActive && timeRemaining !== null && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-lg text-muted-foreground font-medium">
                        Time Remaining
                      </span>
                      <span className="font-mono text-2xl sm:text-3xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                        {formatRemainingTime(timeRemaining)}
                      </span>
                    </div>
                    <Progress
                      value={(1 - timeRemaining / (day.amrapDuration! * 60)) * 100}
                      className="h-4 sm:h-6"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                  <span className="text-base sm:text-lg text-muted-foreground font-medium">
                    Current Round
                  </span>
                  <Badge variant="default" className="px-4 py-2 text-base sm:text-lg font-bold">
                    Round {currentRound}
                  </Badge>
                </div>

                <p className="text-sm sm:text-base text-muted-foreground bg-secondary/30 p-3 rounded-md font-medium">
                  Complete all exercises then repeat for as many rounds as possible
                </p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
                  <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
                  Exercises ({completedCount}/{totalExercises})
                </h3>
                <span className="text-sm sm:text-base text-muted-foreground font-semibold bg-secondary/50 px-3 py-1 rounded-md">
                  Est. {estimateTotalDuration()}
                </span>
              </div>

              {totalExercises > 0 && <Progress value={progressPercentage} className="h-3 sm:h-4" />}

              <div className="space-y-3 sm:space-y-4">
                {exercises.map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id)
                  const exerciseData =
                    typeof exercise.exercise === 'object' ? (exercise.exercise as Exercise) : null

                  return (
                    <div
                      key={exercise.id}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-lg border-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : 'hover:bg-secondary/50 border-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 flex items-center justify-center text-base sm:text-lg font-bold ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-muted-foreground text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base sm:text-lg">
                            {exerciseData?.title || `Exercise ${index + 1}`}
                          </p>
                          <p className="text-sm sm:text-base text-muted-foreground font-medium">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight && ` @ ${exercise.weight} lbs`}
                          </p>
                        </div>
                      </div>
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="text-sm sm:text-base px-3 py-1 bg-green-100 text-green-800 border-green-300 font-semibold"
                        >
                          Complete
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              onClick={handleStartWorkout}
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold touch-manipulation"
              size="lg"
              disabled={isTimerActive && !isAmrap}
            >
              <Play className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              {isTimerActive ? 'Workout in Progress' : 'Start Workout'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
