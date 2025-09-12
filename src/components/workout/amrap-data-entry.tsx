'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RotateCw, CheckCircle2, Plus, Minus } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workout-store'
import {
  validateAmrapField,
  validateAmrapDataEntry,
  validateWorkoutField,
  sanitizeWorkoutInput,
  type AmrapDataEntryData as ValidationAmrapData,
} from '@/utils/validation'
import type { DayExercise, Exercise } from '@/types/program'

export interface AmrapDataEntryData {
  totalRounds: number
  partialRoundExercisesCompleted: number
  notes: string
  // Individual exercise data for partial rounds
  exerciseData: Array<{
    exerciseId: string
    reps: number
    weight?: number | undefined
    time?: number | undefined
    distance?: number | undefined
    distanceUnit?: 'meters' | 'miles' | undefined
    timeUnit?: 'seconds' | 'minutes' | 'hours' | undefined
  }>
}

export interface AmrapDataEntryProps {
  exercises: Array<{ exercise: Exercise; config: DayExercise }>
  amrapDuration: number
  previousData?: AmrapDataEntryData
  onSave: (data: AmrapDataEntryData) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function AmrapDataEntry({
  exercises,
  amrapDuration,
  previousData,
  onSave,
  onCancel,
  isLoading = false,
}: AmrapDataEntryProps) {
  const { 
    currentRound, 
    totalExercisesCompleted, 
    sessionStartTime,
    updateAmrapProgress
  } = useWorkoutStore()

  const [data, setData] = useState<AmrapDataEntryData>(() => {
    // Calculate initial values from store or previous data
    const totalRounds = previousData?.totalRounds ?? Math.max(0, currentRound - 1)
    const partialRoundExercisesCompleted =
      previousData?.partialRoundExercisesCompleted ??
      (exercises.length > 0 ? totalExercisesCompleted % exercises.length : 0)

    return {
      totalRounds,
      partialRoundExercisesCompleted,
      notes: previousData?.notes ?? '',
      exerciseData:
        previousData?.exerciseData ??
        exercises.map(({ exercise, config }) => ({
          exerciseId: exercise.id,
          reps: config.reps,
          weight: config.weight,
          time: config.durationValue,
          distance: config.distanceValue,
          distanceUnit: config.distanceUnit as 'meters' | 'miles' | undefined,
          timeUnit: config.durationUnit as 'seconds' | 'minutes' | 'hours' | undefined,
        })),
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update AMRAP progress in real-time for each exercise
  useEffect(() => {
    exercises.forEach(({ exercise }) => {
      const amrapData = {
        totalRoundsCompleted: data.totalRounds,
        currentRoundProgress: data.partialRoundExercisesCompleted,
        totalExercisesInRound: exercises.length,
      }
      
      updateAmrapProgress(exercise.id, amrapData)
    })
  }, [data.totalRounds, data.partialRoundExercisesCompleted, exercises, updateAmrapProgress])

  // Calculate session time elapsed
  const sessionDurationMinutes = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime) / (1000 * 60))
    : 0

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
    return `${minutes}m`
  }

  // Real-time field validation using Zod schemas
  const validateField = (field: keyof ValidationAmrapData, value: unknown) => {
    const newErrors = { ...errors }

    // For special AMRAP validation - handle the custom field that doesn't match ValidationAmrapData
    if ((field as any) === 'partialRoundExercisesCompleted') {
      const numValue = typeof value === 'number' ? value : parseInt(value as string) || 0
      if (numValue < 0 || numValue >= exercises.length) {
        newErrors.partialRoundExercisesCompleted = `Partial round exercises must be between 0 and ${exercises.length - 1}`
      } else {
        delete newErrors.partialRoundExercisesCompleted
      }
    } else {
      // Use standard AMRAP validation for other fields
      const validationError = validateAmrapField(field, value)
      if (validationError) {
        newErrors[field] = validationError
      } else {
        delete newErrors[field]
      }
    }

    setErrors(newErrors)
    return typeof value === 'number' ? value : parseInt(value as string) || 0
  }

  // Validate individual exercise data fields
  const validateExerciseField = (field: string, value: unknown) => {
    const sanitizedValue = sanitizeWorkoutInput(value as string | number)
    const validationError = validateWorkoutField(field as any, sanitizedValue)
    return { value: sanitizedValue, error: validationError }
  }

  const updateTotalRounds = (increment: boolean) => {
    const newValue = increment ? data.totalRounds + 1 : Math.max(0, data.totalRounds - 1)
    setData((prev) => ({ ...prev, totalRounds: newValue }))
    validateField('totalRounds', newValue)
  }

  const updatePartialRoundExercises = (increment: boolean) => {
    const maxValue = exercises.length - 1
    const newValue = increment
      ? Math.min(maxValue, data.partialRoundExercisesCompleted + 1)
      : Math.max(0, data.partialRoundExercisesCompleted - 1)

    setData((prev) => ({ ...prev, partialRoundExercisesCompleted: newValue }))
    validateField('partialRoundExercisesCompleted' as any, newValue)
  }

  const updateExerciseData = (exerciseId: string, field: string, value: number | undefined) => {
    // Validate the exercise data field
    const validation = validateExerciseField(field, value)

    setData((prev) => ({
      ...prev,
      exerciseData: prev.exerciseData.map((item) =>
        item.exerciseId === exerciseId ? { ...item, [field]: validation.value } : item,
      ),
    }))

    // Store exercise-specific validation errors if needed
    if (validation.error) {
      setErrors((prev) => ({ ...prev, [`${exerciseId}-${field}`]: validation.error! }))
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`${exerciseId}-${field}`]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prepare data for validation (convert to match validation schema)
    const validationData = {
      totalRounds: data.totalRounds,
      partialRoundExercises: data.exerciseData
        .slice(0, data.partialRoundExercisesCompleted)
        .map((exercise) => ({
          exerciseId: exercise.exerciseId,
          reps: exercise.reps,
        })),
      notes: data.notes,
    }

    // Comprehensive form validation using Zod schema
    const validationResult = validateAmrapDataEntry(validationData)

    if (!validationResult.isValid) {
      // Update errors with validation results
      setErrors((prev) => ({ ...prev, ...validationResult.errors }))
      return
    }

    // Clear any existing errors and submit
    setErrors({})
    onSave(data)
  }

  const isFormValid = Object.keys(errors).length === 0
  const totalExercisesInWorkout =
    data.totalRounds * exercises.length + data.partialRoundExercisesCompleted
  const workoutCompletionPercentage =
    exercises.length > 0
      ? Math.round(
          (totalExercisesInWorkout / (Math.max(1, data.totalRounds + 1) * exercises.length)) * 100,
        )
      : 0

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* AMRAP Overview Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RotateCw className="h-5 w-5 text-orange-600" />
            AMRAP Workout Progress
            <Badge variant="outline" className="ml-auto border-orange-300 text-orange-700">
              {formatTime(amrapDuration)} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">{data.totalRounds}</div>
              <div className="text-sm text-muted-foreground">Complete Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">
                {data.partialRoundExercisesCompleted}
              </div>
              <div className="text-sm text-muted-foreground">Partial Round Exercises</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Total Exercises Completed</span>
              <span>{totalExercisesInWorkout}</span>
            </div>
            <Progress value={workoutCompletionPercentage} className="h-2 bg-orange-100" />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-orange-200">
            <span className="text-sm font-medium">Session Time</span>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              {formatTime(sessionDurationMinutes)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Round Tracking Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Round Tracking</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your completed rounds and progress on the current round
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Total Rounds Completed */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Complete Rounds Finished</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateTotalRounds(false)}
                  className="h-12 w-12 touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  disabled={data.totalRounds <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data.totalRounds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setData((prev) => ({ ...prev, totalRounds: value }))
                    validateField('totalRounds', value)
                  }}
                  className="h-12 text-lg text-center font-semibold touch-manipulation flex-1"
                  style={{ fontSize: '18px', minHeight: '44px' }}
                  min="0"
                  max="999"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateTotalRounds(true)}
                  className="h-12 w-12 touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.totalRounds && (
                <p className="text-sm text-destructive">{errors.totalRounds}</p>
              )}
            </div>

            {/* Partial Round Progress */}
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Exercises Completed in Current Round
                {exercises.length > 0 && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (out of {exercises.length} total)
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updatePartialRoundExercises(false)}
                  className="h-12 w-12 touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  disabled={data.partialRoundExercisesCompleted <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data.partialRoundExercisesCompleted}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setData((prev) => ({ ...prev, partialRoundExercisesCompleted: value }))
                    validateField('partialRoundExercisesCompleted' as any, value)
                  }}
                  className="h-12 text-lg text-center font-semibold touch-manipulation flex-1"
                  style={{ fontSize: '18px', minHeight: '44px' }}
                  min="0"
                  max={exercises.length - 1}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updatePartialRoundExercises(true)}
                  className="h-12 w-12 touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  disabled={data.partialRoundExercisesCompleted >= exercises.length - 1}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.partialRoundExercisesCompleted && (
                <p className="text-sm text-destructive">{errors.partialRoundExercisesCompleted}</p>
              )}

              {/* Current Round Progress Visualization */}
              {exercises.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Current Round Progress</span>
                    <span>
                      {data.partialRoundExercisesCompleted} / {exercises.length} exercises
                    </span>
                  </div>
                  <Progress
                    value={(data.partialRoundExercisesCompleted / exercises.length) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </div>

            {/* Exercise Details for Partial Round (if needed) */}
            {data.partialRoundExercisesCompleted > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Partial Round Exercise Details</Label>
                <div className="space-y-3">
                  {exercises
                    .slice(0, data.partialRoundExercisesCompleted)
                    .map(({ exercise, config }) => {
                      const exerciseData = data.exerciseData.find(
                        (item) => item.exerciseId === exercise.id,
                      )

                      return (
                        <Card key={exercise.id} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">{exercise.title}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`reps-${exercise.id}`} className="text-sm">
                                Reps
                              </Label>
                              <Input
                                id={`reps-${exercise.id}`}
                                type="number"
                                inputMode="numeric"
                                value={exerciseData?.reps || config.reps}
                                onChange={(e) =>
                                  updateExerciseData(
                                    exercise.id,
                                    'reps',
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="h-10 text-center"
                                min="0"
                                max="999"
                              />
                            </div>

                            {(config.weight !== undefined ||
                              exerciseData?.weight !== undefined) && (
                              <div>
                                <Label htmlFor={`weight-${exercise.id}`} className="text-sm">
                                  Weight (lbs)
                                </Label>
                                <Input
                                  id={`weight-${exercise.id}`}
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  value={exerciseData?.weight || config.weight || ''}
                                  onChange={(e) =>
                                    updateExerciseData(
                                      exercise.id,
                                      'weight',
                                      parseFloat(e.target.value) || undefined,
                                    )
                                  }
                                  className="h-10 text-center"
                                  min="0"
                                  max="1000"
                                  placeholder="Optional"
                                />
                              </div>
                            )}

                            {(config.durationValue !== undefined ||
                              exerciseData?.time !== undefined) && (
                              <div>
                                <Label htmlFor={`time-${exercise.id}`} className="text-sm">
                                  Time {exerciseData?.timeUnit && `(${exerciseData.timeUnit})`}
                                </Label>
                                <Input
                                  id={`time-${exercise.id}`}
                                  type="number"
                                  inputMode="decimal"
                                  step="0.1"
                                  value={exerciseData?.time || config.durationValue || ''}
                                  onChange={(e) =>
                                    updateExerciseData(
                                      exercise.id,
                                      'time',
                                      parseFloat(e.target.value) || undefined,
                                    )
                                  }
                                  className="h-10 text-center"
                                  min="0"
                                  max="999"
                                  placeholder="Optional"
                                />
                              </div>
                            )}

                            {(config.distanceValue !== undefined ||
                              exerciseData?.distance !== undefined) && (
                              <div>
                                <Label htmlFor={`distance-${exercise.id}`} className="text-sm">
                                  Distance{' '}
                                  {exerciseData?.distanceUnit && `(${exerciseData.distanceUnit})`}
                                </Label>
                                <Input
                                  id={`distance-${exercise.id}`}
                                  type="number"
                                  inputMode="decimal"
                                  step="0.1"
                                  value={exerciseData?.distance || config.distanceValue || ''}
                                  onChange={(e) =>
                                    updateExerciseData(
                                      exercise.id,
                                      'distance',
                                      parseFloat(e.target.value) || undefined,
                                    )
                                  }
                                  className="h-10 text-center"
                                  min="0"
                                  max="999"
                                  placeholder="Optional"
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Notes Input */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Notes (Optional)
              </Label>
              <Input
                id="notes"
                type="text"
                value={data.notes || ''}
                onChange={(e) => {
                  validateField('notes', e.target.value)
                  setData((prev) => ({ ...prev, notes: e.target.value }))
                }}
                className="h-12 text-base touch-manipulation"
                style={{ minHeight: '44px' }}
                placeholder="Add any notes about this AMRAP workout..."
                maxLength={500}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
              {data.notes && (
                <p className="text-xs text-muted-foreground">{data.notes.length}/500 characters</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="h-12 text-lg font-semibold touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                {isLoading ? 'Saving...' : 'Save AMRAP Data'}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-12 text-lg touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
