import type { Program } from '@/payload/payload-types'

/**
 * Calculate the total duration of a program in days based on its embedded structure
 */
export function calculateProgramDurationDays(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  return program.milestones.reduce((totalDays, milestone) => {
    if (!milestone.days || milestone.days.length === 0) {
      return totalDays
    }
    return totalDays + milestone.days.length
  }, 0)
}

/**
 * Calculate the number of workout days in a program
 */
export function calculateWorkoutDays(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  return program.milestones.reduce((workoutDays, milestone) => {
    if (!milestone.days || milestone.days.length === 0) {
      return workoutDays
    }

    const milestoneWorkoutDays = milestone.days.filter((day) => day.dayType === 'workout').length

    return workoutDays + milestoneWorkoutDays
  }, 0)
}

/**
 * Calculate the estimated time per workout session in minutes
 */
export function calculateAverageWorkoutDuration(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  let totalDurationMinutes = 0
  let workoutCount = 0

  program.milestones.forEach((milestone) => {
    if (!milestone.days || milestone.days.length === 0) {
      return
    }

    milestone.days.forEach((day) => {
      if (day.dayType !== 'workout' || !day.exercises || day.exercises.length === 0) {
        return
      }

      workoutCount++
      let dayDurationMinutes = 0

      day.exercises.forEach((exercise) => {
        // Base time per set (including rest)
        const setsTime = exercise.sets * 0.5 // Assume 30 seconds per set on average
        const restTime = exercise.restPeriod ? (exercise.restPeriod * exercise.sets) / 60 : 1 // Rest between sets

        // Add duration-based exercises
        let durationTime = 0
        if (exercise.durationValue && exercise.durationUnit) {
          switch (exercise.durationUnit) {
            case 'seconds':
              durationTime = exercise.durationValue / 60
              break
            case 'minutes':
              durationTime = exercise.durationValue
              break
            case 'hours':
              durationTime = exercise.durationValue * 60
              break
          }
        }

        dayDurationMinutes += setsTime + restTime + durationTime
      })

      totalDurationMinutes += dayDurationMinutes
    })
  })

  return workoutCount > 0 ? Math.round(totalDurationMinutes / workoutCount) : 0
}

/**
 * Generate a comprehensive program duration summary
 */
export interface ProgramDurationSummary {
  totalDays: number
  workoutDays: number
  restDays: number
  estimatedWeeks: number
  averageWorkoutDurationMinutes: number
  totalEstimatedWorkoutHours: number
  milestoneBreakdown: Array<{
    name: string
    days: number
    workoutDays: number
    restDays: number
  }>
}

export function generateProgramDurationSummary(program: Program): ProgramDurationSummary {
  const totalDays = calculateProgramDurationDays(program)
  const workoutDays = calculateWorkoutDays(program)
  const restDays = totalDays - workoutDays
  const estimatedWeeks = Math.ceil(totalDays / 7)
  const averageWorkoutDurationMinutes = calculateAverageWorkoutDuration(program)
  const totalEstimatedWorkoutHours =
    Math.round(((workoutDays * averageWorkoutDurationMinutes) / 60) * 10) / 10

  const milestoneBreakdown = (program.milestones || []).map((milestone) => {
    const milestoneDays = milestone.days?.length || 0
    const milestoneWorkoutDays =
      milestone.days?.filter((day) => day.dayType === 'workout').length || 0
    const milestoneRestDays = milestoneDays - milestoneWorkoutDays

    return {
      name: milestone.name || 'Unnamed Milestone',
      days: milestoneDays,
      workoutDays: milestoneWorkoutDays,
      restDays: milestoneRestDays,
    }
  })

  return {
    totalDays,
    workoutDays,
    restDays,
    estimatedWeeks,
    averageWorkoutDurationMinutes,
    totalEstimatedWorkoutHours,
    milestoneBreakdown,
  }
}

/**
 * Validate if a program duration is realistic based on common fitness program standards
 */
export interface ProgramDurationValidation {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
}

export function validateProgramDuration(
  summary: ProgramDurationSummary,
): ProgramDurationValidation {
  const warnings: string[] = []
  const recommendations: string[] = []
  let isValid = true

  // Check total program length
  if (summary.totalDays < 7) {
    warnings.push('Program is very short (less than 1 week)')
    recommendations.push('Consider extending program to at least 2-4 weeks for meaningful results')
    isValid = false
  } else if (summary.totalDays > 365) {
    warnings.push('Program is extremely long (over 1 year)')
    recommendations.push('Consider breaking into multiple shorter programs or phases')
  }

  // Check workout frequency
  const workoutFrequency = summary.workoutDays / summary.estimatedWeeks
  if (workoutFrequency < 2) {
    warnings.push('Very low workout frequency (less than 2x per week)')
    recommendations.push(
      'Consider increasing workout frequency to 3-4x per week for better results',
    )
  } else if (workoutFrequency > 6) {
    warnings.push('Very high workout frequency (more than 6x per week)')
    recommendations.push('Ensure adequate recovery time between workouts')
  }

  // Check workout duration
  if (summary.averageWorkoutDurationMinutes < 15) {
    warnings.push('Very short average workout duration (less than 15 minutes)')
    recommendations.push('Consider adding more exercises or sets for more comprehensive workouts')
  } else if (summary.averageWorkoutDurationMinutes > 120) {
    warnings.push('Very long average workout duration (over 2 hours)')
    recommendations.push('Consider splitting longer workouts into multiple sessions')
  }

  // Check rest day ratio
  const restDayRatio = summary.restDays / summary.totalDays
  if (restDayRatio < 0.2) {
    warnings.push('Very few rest days (less than 20% of program)')
    recommendations.push('Add more rest days to prevent overtraining and allow recovery')
  }

  return {
    isValid,
    warnings,
    recommendations,
  }
}
