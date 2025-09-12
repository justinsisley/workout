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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Day {dayNumber}</CardTitle>
            <CardDescription className="mt-1">{milestoneName}</CardDescription>
          </div>
          <div className="flex gap-2">
            {isAmrap && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                AMRAP
              </Badge>
            )}
            {day.dayType === 'rest' && <Badge variant="outline">Rest Day</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {day.dayType === 'rest' ? (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground mb-2">Rest and Recovery</p>
            {day.restNotes && <p className="text-sm text-muted-foreground">{day.restNotes}</p>}
          </div>
        ) : (
          <>
            {isAmrap && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">AMRAP Duration</span>
                  </div>
                  <span className="font-bold text-lg">{day.amrapDuration} minutes</span>
                </div>

                {isTimerActive && timeRemaining !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time Remaining</span>
                      <span className="font-mono text-xl font-bold text-primary">
                        {formatRemainingTime(timeRemaining)}
                      </span>
                    </div>
                    <Progress value={(1 - timeRemaining / (day.amrapDuration! * 60)) * 100} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Current Round</span>
                  <Badge variant="default">Round {currentRound}</Badge>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  Complete all exercises then repeat for as many rounds as possible
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Exercises ({completedCount}/{totalExercises})
                </h3>
                <span className="text-sm text-muted-foreground">
                  Est. {estimateTotalDuration()}
                </span>
              </div>

              {totalExercises > 0 && <Progress value={progressPercentage} className="h-2" />}

              <div className="space-y-2">
                {exercises.map((exercise, index) => {
                  const isCompleted = completedExercises.includes(exercise.id)
                  const exerciseData =
                    typeof exercise.exercise === 'object' ? (exercise.exercise as Exercise) : null

                  return (
                    <div
                      key={exercise.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isCompleted ? 'bg-primary/5 border-primary/20' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {exerciseData?.title || `Exercise ${index + 1}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight && ` @ ${exercise.weight} lbs`}
                          </p>
                        </div>
                      </div>
                      {isCompleted && (
                        <Badge variant="outline" className="text-xs">
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
              className="w-full"
              size="lg"
              disabled={isTimerActive && !isAmrap}
            >
              <Play className="mr-2 h-4 w-4" />
              {isTimerActive ? 'Workout in Progress' : 'Start Workout'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
