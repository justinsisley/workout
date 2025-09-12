'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { getPreviousExerciseData } from '@/actions/exercises'
import type { DayExercise, Exercise, PreviousExerciseData, SmartDefaults } from '@/types/program'

export interface WorkoutDataEntryData {
  sets: number
  reps: number
  notes: string
  weight?: number | undefined
  time?: number | undefined
  distance?: number | undefined
  distanceUnit?: 'meters' | 'miles' | undefined
  timeUnit?: 'seconds' | 'minutes' | 'hours' | undefined
}

export interface WorkoutDataEntryProps {
  exercise: Exercise
  exerciseConfig: DayExercise
  previousData?: WorkoutDataEntryData // Legacy support - will be overridden by auto-population
  onSave: (data: WorkoutDataEntryData) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function WorkoutDataEntry({
  exercise,
  exerciseConfig,
  previousData: _previousData, // Legacy support - overridden by auto-population
  onSave,
  onCancel,
  isLoading = false,
}: WorkoutDataEntryProps) {
  const [data, setData] = useState<WorkoutDataEntryData>(() => {
    // Initialize with fallback defaults based on exercise config
    return {
      sets: exerciseConfig.sets,
      reps: exerciseConfig.reps,
      notes: '',
      weight: exerciseConfig.weight,
      time: exerciseConfig.durationValue,
      distance: exerciseConfig.distanceValue,
      distanceUnit: exerciseConfig.distanceUnit,
      timeUnit: exerciseConfig.durationUnit,
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoPopulationData, setAutoPopulationData] = useState<PreviousExerciseData | null>(null)
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataSource, setDataSource] = useState<'config' | 'previous' | 'smart'>('config')

  // Auto-population: Load previous exercise data on component mount
  useEffect(() => {
    const loadPreviousData = async () => {
      setIsLoadingData(true)
      
      try {
        const result = await getPreviousExerciseData(exercise.id)
        
        if (result.success) {
          if (result.previousData) {
            setAutoPopulationData(result.previousData)
            setDataSource('previous')
            
            // Pre-fill form with previous workout data
            setData(prev => ({
              ...prev,
              sets: result.previousData!.sets,
              reps: result.previousData!.reps,
              weight: result.previousData!.weight ?? prev.weight,
              time: result.previousData!.time ?? prev.time,
              distance: result.previousData!.distance ?? prev.distance,
              distanceUnit: result.previousData!.distanceUnit ?? prev.distanceUnit,
            }))
          } else if (result.smartDefaults) {
            setSmartDefaults(result.smartDefaults)
            setDataSource('smart')
            
            // Apply smart defaults
            setData(prev => ({
              ...prev,
              sets: result.smartDefaults!.suggestedSets,
              reps: result.smartDefaults!.suggestedReps,
              weight: result.smartDefaults!.suggestedWeight ?? prev.weight,
              time: result.smartDefaults!.suggestedTime ?? prev.time,
              distance: result.smartDefaults!.suggestedDistance ?? prev.distance,
              distanceUnit: result.smartDefaults!.suggestedDistanceUnit ?? prev.distanceUnit,
            }))
          }
          // If no previous data or smart defaults, keep initial fallback defaults
        }
      } catch (error) {
        console.error('Failed to load previous exercise data:', error)
        // Continue with fallback defaults
      } finally {
        setIsLoadingData(false)
      }
    }

    loadPreviousData()
  }, [exercise.id])

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl font-semibold">{exercise.title}</CardTitle>
          {!isLoadingData && (
            <div className="flex gap-2">
              {dataSource === 'previous' && autoPopulationData && (
                <Badge variant="secondary" className="text-xs">
                  Previous Data
                </Badge>
              )}
              {dataSource === 'smart' && smartDefaults && (
                <Badge variant="outline" className="text-xs">
                  Smart Defaults
                </Badge>
              )}
              {dataSource === 'config' && (
                <Badge variant="outline" className="text-xs">
                  Program Default
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          {/* Show program target info */}
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

          {/* Show auto-population info */}
          {!isLoadingData && dataSource === 'previous' && autoPopulationData && (
            <div className="pt-2 border-t">
              <p className="text-green-600 font-medium">
                Previous session: {new Date(autoPopulationData.lastCompletedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {!isLoadingData && dataSource === 'smart' && smartDefaults && (
            <div className="pt-2 border-t">
              <p className="text-blue-600 font-medium">
                Based on {smartDefaults.basedOnSessions} previous session{smartDefaults.basedOnSessions > 1 ? 's' : ''} ({smartDefaults.confidence} confidence)
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loading State */}
          {isLoadingData && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading previous workout data...</p>
            </div>
          )}

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
              disabled={isLoadingData}
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
              disabled={isLoadingData}
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
                disabled={isLoadingData}
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
                disabled={isLoadingData}
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
                disabled={isLoadingData}
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
              disabled={!isFormValid || isLoading || isLoadingData}
              className="h-12 text-lg font-semibold touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              {isLoading ? 'Saving...' : isLoadingData ? 'Loading...' : 'Save Exercise Data'}
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
