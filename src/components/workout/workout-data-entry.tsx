'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistance, formatDuration } from '@/utils/formatters'
import { getPreviousExerciseData } from '@/actions/exercises'
import { saveExerciseCompletion } from '@/actions/workouts'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useWorkoutStore } from '@/stores/workout-store'
import {
  validateWorkoutField,
  validateWorkoutDataEntry,
  sanitizeWorkoutInput,
  type WorkoutDataEntryData as ValidationWorkoutData,
} from '@/utils/validation'
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
  onSave?: (data: WorkoutDataEntryData) => void // Made optional since we handle saving internally
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
  // Get workout store for program context and progress tracking
  const { 
    currentProgram, 
    currentMilestoneIndex, 
    currentDayIndex, 
    completeExercise,
    updateExerciseProgress
  } = useWorkoutStore()

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

  // New state for save operations
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Auto-save configuration with retry logic
  const { autoSave, clearAutoSave, hasPendingData } = useAutoSave({
    delay: 2000, // 2 second delay for auto-save
    maxRetries: 3, // 3 retry attempts
    retryDelay: 5000, // 5 second delay between retries
    onSuccess: () => {
      setLastSavedAt(new Date())
      setSaveError(null)
    },
    onError: (error) => {
      console.warn('Auto-save failed after retries:', error)
      // Don't set saveError for auto-save failures to avoid disrupting user experience
    },
    onRetry: (attempt) => {
      console.log(`Auto-save retry attempt ${attempt}`)
    },
  })

  // Auto-save data when form data changes
  const triggerAutoSave = useCallback(() => {
    if (!currentProgram) return

    const autoSaveData = {
      exerciseId: exercise.id,
      programId: currentProgram.id,
      milestoneIndex: currentMilestoneIndex,
      dayIndex: currentDayIndex,
      sets: data.sets > 0 ? data.sets : undefined,
      reps: data.reps > 0 ? data.reps : undefined,
      weight: data.weight && data.weight > 0 ? data.weight : undefined,
      time: data.time && data.time > 0 ? data.time : undefined,
      distance: data.distance && data.distance > 0 ? data.distance : undefined,
      distanceUnit: data.distanceUnit,
      notes: data.notes?.trim() || undefined,
    }

    autoSave(autoSaveData)
  }, [
    autoSave,
    currentProgram,
    currentMilestoneIndex,
    currentDayIndex,
    exercise.id,
    data.sets,
    data.reps,
    data.weight,
    data.time,
    data.distance,
    data.distanceUnit,
    data.notes,
  ])

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
            setData((prev) => ({
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
            setData((prev) => ({
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

  // Trigger auto-save when data changes (after initial loading)
  useEffect(() => {
    if (!isLoadingData) {
      triggerAutoSave()
    }
  }, [triggerAutoSave, isLoadingData])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Real-time field validation using Zod schemas
  const validateField = (field: keyof ValidationWorkoutData, value: unknown) => {
    const newErrors = { ...errors }

    // Sanitize and validate the input
    const sanitizedValue = sanitizeWorkoutInput(value as string | number)
    const validationError = validateWorkoutField(field, sanitizedValue)

    if (validationError) {
      newErrors[field] = validationError
    } else {
      delete newErrors[field]
    }

    setErrors(newErrors)
    return sanitizedValue
  }

  const updateField = (field: keyof WorkoutDataEntryData, value: string | number | undefined) => {
    // Validate and sanitize the value first
    const sanitizedValue = validateField(field as keyof ValidationWorkoutData, value)

    // Update the data with the sanitized value
    setData((prev) => ({ ...prev, [field]: sanitizedValue }))
  }

  // Calculate completion percentage based on current data
  const calculateCompletionPercentage = useCallback(() => {
    const requiredFields = ['sets', 'reps']
    
    // Add optional fields based on exercise requirements
    if (exerciseConfig.weight) requiredFields.push('weight')
    if (exerciseConfig.durationValue) requiredFields.push('time')
    if (exerciseConfig.distanceValue) requiredFields.push('distance')
    
    const completedFields = requiredFields.filter(field => {
      const value = data[field as keyof WorkoutDataEntryData]
      return value !== undefined && value !== null && value !== 0 && value !== ''
    })
    
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }, [data, exerciseConfig])

  // Update exercise progress in real-time as data changes
  useEffect(() => {
    if (!isLoadingData) {
      const completionPercentage = calculateCompletionPercentage()
      const hasData = data.sets > 0 && data.reps > 0
      const isCompleted = completionPercentage === 100 && hasData
      
      updateExerciseProgress(exercise.id, {
        hasData,
        isCompleted,
        completionPercentage,
      })
    }
  }, [exercise.id, data, isLoadingData, calculateCompletionPercentage, updateExerciseProgress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear auto-save to prevent conflicts
    clearAutoSave()

    // Comprehensive form validation using Zod schema
    const validationResult = validateWorkoutDataEntry(data)

    if (!validationResult.isValid) {
      // Update errors with validation results
      setErrors(validationResult.errors)
      return
    }

    if (!currentProgram) {
      setSaveError('Program context is required. Please try again.')
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      // Save to database using server action
      const result = await saveExerciseCompletion({
        exerciseId: exercise.id,
        programId: currentProgram.id,
        milestoneIndex: currentMilestoneIndex,
        dayIndex: currentDayIndex,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight && data.weight > 0 ? data.weight : undefined,
        time: data.time && data.time > 0 ? data.time : undefined,
        distance: data.distance && data.distance > 0 ? data.distance : undefined,
        distanceUnit: data.distanceUnit,
        notes: data.notes?.trim() || undefined,
      })

      if (result.success) {
        // Clear any existing errors
        setErrors({})
        setSaveSuccess(true)
        setLastSavedAt(new Date())

        // Mark exercise as completed in workout store
        completeExercise(exercise.id)

        // Call optional onSave callback for legacy support
        onSave?.(data)

        // Show success feedback for a few seconds
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(result.error || 'Failed to save workout data. Please try again.')
      }
    } catch (error) {
      console.error('Save exercise completion error:', error)
      setSaveError('Network error. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = Object.keys(errors).length === 0

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-semibold">{exercise.title}</CardTitle>
            {!isLoadingData && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Progress:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateCompletionPercentage()}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{calculateCompletionPercentage()}%</span>
                </div>
              </div>
            )}
          </div>
          {!isLoadingData && (
            <div className="flex gap-2 flex-wrap">
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
              {saveSuccess && (
                <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                  ✓ Saved
                </Badge>
              )}
              {lastSavedAt && !saveSuccess && (
                <Badge variant="outline" className="text-xs text-green-600">
                  Auto-saved{' '}
                  {new Date().getTime() - lastSavedAt.getTime() < 60000 ? 'now' : 'recently'}
                </Badge>
              )}
              {!isOnline && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️ Offline
                </Badge>
              )}
              {!isOnline && hasPendingData() && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  📝 Pending Save
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
                Previous session:{' '}
                {new Date(autoPopulationData.lastCompletedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {!isLoadingData && dataSource === 'smart' && smartDefaults && (
            <div className="pt-2 border-t">
              <p className="text-blue-600 font-medium">
                Based on {smartDefaults.basedOnSessions} previous session
                {smartDefaults.basedOnSessions > 1 ? 's' : ''} ({smartDefaults.confidence}{' '}
                confidence)
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

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              type="text"
              value={data.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="h-12 text-base touch-manipulation"
              style={{ minHeight: '44px' }}
              placeholder="Add any notes about this exercise..."
              maxLength={500}
              disabled={isLoadingData}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
            {data.notes && (
              <p className="text-xs text-muted-foreground">{data.notes.length}/500 characters</p>
            )}
          </div>

          {/* Save Error Display */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 font-medium">❌ Save Failed</p>
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          {/* Success Display */}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-600 font-medium">✅ Exercise Data Saved!</p>
              <p className="text-xs text-green-600">Your workout progress has been recorded.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading || isLoadingData || isSaving}
              className="h-12 text-lg font-semibold touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              {isSaving
                ? 'Saving...'
                : isLoading
                  ? 'Loading...'
                  : isLoadingData
                    ? 'Loading...'
                    : saveSuccess
                      ? '✓ Saved - Save Again'
                      : 'Save Exercise Data'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-12 text-lg touch-manipulation"
                style={{ minHeight: '44px' }}
                disabled={isSaving}
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
