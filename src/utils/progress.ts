import type { Program, UserProgress } from '@/types/program'

/**
 * Interface for comprehensive program progress data
 */
export interface ProgramProgress {
  currentMilestone: number
  currentDay: number
  totalMilestones: number
  totalDays: number
  completionPercentage: number
  milestoneProgress: MilestoneProgress
  isComplete: boolean
  daysRemaining: number
  milestonesRemaining: number
}

/**
 * Interface for milestone-specific progress
 */
export interface MilestoneProgress {
  currentMilestoneIndex: number
  currentDayIndex: number
  totalDaysInCurrentMilestone: number
  currentMilestoneCompletionPercentage: number
  currentMilestoneName: string
  isCurrentMilestoneComplete: boolean
}

/**
 * Interface for overall program analytics
 */
export interface ProgramAnalytics {
  totalWorkoutDaysCompleted: number
  totalRestDaysCompleted: number
  workoutDaysRemaining: number
  restDaysRemaining: number
  currentMilestoneWorkoutDays: number
  currentMilestoneRestDays: number
  estimatedCompletionDate: Date | null
  programStartDate: Date | null
}

/**
 * Calculate comprehensive program progress based on user's current position
 */
export function calculateProgramProgress(
  program: Program,
  userProgress: UserProgress,
): ProgramProgress {
  const totalMilestones = program.milestones?.length || 0
  const totalDays = calculateTotalProgramDays(program)

  // Calculate current absolute day position in program
  const absoluteDayPosition = calculateAbsoluteDayPosition(
    program,
    userProgress.currentMilestone,
    userProgress.currentDay,
  )

  // Calculate completion percentage
  const completionPercentage =
    totalDays > 0 ? Math.round((absoluteDayPosition / totalDays) * 100) : 0

  // Calculate milestone progress
  const milestoneProgress = calculateMilestoneProgress(
    program,
    userProgress.currentMilestone,
    userProgress.currentDay,
  )

  // Check if program is complete
  const isComplete =
    totalMilestones > 0 &&
    userProgress.currentMilestone >= totalMilestones - 1 &&
    userProgress.currentDay >=
      (program.milestones?.[userProgress.currentMilestone]?.days?.length || 0) - 1

  // Calculate remaining days and milestones
  const daysRemaining = Math.max(0, totalDays - absoluteDayPosition)
  const milestonesRemaining = Math.max(0, totalMilestones - userProgress.currentMilestone - 1)

  return {
    currentMilestone: userProgress.currentMilestone,
    currentDay: userProgress.currentDay,
    totalMilestones,
    totalDays,
    completionPercentage,
    milestoneProgress,
    isComplete,
    daysRemaining,
    milestonesRemaining,
  }
}

/**
 * Calculate milestone-specific progress information
 */
export function calculateMilestoneProgress(
  program: Program,
  currentMilestone: number,
  currentDay: number,
): MilestoneProgress {
  const milestones = program.milestones || []

  if (currentMilestone >= milestones.length) {
    // Beyond last milestone - program complete
    const lastMilestone = milestones[milestones.length - 1]
    return {
      currentMilestoneIndex: milestones.length - 1,
      currentDayIndex: (lastMilestone?.days?.length || 1) - 1,
      totalDaysInCurrentMilestone: lastMilestone?.days?.length || 0,
      currentMilestoneCompletionPercentage: 100,
      currentMilestoneName: lastMilestone?.name || 'Completed',
      isCurrentMilestoneComplete: true,
    }
  }

  const milestone = milestones[currentMilestone]
  const totalDaysInMilestone = milestone?.days?.length || 0
  const completionPercentage =
    totalDaysInMilestone > 0 ? Math.round(((currentDay + 1) / totalDaysInMilestone) * 100) : 0

  const isCurrentMilestoneComplete = currentDay >= totalDaysInMilestone - 1

  return {
    currentMilestoneIndex: currentMilestone,
    currentDayIndex: currentDay,
    totalDaysInCurrentMilestone: totalDaysInMilestone,
    currentMilestoneCompletionPercentage: completionPercentage,
    currentMilestoneName: milestone?.name || `Milestone ${currentMilestone + 1}`,
    isCurrentMilestoneComplete,
  }
}

/**
 * Calculate overall program analytics including workout/rest day breakdown
 */
export function calculateProgramAnalytics(
  program: Program,
  userProgress: UserProgress,
  programStartDate?: Date,
): ProgramAnalytics {
  const totalWorkoutDays = calculateTotalWorkoutDays(program)
  const totalRestDays = calculateTotalRestDays(program)

  // Calculate completed days by type
  const { workoutDaysCompleted, restDaysCompleted } = calculateCompletedDaysByType(
    program,
    userProgress.currentMilestone,
    userProgress.currentDay,
  )

  // Calculate remaining days by type
  const workoutDaysRemaining = Math.max(0, totalWorkoutDays - workoutDaysCompleted)
  const restDaysRemaining = Math.max(0, totalRestDays - restDaysCompleted)

  // Calculate current milestone day breakdown
  const { workoutDays: currentMilestoneWorkoutDays, restDays: currentMilestoneRestDays } =
    calculateMilestoneDayBreakdown(program, userProgress.currentMilestone)

  // Estimate completion date if start date provided
  let estimatedCompletionDate: Date | null = null
  if (programStartDate) {
    const totalDays = calculateTotalProgramDays(program)

    estimatedCompletionDate = new Date(programStartDate)
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + totalDays)
  }

  return {
    totalWorkoutDaysCompleted: workoutDaysCompleted,
    totalRestDaysCompleted: restDaysCompleted,
    workoutDaysRemaining,
    restDaysRemaining,
    currentMilestoneWorkoutDays,
    currentMilestoneRestDays,
    estimatedCompletionDate,
    programStartDate: programStartDate || null,
  }
}

