'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Dumbbell, Route, Timer } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workout-store'
import type { DayExercise, Exercise } from '@/types/program'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { hasDistance, hasDuration } from '@/utils/type-guards'

interface ExerciseListProps {
  exercises: DayExercise[]
}

export function ExerciseList({ exercises }: ExerciseListProps) {
  const { completedExercises } = useWorkoutStore()
  if (!exercises?.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12 sm:py-16">
          <p className="text-muted-foreground text-base sm:text-lg text-center">
            No exercises found for this day
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleExerciseClick = (exerciseId: string) => {
    console.log('Exercise clicked:', exerciseId)
    // TODO: Navigate to exercise detail page when implemented
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {exercises.map((exercise, index) => {
        const exerciseData = exercise.exercise as Exercise
        const isCompleted = completedExercises.includes(exercise.id)

        return (
          <Card
            key={exercise.id}
            className={`w-full transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.98] touch-manipulation ${
              isCompleted
                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                : ''
            }`}
            onClick={() => handleExerciseClick(exercise.id)}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary text-sm sm:text-base font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="truncate">{exerciseData?.title || 'Unknown Exercise'}</span>
                </CardTitle>
                {isCompleted && (
                  <Badge
                    variant="secondary"
                    className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-3 py-1 text-xs sm:text-sm"
                  >
                    Completed
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Exercise specifications */}
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                  {exercise.sets > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-secondary/50 rounded-md">
                      <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{exercise.sets} sets</span>
                    </div>
                  )}

                  {exercise.reps > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-secondary/50 rounded-md">
                      <span className="font-bold">×</span>
                      <span className="font-medium">{exercise.reps} reps</span>
                    </div>
                  )}

                  {exercise.weight && (
                    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-secondary/50 rounded-md">
                      <span className="font-bold">@</span>
                      <span className="font-medium">{exercise.weight} lbs</span>
                    </div>
                  )}

                  {hasDuration(exercise) && (
                    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-secondary/50 rounded-md">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {formatDuration(exercise.durationValue!, exercise.durationUnit!)}
                      </span>
                    </div>
                  )}

                  {hasDistance(exercise) && (
                    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-secondary/50 rounded-md">
                      <Route className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {formatDistance(exercise.distanceValue!, exercise.distanceUnit!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rest period */}
              {exercise.restPeriod && exercise.restPeriod > 0 && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Rest: {exercise.restPeriod}s between sets</span>
                </div>
              )}

              {/* Exercise notes */}
              {exercise.notes && (
                <div className="text-sm sm:text-base text-muted-foreground border-l-4 border-orange-300 dark:border-orange-600 pl-3 sm:pl-4 py-2 bg-orange-50/50 dark:bg-orange-950/20 rounded-r-md">
                  <span className="font-medium">Note:</span> {exercise.notes}
                </div>
              )}

              {/* Exercise description */}
              {exerciseData?.description && (
                <div className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 p-2 bg-secondary/30 rounded-md">
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
