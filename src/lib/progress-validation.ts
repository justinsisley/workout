'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  validate: (context: ValidationContext) => Promise<ValidationResult>
}

export interface ValidationContext {
  currentUser: any
  currentProgram: any
  proposedChanges: {
    currentMilestone?: number
    currentDay?: number
    totalWorkoutsCompleted?: number
    lastWorkoutDate?: string
  }
  existingProgress: {
    currentMilestone: number
    currentDay: number
    totalWorkoutsCompleted: number
    lastWorkoutDate?: string
  }
  metadata?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  message?: string
  details?: Record<string, any>
}

export interface ComprehensiveValidationResult {
  isValid: boolean
  errors: Array<{
    ruleId: string
    message: string
    details?: Record<string, any>
  }>
  warnings: Array<{
    ruleId: string
    message: string
    details?: Record<string, any>
  }>
  info: Array<{
    ruleId: string
    message: string
    details?: Record<string, any>
  }>
  validationScore: number // 0-100, overall data integrity score
}

/**
 * Comprehensive progress validation system with multiple integrity checks
 */
export class ProgressValidator {
  private payload: any
  private validationRules: ValidationRule[]

  constructor() {
    this.validationRules = [
      {
        id: 'program-enrollment-check',
        name: 'Program Enrollment Validation',
        description: 'Validates user is enrolled in the program being updated',
        severity: 'error',
        validate: this.validateProgramEnrollment.bind(this),
      },
      {
        id: 'milestone-bounds-check',
        name: 'Milestone Bounds Validation',
        description: 'Validates milestone index is within program bounds',
        severity: 'error',
        validate: this.validateMilestoneBounds.bind(this),
      },
      {
        id: 'day-bounds-check',
        name: 'Day Bounds Validation',
        description: 'Validates day index is within milestone bounds',
        severity: 'error',
        validate: this.validateDayBounds.bind(this),
      },
      {
        id: 'progress-direction-check',
        name: 'Progress Direction Validation',
        description: 'Validates progress moves forward logically',
        severity: 'warning',
        validate: this.validateProgressDirection.bind(this),
      },
      {
        id: 'workout-count-consistency',
        name: 'Workout Count Consistency',
        description: 'Validates workout count matches expected progression',
        severity: 'warning',
        validate: this.validateWorkoutCountConsistency.bind(this),
      },
      {
        id: 'time-sequence-validation',
        name: 'Time Sequence Validation',
        description: 'Validates workout dates follow logical sequence',
        severity: 'warning',
        validate: this.validateTimeSequence.bind(this),
      },
      {
        id: 'exercise-completion-integrity',
        name: 'Exercise Completion Integrity',
        description: 'Validates exercise completions match progress state',
        severity: 'error',
        validate: this.validateExerciseCompletionIntegrity.bind(this),
      },
      {
        id: 'data-type-validation',
        name: 'Data Type Validation',
        description: 'Validates all data types and ranges are correct',
        severity: 'error',
        validate: this.validateDataTypes.bind(this),
      },
      {
        id: 'concurrent-update-check',
        name: 'Concurrent Update Detection',
        description: 'Detects potential conflicts from concurrent updates',
        severity: 'error',
        validate: this.validateConcurrentUpdates.bind(this),
      },
      {
        id: 'business-rule-validation',
        name: 'Business Rule Validation',
        description: 'Validates updates follow business logic rules',
        severity: 'warning',
        validate: this.validateBusinessRules.bind(this),
      },
    ]
  }

  async initialize(): Promise<void> {
    this.payload = await getPayload({ config: configPromise })
  }

  /**
   * Validate all aspects of a progress update
   */
  async validateProgressUpdate(context: ValidationContext): Promise<ComprehensiveValidationResult> {
    if (!this.payload) {
      await this.initialize()
    }

    const results: ComprehensiveValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      validationScore: 100,
    }

    let totalRules = 0
    let passedRules = 0