/**
 * Validate progress consistency with program structure
 */
export interface ProgressValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateProgressConsistency(
  program: Program,
  userProgress: UserProgress,
): ProgressValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate program structure
  if (!program.milestones || program.milestones.length === 0) {
    errors.push('Program has no milestones')
    return { isValid: false, errors, warnings }
  }

  // Validate milestone index
  if (userProgress.currentMilestone < 0) {
    errors.push('Current milestone index cannot be negative')
  }

  if (userProgress.currentMilestone >= program.milestones.length) {
    // This might be valid if user completed the program
    const isComplete =
      userProgress.currentMilestone === program.milestones.length && userProgress.currentDay === 0
    if (!isComplete) {
      errors.push(
        `Current milestone index (${userProgress.currentMilestone}) exceeds program milestones (${program.milestones.length})`,
      )
    }
  }

  // Validate day index within current milestone
  if (userProgress.currentMilestone < program.milestones.length) {
    const currentMilestone = program.milestones[userProgress.currentMilestone]
    const totalDaysInMilestone = currentMilestone?.days?.length || 0

    if (userProgress.currentDay < 0) {
      errors.push('Current day index cannot be negative')
    }

    if (userProgress.currentDay >= totalDaysInMilestone) {
      errors.push(
        `Current day index (${userProgress.currentDay}) exceeds milestone days (${totalDaysInMilestone})`,
      )
    }

    // Validate milestone structure (only if milestone exists)
    if (currentMilestone && (!currentMilestone.days || currentMilestone.days.length === 0)) {
      warnings.push(`Milestone ${userProgress.currentMilestone} has no days defined`)
    }
  }

  // Validate program publication status
  if (!program.isPublished) {
    warnings.push('User is assigned to an unpublished program')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Helper function to calculate total days in a program
 */
export function calculateTotalProgramDays(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  return program.milestones.reduce((total, milestone) => {
    return total + (milestone?.days?.length || 0)
  }, 0)
}

/**
 * Helper function to calculate total workout days in a program
 */
export function calculateTotalWorkoutDays(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  return program.milestones.reduce((total, milestone) => {
    if (!milestone.days) return total

    const workoutDays = milestone.days.filter((day) => day.dayType === 'workout').length
    return total + workoutDays
  }, 0)
}

/**
 * Helper function to calculate total rest days in a program
 */
export function calculateTotalRestDays(program: Program): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  return program.milestones.reduce((total, milestone) => {
    if (!milestone.days) return total

    const restDays = milestone.days.filter((day) => day.dayType === 'rest').length
    return total + restDays
  }, 0)
}

/**
 * Helper function to calculate absolute day position in program (0-based)
 */
export function calculateAbsoluteDayPosition(
  program: Program,
  currentMilestone: number,
  currentDay: number,
): number {
  if (!program.milestones || program.milestones.length === 0) {
    return 0
  }

  let position = 0

  // Add days from completed milestones
  for (let i = 0; i < currentMilestone && i < program.milestones.length; i++) {
    position += program.milestones[i]?.days?.length || 0
  }

  // Add current day position (currentDay is 0-based, so add 1 for completed days)
  position += currentDay + 1

  return position
}

/**
 * Helper function to calculate completed days by type (workout/rest)
 */
export function calculateCompletedDaysByType(
  program: Program,
  currentMilestone: number,
  currentDay: number,
): { workoutDaysCompleted: number; restDaysCompleted: number } {
  if (!program.milestones || program.milestones.length === 0) {
    return { workoutDaysCompleted: 0, restDaysCompleted: 0 }
  }

  let workoutDaysCompleted = 0
  let restDaysCompleted = 0

  // Count days from completed milestones
  for (let i = 0; i < currentMilestone && i < program.milestones.length; i++) {
    const milestone = program.milestones[i]
    if (milestone?.days) {
      workoutDaysCompleted += milestone.days.filter((day) => day.dayType === 'workout').length
      restDaysCompleted += milestone.days.filter((day) => day.dayType === 'rest').length
    }
  }

  // Count days from current milestone up to current day (exclusive)
  if (currentMilestone < program.milestones.length) {
    const currentMilestoneData = program.milestones[currentMilestone]
    if (currentMilestoneData?.days) {
      for (let i = 0; i < currentDay && i < currentMilestoneData.days.length; i++) {
        const day = currentMilestoneData.days[i]
        if (day?.dayType === 'workout') {
          workoutDaysCompleted++
        } else if (day?.dayType === 'rest') {
          restDaysCompleted++
        }
      }
    }
  }

  return { workoutDaysCompleted, restDaysCompleted }
}

/**
 * Helper function to calculate day breakdown for a specific milestone
 */
export function calculateMilestoneDayBreakdown(
  program: Program,
  milestoneIndex: number,
): { workoutDays: number; restDays: number } {
  if (!program.milestones || milestoneIndex >= program.milestones.length || milestoneIndex < 0) {
    return { workoutDays: 0, restDays: 0 }
  }

  const milestone = program.milestones[milestoneIndex]
  if (!milestone?.days) {
    return { workoutDays: 0, restDays: 0 }
  }

  const workoutDays = milestone.days.filter((day) => day.dayType === 'workout').length
  const restDays = milestone.days.filter((day) => day.dayType === 'rest').length

  return { workoutDays, restDays }
}
