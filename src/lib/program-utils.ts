import type { Program, ProgramPreview, MilestonePreview } from '@/types/program'

/**
 * Generate program preview with summary statistics
 */
export function generateProgramPreview(program: Program): ProgramPreview {
  const milestonePreview: MilestonePreview[] = program.milestones.map((milestone) => {
    const workoutDayCount = milestone.days.filter((day) => day.dayType === 'workout').length

    return {
      name: milestone.name,
      theme: milestone.theme,
      objective: milestone.objective,
      dayCount: milestone.days.length,
      workoutDayCount,
    }
  })

  const totalDays = program.milestones.reduce(
    (total, milestone) => total + milestone.days.length,
    0,
  )

  const totalWorkoutDays = program.milestones.reduce(
    (total, milestone) => total + milestone.days.filter((day) => day.dayType === 'workout').length,
    0,
  )

  // Calculate estimated duration (assuming 3-4 workouts per week)
  const weeksEstimate = Math.ceil(totalWorkoutDays / 3.5)
  const estimatedDuration = weeksEstimate === 1 ? '1 week' : `${weeksEstimate} weeks`

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    objective: program.objective,
    totalMilestones: program.milestones.length,
    totalDays,
    totalWorkoutDays,
    estimatedDuration,
    milestonePreview,
  }
}