    // Execute all validation rules
    for (const rule of this.validationRules) {
      try {
        totalRules++
        const result = await rule.validate(context)

        if (result.isValid) {
          passedRules++
        } else {
          const validationIssue = {
            ruleId: rule.id,
            message: result.message || `${rule.name} failed`,
            ...(result.details && { details: result.details }),
          }

          switch (rule.severity) {
            case 'error':
              results.errors.push(validationIssue)
              results.isValid = false
              break
            case 'warning':
              results.warnings.push(validationIssue)
              break
            case 'info':
              results.info.push(validationIssue)
              passedRules++ // Info issues don't affect validation score
              break
          }
        }
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed to execute:`, error)
        results.errors.push({
          ruleId: rule.id,
          message: `Validation rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        results.isValid = false
      }
    }

    // Calculate validation score
    results.validationScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 0

    return results
  }

  /**
   * Validate user is enrolled in the specified program
   */
  private async validateProgramEnrollment(context: ValidationContext): Promise<ValidationResult> {
    if (!context.currentUser || !context.currentProgram) {
      return {
        isValid: false,
        message: 'Missing user or program context for enrollment validation',
      }
    }

    if (context.currentUser.currentProgram !== context.currentProgram.id) {
      return {
        isValid: false,
        message: `User is not enrolled in program ${context.currentProgram.id}`,
        details: {
          userProgram: context.currentUser.currentProgram,
          targetProgram: context.currentProgram.id,
        },
      }
    }

    return { isValid: true }
  }

  /**
   * Validate milestone index is within program bounds
   */
  private async validateMilestoneBounds(context: ValidationContext): Promise<ValidationResult> {
    if (context.proposedChanges.currentMilestone === undefined) {
      return { isValid: true } // No milestone change to validate
    }

    if (!context.currentProgram?.milestones || !Array.isArray(context.currentProgram.milestones)) {
      return {
        isValid: false,
        message: 'Program has no milestones for validation',
      }
    }

    const milestoneIndex = context.proposedChanges.currentMilestone
    if (milestoneIndex < 0 || milestoneIndex >= context.currentProgram.milestones.length) {
      return {
        isValid: false,
        message: `Milestone index ${milestoneIndex} is outside valid range (0-${context.currentProgram.milestones.length - 1})`,
        details: {
          proposedMilestone: milestoneIndex,
          maxMilestone: context.currentProgram.milestones.length - 1,
        },
      }
    }

    return { isValid: true }
  }

  /**
   * Validate day index is within milestone bounds
   */
  private async validateDayBounds(context: ValidationContext): Promise<ValidationResult> {
    if (context.proposedChanges.currentDay === undefined) {
      return { isValid: true } // No day change to validate
    }

    const milestoneIndex =
      context.proposedChanges.currentMilestone ?? context.existingProgress.currentMilestone
    const milestone = context.currentProgram?.milestones?.[milestoneIndex]

    if (!milestone?.days || !Array.isArray(milestone.days)) {
      return {
        isValid: false,
        message: `Milestone ${milestoneIndex} has no days for validation`,
        details: { milestoneIndex },
      }
    }

    const dayIndex = context.proposedChanges.currentDay
    if (dayIndex < 0 || dayIndex >= milestone.days.length) {
      return {
        isValid: false,
        message: `Day index ${dayIndex} is outside valid range (0-${milestone.days.length - 1}) for milestone ${milestoneIndex}`,
        details: {
          proposedDay: dayIndex,
          maxDay: milestone.days.length - 1,
          milestoneIndex,
        },
      }
    }

    return { isValid: true }
  }

  /**
   * Validate progress moves forward logically
   */
  private async validateProgressDirection(context: ValidationContext): Promise<ValidationResult> {
    const warnings: string[] = []

    // Check milestone progression
    if (context.proposedChanges.currentMilestone !== undefined) {
      if (context.proposedChanges.currentMilestone < context.existingProgress.currentMilestone) {
        warnings.push(
          `Milestone moving backwards from ${context.existingProgress.currentMilestone} to ${context.proposedChanges.currentMilestone}`,
        )
      }
    }

    // Check day progression within same milestone
    const proposedMilestone =
      context.proposedChanges.currentMilestone ?? context.existingProgress.currentMilestone
    if (
      context.proposedChanges.currentDay !== undefined &&
      proposedMilestone === context.existingProgress.currentMilestone
    ) {
      if (context.proposedChanges.currentDay < context.existingProgress.currentDay) {
        warnings.push(
          `Day moving backwards from ${context.existingProgress.currentDay} to ${context.proposedChanges.currentDay}`,
        )
      }
    }

    // Check workout count regression
    if (context.proposedChanges.totalWorkoutsCompleted !== undefined) {
      if (
        context.proposedChanges.totalWorkoutsCompleted <
        context.existingProgress.totalWorkoutsCompleted
      ) {
        warnings.push(
          `Total workouts decreasing from ${context.existingProgress.totalWorkoutsCompleted} to ${context.proposedChanges.totalWorkoutsCompleted}`,
        )
      }
    }

    return {
      isValid: warnings.length === 0,
      ...(warnings.length > 0 && { message: warnings.join('; ') }),
      details: { warnings },
    }
  }

  /**
   * Validate workout count matches expected progression
   */
  private async validateWorkoutCountConsistency(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    if (context.proposedChanges.totalWorkoutsCompleted === undefined) {
      return { isValid: true }
    }

    // Calculate expected workout count based on position
    const milestoneIndex =
      context.proposedChanges.currentMilestone ?? context.existingProgress.currentMilestone
    const dayIndex = context.proposedChanges.currentDay ?? context.existingProgress.currentDay

    let expectedWorkouts = 0

    // Count workout days in completed milestones
    for (let m = 0; m < milestoneIndex; m++) {
      const milestone = context.currentProgram?.milestones?.[m]
      if (milestone?.days) {
        expectedWorkouts += milestone.days.filter((day: any) => day.dayType === 'workout').length
      }
    }

    // Count workout days in current milestone up to current day
    const currentMilestone = context.currentProgram?.milestones?.[milestoneIndex]
    if (currentMilestone?.days) {
      for (let d = 0; d <= dayIndex; d++) {
        const day = currentMilestone.days[d]
        if (day?.dayType === 'workout') {
          expectedWorkouts++
        }
      }
    }

    const actualWorkouts = context.proposedChanges.totalWorkoutsCompleted
    const difference = Math.abs(expectedWorkouts - actualWorkouts)
    const tolerance = Math.max(2, Math.floor(expectedWorkouts * 0.1)) // 10% tolerance, minimum 2

    if (difference > tolerance) {
      return {
        isValid: false,
        message: `Workout count inconsistency: expected ~${expectedWorkouts}, got ${actualWorkouts} (difference: ${difference})`,
        details: {
          expectedWorkouts,
          actualWorkouts,
          difference,
          tolerance,
          currentPosition: { milestone: milestoneIndex, day: dayIndex },
        },
      }
    }

    return { isValid: true }
  }

  /**
   * Validate workout dates follow logical sequence
   */
  private async validateTimeSequence(context: ValidationContext): Promise<ValidationResult> {
    if (!context.proposedChanges.lastWorkoutDate || !context.existingProgress.lastWorkoutDate) {
      return { isValid: true } // No date to validate
    }

    const existingDate = new Date(context.existingProgress.lastWorkoutDate)
    const proposedDate = new Date(context.proposedChanges.lastWorkoutDate)
    const now = new Date()

    // Check if proposed date is in the future
    if (proposedDate > now) {
      return {
        isValid: false,
        message: `Last workout date cannot be in the future: ${proposedDate.toISOString()}`,
        details: {
          proposedDate: proposedDate.toISOString(),
          currentDate: now.toISOString(),
        },
      }
    }

    // Check if proposed date is significantly before existing date (more than 7 days)
    const daysDifference = (existingDate.getTime() - proposedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDifference > 7) {
      return {
        isValid: false,
        message: `Last workout date moving too far backwards: ${daysDifference.toFixed(1)} days`,
        details: {
          existingDate: existingDate.toISOString(),
          proposedDate: proposedDate.toISOString(),
          daysDifference,
        },
      }
    }

    return { isValid: true }
  }

  /**
   * Validate exercise completions match progress state
   */
  private async validateExerciseCompletionIntegrity(
    context: ValidationContext,
  ): Promise<ValidationResult> {
    try {
      // Query exercise completions for the user and program
      const exerciseCompletions = await this.payload.find({
        collection: 'exerciseCompletions',
        where: {
          and: [
            { productUser: { equals: context.currentUser.id } },
            { program: { equals: context.currentProgram.id } },
          ],
        },
        limit: 1000,
      })

      const completions = exerciseCompletions.docs || []
      const milestoneIndex =
        context.proposedChanges.currentMilestone ?? context.existingProgress.currentMilestone
      const dayIndex = context.proposedChanges.currentDay ?? context.existingProgress.currentDay

      // Count unique workout days that have completions
      const completedWorkoutDays = new Set(
        completions.map((completion: any) => `${completion.milestoneIndex}-${completion.dayIndex}`),
      )

      // Calculate expected completed days based on progress
      let expectedCompletedDays = 0
      for (let m = 0; m < milestoneIndex; m++) {
        const milestone = context.currentProgram?.milestones?.[m]
        if (milestone?.days) {
          expectedCompletedDays += milestone.days.filter(
            (day: any) => day.dayType === 'workout',
          ).length
        }
      }

      // Add completed days from current milestone
      const currentMilestone = context.currentProgram?.milestones?.[milestoneIndex]
      if (currentMilestone?.days) {
        for (let d = 0; d < dayIndex; d++) {
          // Note: < dayIndex, not <=, as current day might be in progress
          const day = currentMilestone.days[d]
          if (day?.dayType === 'workout') {
            expectedCompletedDays++
          }
        }
      }

      const actualCompletedDays = completedWorkoutDays.size
      const difference = Math.abs(expectedCompletedDays - actualCompletedDays)

      if (difference > 2) {
        // Allow some tolerance for partial completions
        return {
          isValid: false,
          message: `Exercise completion inconsistency: expected ~${expectedCompletedDays} completed days, found ${actualCompletedDays}`,
          details: {
            expectedCompletedDays,
            actualCompletedDays,
            difference,
            currentPosition: { milestone: milestoneIndex, day: dayIndex },
          },
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Exercise completion integrity validation failed:', error)
      return {
        isValid: false,
        message: 'Failed to validate exercise completion integrity',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      }
    }
  }

  /**
   * Validate all data types and ranges are correct
   */
  private async validateDataTypes(context: ValidationContext): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate milestone index
    if (context.proposedChanges.currentMilestone !== undefined) {
      if (
        !Number.isInteger(context.proposedChanges.currentMilestone) ||
        context.proposedChanges.currentMilestone < 0
      ) {
        errors.push('Milestone index must be a non-negative integer')
      }
    }

    // Validate day index
    if (context.proposedChanges.currentDay !== undefined) {
      if (
        !Number.isInteger(context.proposedChanges.currentDay) ||
        context.proposedChanges.currentDay < 0
      ) {
        errors.push('Day index must be a non-negative integer')
      }
    }

    // Validate total workouts
    if (context.proposedChanges.totalWorkoutsCompleted !== undefined) {
      if (
        !Number.isInteger(context.proposedChanges.totalWorkoutsCompleted) ||
        context.proposedChanges.totalWorkoutsCompleted < 0
      ) {
        errors.push('Total workouts completed must be a non-negative integer')
      }
      if (context.proposedChanges.totalWorkoutsCompleted > 10000) {
        errors.push('Total workouts completed exceeds reasonable maximum (10000)')
      }
    }

    // Validate date format
    if (context.proposedChanges.lastWorkoutDate !== undefined) {
      try {
        const date = new Date(context.proposedChanges.lastWorkoutDate)
        if (isNaN(date.getTime())) {
          errors.push('Last workout date is not a valid date')
        }
      } catch {
        errors.push('Last workout date format is invalid')
      }
    }

    return {
      isValid: errors.length === 0,
      ...(errors.length > 0 && { message: errors.join('; ') }),
      details: { errors },
    }
  }

  /**
   * Detect potential conflicts from concurrent updates
   */
  private async validateConcurrentUpdates(context: ValidationContext): Promise<ValidationResult> {
    try {
      // Get the most recent user data from database
      const currentUserData = await this.payload.findByID({
        collection: 'productUsers',
        id: context.currentUser.id,
      })

      if (!currentUserData) {
        return {
          isValid: false,
          message: 'User data not found for concurrent update validation',
        }
      }

      // Check if existing progress in context matches database
      const dbProgress = {
        currentMilestone: currentUserData.currentMilestone,
        currentDay: currentUserData.currentDay,
        totalWorkoutsCompleted: currentUserData.totalWorkoutsCompleted || 0,
        lastWorkoutDate: currentUserData.lastWorkoutDate,
      }

      const contextProgress = context.existingProgress

      if (
        dbProgress.currentMilestone !== contextProgress.currentMilestone ||
        dbProgress.currentDay !== contextProgress.currentDay ||
        dbProgress.totalWorkoutsCompleted !== contextProgress.totalWorkoutsCompleted
      ) {
        return {
          isValid: false,
          message:
            'Concurrent update detected - user progress has been modified by another session',
          details: {
            databaseState: dbProgress,
            contextState: contextProgress,
            conflicts: {
              milestone: dbProgress.currentMilestone !== contextProgress.currentMilestone,
              day: dbProgress.currentDay !== contextProgress.currentDay,
              workouts:
                dbProgress.totalWorkoutsCompleted !== contextProgress.totalWorkoutsCompleted,
            },
          },
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Concurrent update validation failed:', error)
      return {
        isValid: false,
        message: 'Failed to check for concurrent updates',
      }
    }
  }

  /**
   * Validate updates follow business logic rules
   */
  private async validateBusinessRules(context: ValidationContext): Promise<ValidationResult> {
    const warnings: string[] = []

    // Business Rule: Cannot skip more than one milestone at a time
    if (context.proposedChanges.currentMilestone !== undefined) {
      const milestoneJump =
        context.proposedChanges.currentMilestone - context.existingProgress.currentMilestone
      if (milestoneJump > 1) {
        warnings.push(
          `Skipping ${milestoneJump} milestones in one update - consider progressive advancement`,
        )
      }
    }

    // Business Rule: Cannot skip more than 3 days at a time within a milestone
    if (context.proposedChanges.currentDay !== undefined) {
      const milestoneIndex =
        context.proposedChanges.currentMilestone ?? context.existingProgress.currentMilestone
      if (milestoneIndex === context.existingProgress.currentMilestone) {
        const dayJump = context.proposedChanges.currentDay - context.existingProgress.currentDay
        if (dayJump > 3) {
          warnings.push(
            `Skipping ${dayJump} days in one update - consider progressive daily advancement`,
          )
        }
      }
    }

    // Business Rule: Workout completion rate should be reasonable
    if (
      context.proposedChanges.totalWorkoutsCompleted !== undefined &&
      context.proposedChanges.lastWorkoutDate
    ) {
      const workoutIncrease =
        context.proposedChanges.totalWorkoutsCompleted -
        context.existingProgress.totalWorkoutsCompleted
      const lastWorkout = context.existingProgress.lastWorkoutDate

      if (workoutIncrease > 0 && lastWorkout) {
        const timeDiff =
          new Date(context.proposedChanges.lastWorkoutDate).getTime() -
          new Date(lastWorkout).getTime()
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
        const workoutsPerDay = workoutIncrease / Math.max(daysDiff, 1)

        if (workoutsPerDay > 3) {
          warnings.push(
            `High workout frequency detected: ${workoutsPerDay.toFixed(1)} workouts per day over ${daysDiff.toFixed(1)} days`,
          )
        }
      }
    }

    return {
      isValid: warnings.length === 0,
      ...(warnings.length > 0 && { message: warnings.join('; ') }),
      details: { warnings },
    }
  }

  /**
   * Add a custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule)
  }

  /**
   * Remove a validation rule by ID
   */
  removeValidationRule(ruleId: string): boolean {
    const index = this.validationRules.findIndex((rule) => rule.id === ruleId)
    if (index >= 0) {
      this.validationRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get all validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.validationRules]
  }
}

// Global validator instance
let globalValidator: ProgressValidator | null = null

/**
 * Get or create the global progress validator instance
 */
export async function getProgressValidator(): Promise<ProgressValidator> {
  if (!globalValidator) {
    globalValidator = new ProgressValidator()
    await globalValidator.initialize()
  }
  return globalValidator
}

/**
 * Quick validation function for simple progress updates
 */
export async function validateProgressUpdate(
  context: ValidationContext,
): Promise<ComprehensiveValidationResult> {
  const validator = await getProgressValidator()
  return validator.validateProgressUpdate(context)
}
