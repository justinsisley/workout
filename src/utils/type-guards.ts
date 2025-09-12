import type { MilestoneDay, DayExercise } from '@/types/program'

export function isAmrapDay(day: MilestoneDay): boolean {
  return day.isAmrap === true && typeof day.amrapDuration === 'number' && day.amrapDuration > 0
}

export function hasDistance(exercise: DayExercise): boolean {
  return (
    typeof exercise.distanceValue === 'number' &&
    exercise.distanceValue > 0 &&
    typeof exercise.distanceUnit === 'string' &&
    ['meters', 'miles'].includes(exercise.distanceUnit)
  )
}

export function hasDuration(exercise: DayExercise): boolean {
  return (
    typeof exercise.durationValue === 'number' &&
    exercise.durationValue > 0 &&
    typeof exercise.durationUnit === 'string' &&
    ['seconds', 'minutes', 'hours'].includes(exercise.durationUnit)
  )
}
