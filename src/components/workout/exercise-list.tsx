'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Dumbbell, Route, Timer } from 'lucide-react'
import type { DayExercise, Exercise } from '@/types/program'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { hasDistance, hasDuration } from '@/utils/type-guards'

interface ExerciseListProps {
  exercises: DayExercise[]
  completedExercises?: string[]
  onExerciseSelect?: (exerciseId: string) => void
}

export function ExerciseList({
  exercises,
  completedExercises = [],
  onExerciseSelect,
}: ExerciseListProps) {
  if (!exercises?.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No exercises found for this day</p>
        </CardContent>
      </Card>
    )
  }

  const handleExerciseClick = (exerciseId: string) => {
    onExerciseSelect?.(exerciseId)
  }

  return (
    <div className="space-y-3">
      {exercises.map((exercise, index) => {
        const exerciseData = exercise.exercise as Exercise
        const isCompleted = completedExercises.includes(exercise.id)

        return (
          <Card
            key={exercise.id}
            className={`w-full transition-all duration-200 ${
              onExerciseSelect ? 'hover:shadow-md cursor-pointer active:scale-[0.98]' : ''
            } ${
              isCompleted
                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                : ''
            }`}
            onClick={() => handleExerciseClick(exercise.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  {exerciseData?.title || 'Unknown Exercise'}
                </CardTitle>
                {isCompleted && (
                  <Badge
                    variant="secondary"
                    className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30"
                  >
                    Completed
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Exercise specifications */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {exercise.sets > 0 && (
                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      <span>{exercise.sets} sets</span>
                    </div>
                  )}

                  {exercise.reps > 0 && (
                    <div className="flex items-center gap-1">
                      <span>×</span>
                      <span>{exercise.reps} reps</span>
                    </div>
                  )}

                  {exercise.weight && (
                    <div className="flex items-center gap-1">
                      <span>@</span>
                      <span>{exercise.weight} lbs</span>
                    </div>
                  )}

                  {hasDuration(exercise) && (
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>{formatDuration(exercise.durationValue!, exercise.durationUnit!)}</span>
                    </div>
                  )}

                  {hasDistance(exercise) && (
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      <span>{formatDistance(exercise.distanceValue!, exercise.distanceUnit!)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rest period */}
              {exercise.restPeriod && exercise.restPeriod > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Rest: {exercise.restPeriod}s</span>
                </div>
              )}

              {/* Exercise notes */}
              {exercise.notes && (
                <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                  {exercise.notes}
                </div>
              )}

              {/* Exercise description */}
              {exerciseData?.description && (
                <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {exerciseData.description}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
