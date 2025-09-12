'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistance, formatDuration } from '@/utils/formatters'
import type { DayExercise, Exercise } from '@/types/program'

export interface WorkoutDataEntryData {
  sets: number
  reps: number
  notes: string
  weight?: number
  time?: number
  distance?: number
  distanceUnit?: 'meters' | 'miles'
  timeUnit?: 'seconds' | 'minutes' | 'hours'
}

export interface WorkoutDataEntryProps {
  exercise: Exercise
  exerciseConfig: DayExercise
  previousData?: WorkoutDataEntryData
  onSave: (data: WorkoutDataEntryData) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function WorkoutDataEntry({
  exercise,
  exerciseConfig,
  previousData,
  onSave,
  onCancel,
  isLoading = false,
}: WorkoutDataEntryProps) {
  const [data, setData] = useState<WorkoutDataEntryData>(() => {
    const initialData: WorkoutDataEntryData = {
      sets: previousData?.sets ?? exerciseConfig.sets,
      reps: previousData?.reps ?? exerciseConfig.reps,
      notes: previousData?.notes ?? '',
    }

    if (previousData?.weight !== undefined) {
      initialData.weight = previousData.weight
    } else if (exerciseConfig.weight !== undefined) {
      initialData.weight = exerciseConfig.weight
    }

    if (previousData?.time !== undefined) {
      initialData.time = previousData.time
    } else if (exerciseConfig.durationValue !== undefined) {
      initialData.time = exerciseConfig.durationValue
    }

    if (previousData?.distance !== undefined) {
      initialData.distance = previousData.distance
    } else if (exerciseConfig.distanceValue !== undefined) {
      initialData.distance = exerciseConfig.distanceValue
    }

    if (previousData?.distanceUnit !== undefined) {
      initialData.distanceUnit = previousData.distanceUnit
    } else if (exerciseConfig.distanceUnit !== undefined) {
      initialData.distanceUnit = exerciseConfig.distanceUnit
    }

    if (previousData?.timeUnit !== undefined) {
      initialData.timeUnit = previousData.timeUnit
    } else if (exerciseConfig.durationUnit !== undefined) {
      initialData.timeUnit = exerciseConfig.durationUnit
    }

    return initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: number | undefined) => {
    const newErrors = { ...errors }

    if (value !== undefined && value !== null) {
      switch (field) {
        case 'sets':
          if (value < 1 || value > 99) {
            newErrors.sets = 'Sets must be between 1 and 99'
          } else {
            delete newErrors.sets
          }
          break
        case 'reps':
          if (value < 1 || value > 999) {
            newErrors.reps = 'Reps must be between 1 and 999'
          } else {
            delete newErrors.reps
          }
          break
        case 'weight':
          if (value < 0 || value > 1000) {
            newErrors.weight = 'Weight must be between 0 and 1000 lbs'
          } else {
            delete newErrors.weight
          }
          break
        case 'time':
          if (value < 0 || value > 999) {
            newErrors.time = 'Time must be between 0 and 999'
          } else {
            delete newErrors.time
          }
          break
        case 'distance':
          if (value < 0 || value > 999) {
            newErrors.distance = 'Distance must be between 0 and 999'
          } else {
            delete newErrors.distance
          }
          break
      }
    }

    setErrors(newErrors)
  }

  const updateField = (field: keyof WorkoutDataEntryData, value: string | number | undefined) => {
    setData((prev) => ({ ...prev, [field]: value }))

    // Validate numeric fields
    if (typeof value === 'number') {
      validateField(field, value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Final validation
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) return

    onSave(data)
  }

  const isFormValid = Object.keys(errors).length === 0

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold">{exercise.title}</CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          {exerciseConfig.sets > 0 && (
            <div>
              Target: {exerciseConfig.sets} sets × {exerciseConfig.reps} reps
            </div>
          )}
          {exerciseConfig.weight && <div>Weight: {exerciseConfig.weight} lbs</div>}
          {exerciseConfig.durationValue && exerciseConfig.durationUnit && (
            <div>
              Duration: {formatDuration(exerciseConfig.durationValue, exerciseConfig.durationUnit)}
            </div>
          )}
          {exerciseConfig.distanceValue && exerciseConfig.distanceUnit && (
            <div>
              Distance: {formatDistance(exerciseConfig.distanceValue, exerciseConfig.distanceUnit)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sets Input */}
          <div className="space-y-2">
            <Label htmlFor="sets" className="text-base font-medium">
              Sets
            </Label>
            <Input
              id="sets"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.sets}
              onChange={(e) => updateField('sets', parseInt(e.target.value) || 0)}
              className="h-12 text-lg text-center font-semibold touch-manipulation"
              style={{ fontSize: '18px', minHeight: '44px' }}
              min="1"
              max="99"
            />
            {errors.sets && <p className="text-sm text-destructive">{errors.sets}</p>}
          </div>

          {/* Reps Input */}
          <div className="space-y-2">
            <Label htmlFor="reps" className="text-base font-medium">
              Reps
            </Label>
            <Input
              id="reps"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.reps}
              onChange={(e) => updateField('reps', parseInt(e.target.value) || 0)}
              className="h-12 text-lg text-center font-semibold touch-manipulation"
              style={{ fontSize: '18px', minHeight: '44px' }}
              min="1"
              max="999"
            />
            {errors.reps && <p className="text-sm text-destructive">{errors.reps}</p>}
          </div>

          {/* Weight Input (conditional) */}
          {(exerciseConfig.weight !== undefined || data.weight !== undefined) && (
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-base font-medium">
                Weight (lbs)
              </Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={data.weight || ''}
                onChange={(e) => updateField('weight', parseFloat(e.target.value) || undefined)}
                className="h-12 text-lg text-center font-semibold touch-manipulation"
                style={{ fontSize: '18px', minHeight: '44px' }}
                min="0"
                max="1000"
                placeholder="Optional"
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
            </div>
          )}

          {/* Time Input (conditional) */}
          {(exerciseConfig.durationValue !== undefined || data.time !== undefined) && (
            <div className="space-y-2">
              <Label htmlFor="time" className="text-base font-medium">
                Time {data.timeUnit && `(${data.timeUnit})`}
              </Label>
              <Input
                id="time"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={data.time || ''}
                onChange={(e) => updateField('time', parseFloat(e.target.value) || undefined)}
                className="h-12 text-lg text-center font-semibold touch-manipulation"
                style={{ fontSize: '18px', minHeight: '44px' }}
                min="0"
                max="999"
                placeholder="Optional"
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
              {data.time && data.timeUnit && (
                <p className="text-sm text-muted-foreground text-center">
                  {formatDuration(data.time, data.timeUnit)}
                </p>
              )}
            </div>
          )}

          {/* Distance Input (conditional) */}
          {(exerciseConfig.distanceValue !== undefined || data.distance !== undefined) && (
            <div className="space-y-2">
              <Label htmlFor="distance" className="text-base font-medium">
                Distance {data.distanceUnit && `(${data.distanceUnit})`}
              </Label>
              <Input
                id="distance"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={data.distance || ''}
                onChange={(e) => updateField('distance', parseFloat(e.target.value) || undefined)}
                className="h-12 text-lg text-center font-semibold touch-manipulation"
                style={{ fontSize: '18px', minHeight: '44px' }}
                min="0"
                max="999"
                placeholder="Optional"
              />
              {errors.distance && <p className="text-sm text-destructive">{errors.distance}</p>}
              {data.distance && data.distanceUnit && (
                <p className="text-sm text-muted-foreground text-center">
                  {formatDistance(data.distance, data.distanceUnit)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="h-12 text-lg font-semibold touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              {isLoading ? 'Saving...' : 'Save Exercise Data'}
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
  )
}
