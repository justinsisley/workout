import type { DayExercise } from '@/types/program'

export function formatDistance(value: number, unit: 'meters' | 'miles'): string {
  if (unit === 'meters') {
    if (value === 1) return '1 meter'
    return `${value} meters`
  }

  if (unit === 'miles') {
    if (value === 1) return '1 mile'
    return `${value} miles`
  }

  return `${value} ${unit}`
}

export function formatDuration(value: number, unit: 'seconds' | 'minutes' | 'hours'): string {
  if (unit === 'seconds') {
    if (value === 1) return '1 second'
    if (value === 30) return '30 seconds'
    return `${value} seconds`
  }

  if (unit === 'minutes') {
    if (value === 1) return '1 minute'
    if (value === 5) return '5 minutes'
    return `${value} minutes`
  }

  if (unit === 'hours') {
    if (value === 1) return '1 hour'
    return `${value} hours`
  }

  return `${value} ${unit}`
}

export function formatExerciseSpecs(exercise: DayExercise): string {
  const specs: string[] = []

  if (exercise.sets > 0) {
    specs.push(`${exercise.sets} sets`)
  }

  if (exercise.reps > 0) {
    specs.push(`${exercise.reps} reps`)
  }

  if (exercise.weight) {
    specs.push(`${exercise.weight} lbs`)
  }

  if (exercise.durationValue && exercise.durationUnit) {
    specs.push(formatDuration(exercise.durationValue, exercise.durationUnit))
  }

  if (exercise.distanceValue && exercise.distanceUnit) {
    specs.push(formatDistance(exercise.distanceValue, exercise.distanceUnit))
  }

  if (exercise.restPeriod) {
    specs.push(`${exercise.restPeriod}s rest`)
  }

  return specs.join(' × ')
}
