import { describe, it, expect } from 'vitest'
import {
  validateUserProgress,
  isValidProgressPosition,
  getProgressErrorMessage,
  getRepairInstructions,
  usernameSchema,
  passkeyCredentialSchema,
  exerciseCompletionSchema,
  workoutDataEntrySchema,
  amrapDataEntrySchema,
  validateWorkoutField,
  validateAmrapField,
  validateWorkoutDataEntry,
  validateAmrapDataEntry,
  sanitizeWorkoutInput,
  programAssignmentSchema,
  type ProgressValidationError,
  type ProgressRepairAction,
  type WorkoutDataEntryData,
  type AmrapDataEntryData,
} from '@/utils/validation'
import type { Program, UserProgress } from '@/types/program'

// Mock programs for testing
const mockProgram: Program = {
  id: 'test-program',
  name: 'Test Program',
  description: 'Test description',
  objective: 'Test objective',
  isPublished: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  milestones: [
    {
      id: 'milestone-1',
      name: 'Milestone 1',
      theme: 'Foundation',
      objective: 'Build foundation',
      days: [
        {
          id: 'day-1',
          dayType: 'workout',
          exercises: [{ id: 'ex1', exercise: 'push-ups', sets: 3, reps: 10 }],
        },
        { id: 'day-2', dayType: 'rest', restNotes: 'Rest day' },
        {
          id: 'day-3',
          dayType: 'workout',
          exercises: [{ id: 'ex2', exercise: 'squats', sets: 3, reps: 15 }],
        },
      ],
    },
    {
      id: 'milestone-2',
      name: 'Milestone 2',
      theme: 'Progression',
      objective: 'Build strength',
      days: [
        {
          id: 'day-4',
          dayType: 'workout',
          exercises: [{ id: 'ex3', exercise: 'pull-ups', sets: 3, reps: 8 }],
        },
        {
          id: 'day-5',
          dayType: 'workout',
          exercises: [{ id: 'ex4', exercise: 'deadlifts', sets: 3, reps: 12 }],
        },
      ],
    },
  ],
}

const unpublishedProgram: Program = {
  ...mockProgram,
  id: 'unpublished-program',
  isPublished: false,
}

const invalidProgram: Program = {
  ...mockProgram,
  id: 'invalid-program',
  milestones: [
    {
      id: 'invalid-milestone',
      name: 'Invalid Milestone',
      theme: 'Invalid',
      objective: 'Invalid',
      days: [], // Empty days array
    },
  ],
}

const corruptProgram: Program = {
  ...mockProgram,
  id: 'corrupt-program',
  milestones: [
    {
      id: 'corrupt-milestone',
      name: 'Corrupt Milestone',
      theme: 'Corrupt',
      objective: 'Corrupt',
      days: [
        { id: 'corrupt-day', dayType: 'workout' as const, exercises: [] }, // No exercises for workout day
      ],
    },
  ],
}

describe('Progress Validation Utilities', () => {
  describe('validateUserProgress', () => {
    it('should validate correct progress', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 1,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.canBeRepaired).toBe(false)
      expect(result.repairActions).toHaveLength(0)
    })

    it('should detect program not found', () => {
      const userProgress: UserProgress = {
        currentProgram: 'nonexistent',
        currentMilestone: 0,
        currentDay: 0,
      }

      const result = validateUserProgress(null, userProgress, 'nonexistent')

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'program_not_found',
        message: 'Program with ID nonexistent not found',
        userFriendlyMessage: 'Your selected program is no longer available.',
        suggested_action: 'Please choose a new program from the available options.',
        can_auto_repair: false,
      })
      expect(result.canBeRepaired).toBe(true)
      expect(result.repairActions).toHaveLength(1)
      expect(result.repairActions[0]?.type).toBe('assign_new_program')
    })

    it('should warn about unpublished program', () => {
      const userProgress: UserProgress = {
        currentProgram: 'unpublished-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const result = validateUserProgress(unpublishedProgram, userProgress, 'unpublished-program')

      expect(result.isValid).toBe(true) // Valid structure, just unpublished
      expect(result.warnings.length).toBeGreaterThanOrEqual(1)
      expect(result.warnings.some((w) => w.type === 'program_unpublished')).toBe(true)
    })

    it('should detect invalid program structure', () => {
      const userProgress: UserProgress = {
        currentProgram: 'invalid-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const result = validateUserProgress(invalidProgram, userProgress, 'invalid-program')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'program_structure_changed',
          userFriendlyMessage:
            'Your current program has been updated and may have structural changes.',
          can_auto_repair: true,
        }),
      )
      expect(result.canBeRepaired).toBe(true)
      expect(result.repairActions).toContainEqual(
        expect.objectContaining({
          type: 'reset_to_start',
          newMilestone: 0,
          newDay: 0,
        }),
      )
    })

    it('should detect negative milestone index', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: -1,
        currentDay: 0,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'milestone_index_invalid',
          message: expect.stringContaining('milestone index cannot be negative'),
          userFriendlyMessage: "There's an issue with your current progress position.",
          can_auto_repair: true,
        }),
      )
      expect(result.canBeRepaired).toBe(true)
    })

    it('should detect negative day index', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: -1,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'day_index_invalid',
          message: expect.stringContaining('day index cannot be negative'),
          can_auto_repair: true,
        }),
      )
    })

    it('should detect milestone index exceeding bounds', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 5,
        currentDay: 0,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'milestone_index_invalid',
          message: expect.stringContaining('milestone index (5) exceeds'),
          suggested_action: 'Your progress appears to be corrupted and will be corrected.',
        }),
      )
      expect(result.canBeRepaired).toBe(true)
    })

    it('should detect day index exceeding bounds', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 0,
        currentDay: 10,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'day_index_invalid',
          message: expect.stringContaining('day index (10) exceeds'),
        }),
      )
    })

    it('should allow valid program completion state', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 2, // Beyond last milestone indicates completion
        currentDay: 0,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should generate repair actions for corrupted progress', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 1,
        currentDay: 10, // Beyond bounds
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.canBeRepaired).toBe(true)
      expect(result.repairActions).toHaveLength(1)
      expect(result.repairActions[0]).toMatchObject({
        type: 'adjust_to_valid_position',
        description: 'Adjust progress to nearest valid position',
        newMilestone: 1,
        newDay: 1, // Last valid day in milestone 1
      })
    })

    it('should fall back to reset when repair not possible', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: -5, // Extremely invalid
        currentDay: -10, // Extremely invalid
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.canBeRepaired).toBe(true)
      expect(result.repairActions).toContainEqual(
        expect.objectContaining({
          type: 'adjust_to_valid_position',
          newMilestone: 0,
          newDay: 0,
        }),
      )
    })

    it('should provide context information in errors', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 3,
        currentDay: 0,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.errors[0]?.context).toEqual({
        currentMilestone: 3,
        currentDay: 0,
        totalMilestones: 2,
      })
    })
  })

  describe('isValidProgressPosition', () => {
    it('should validate correct position', () => {
      expect(isValidProgressPosition(mockProgram, 0, 1)).toBe(true)
      expect(isValidProgressPosition(mockProgram, 1, 0)).toBe(true)
    })

    it('should reject negative milestone', () => {
      expect(isValidProgressPosition(mockProgram, -1, 0)).toBe(false)
    })

    it('should reject negative day', () => {
      expect(isValidProgressPosition(mockProgram, 0, -1)).toBe(false)
    })

    it('should reject milestone beyond bounds', () => {
      expect(isValidProgressPosition(mockProgram, 5, 0)).toBe(false)
    })

    it('should reject day beyond milestone bounds', () => {
      expect(isValidProgressPosition(mockProgram, 0, 10)).toBe(false)
    })

    it('should handle empty program', () => {
      const emptyProgram: Program = {
        ...mockProgram,
        milestones: [],
      }
      expect(isValidProgressPosition(emptyProgram, 0, 0)).toBe(false)
    })

    it('should handle milestone without days', () => {
      const programWithEmptyMilestone: Program = {
        ...mockProgram,
        milestones: [
          {
            id: 'empty-milestone',
            name: 'Empty',
            theme: 'Empty',
            objective: 'Empty',
            days: [],
          },
        ],
      }
      expect(isValidProgressPosition(programWithEmptyMilestone, 0, 0)).toBe(false)
    })
  })

  describe('getProgressErrorMessage', () => {
    it('should return empty string for no errors', () => {
      expect(getProgressErrorMessage([])).toBe('')
    })

    it('should prioritize critical errors', () => {
      const errors: ProgressValidationError[] = [
        {
          type: 'day_index_invalid',
          message: 'Day invalid',
          userFriendlyMessage: 'Day error',
          suggested_action: 'Fix day',
          can_auto_repair: true,
        },
        {
          type: 'program_not_found',
          message: 'Program not found',
          userFriendlyMessage: 'Critical program error',
          suggested_action: 'Get new program',
          can_auto_repair: false,
        },
      ]

      expect(getProgressErrorMessage(errors)).toBe('Critical program error')
    })

    it('should return first error if none are critical', () => {
      const errors: ProgressValidationError[] = [
        {
          type: 'day_index_invalid',
          message: 'Day invalid',
          userFriendlyMessage: 'First error message',
          suggested_action: 'Fix day',
          can_auto_repair: true,
        },
        {
          type: 'milestone_index_invalid',
          message: 'Milestone invalid',
          userFriendlyMessage: 'Second error message',
          suggested_action: 'Fix milestone',
          can_auto_repair: true,
        },
      ]

      expect(getProgressErrorMessage(errors)).toBe('First error message')
    })
  })

  describe('getRepairInstructions', () => {
    it('should return empty string for no repair actions', () => {
      expect(getRepairInstructions([])).toBe('')
    })

    it('should provide reset instructions', () => {
      const repairActions: ProgressRepairAction[] = [
        {
          type: 'reset_to_start',
          description: 'Reset to start',
          newMilestone: 0,
          newDay: 0,
        },
      ]

      expect(getRepairInstructions(repairActions)).toBe(
        'Your progress will be reset to the beginning of your program.',
      )
    })

    it('should provide adjustment instructions', () => {
      const repairActions: ProgressRepairAction[] = [
        {
          type: 'adjust_to_valid_position',
          description: 'Adjust position',
          newMilestone: 1,
          newDay: 2,
        },
      ]

      expect(getRepairInstructions(repairActions)).toBe(
        'Your progress will be adjusted to the nearest valid position.',
      )
    })

    it('should provide new program instructions', () => {
      const repairActions: ProgressRepairAction[] = [
        {
          type: 'assign_new_program',
          description: 'Select new program',
        },
      ]

      expect(getRepairInstructions(repairActions)).toBe(
        'Please select a new program to continue your fitness journey.',
      )
    })

    it('should handle unknown repair action types', () => {
      const repairActions: ProgressRepairAction[] = [
        {
          type: 'unknown_type' as any,
          description: 'Unknown action',
        },
      ]

      expect(getRepairInstructions(repairActions)).toBe(
        'Your progress will be automatically corrected.',
      )
    })
  })

  describe('Schema Validations', () => {
    describe('usernameSchema', () => {
      it('should validate correct usernames', () => {
        expect(usernameSchema.parse('validuser')).toBe('validuser')
        expect(usernameSchema.parse('user_123')).toBe('user_123')
        expect(usernameSchema.parse('User123')).toBe('User123')
      })

      it('should reject short usernames', () => {
        expect(() => usernameSchema.parse('ab')).toThrow('Username must be at least 3 characters')
      })

      it('should reject long usernames', () => {
        expect(() => usernameSchema.parse('a'.repeat(21))).toThrow(
          'Username must be no more than 20 characters',
        )
      })

      it('should reject usernames with special characters', () => {
        expect(() => usernameSchema.parse('user@name')).toThrow(
          'Username can only contain letters, numbers, and underscores',
        )
        expect(() => usernameSchema.parse('user-name')).toThrow(
          'Username can only contain letters, numbers, and underscores',
        )
      })
    })

    describe('passkeyCredentialSchema', () => {
      it('should validate correct passkey credentials', () => {
        const validCredential = {
          credentialID: 'cred123',
          publicKey: 'pubkey456',
          counter: 1,
          deviceType: 'platform',
          backedUp: true,
          transports: ['usb', 'nfc'],
        }

        expect(passkeyCredentialSchema.parse(validCredential)).toEqual(validCredential)
      })

      it('should set default values for optional fields', () => {
        const minimalCredential = {
          credentialID: 'cred123',
          publicKey: 'pubkey456',
          counter: 1,
        }

        const result = passkeyCredentialSchema.parse(minimalCredential)
        expect(result.backedUp).toBe(false) // Default value
      })

      it('should reject invalid credential data', () => {
        // Missing required fields should throw
        expect(() =>
          passkeyCredentialSchema.parse({
            counter: 1,
          }),
        ).toThrow() // Missing credentialID and publicKey

        expect(() =>
          passkeyCredentialSchema.parse({
            credentialID: 'cred123',
          }),
        ).toThrow() // Missing publicKey and counter

        expect(() =>
          passkeyCredentialSchema.parse({
            credentialID: 'cred123',
            publicKey: 'pubkey456',
            counter: 'invalid',
          }),
        ).toThrow() // Invalid counter type
      })
    })

    describe('exerciseCompletionSchema', () => {
      it('should validate correct exercise completion data', () => {
        const validCompletion = {
          sets: 3,
          reps: 10,
          weight: 135.5,
          time: 300,
          notes: 'Great workout!',
        }

        expect(exerciseCompletionSchema.parse(validCompletion)).toEqual(validCompletion)
      })

      it('should reject invalid values', () => {
        expect(() =>
          exerciseCompletionSchema.parse({
            sets: 0,
            reps: 10,
          }),
        ).toThrow('Sets must be at least 1')

        expect(() =>
          exerciseCompletionSchema.parse({
            sets: 3,
            reps: 0,
          }),
        ).toThrow('Reps must be at least 1')

        expect(() =>
          exerciseCompletionSchema.parse({
            sets: 3,
            reps: 10,
            weight: -5,
          }),
        ).toThrow()

        expect(() =>
          exerciseCompletionSchema.parse({
            sets: 3,
            reps: 10,
            time: -30,
          }),
        ).toThrow()
      })
    })

    describe('programAssignmentSchema', () => {
      it('should validate correct assignment data', () => {
        const validAssignment = {
          programId: 'program123',
          productUserId: 'user456',
        }

        expect(programAssignmentSchema.parse(validAssignment)).toEqual(validAssignment)
      })

      it('should reject empty values', () => {
        expect(() =>
          programAssignmentSchema.parse({
            programId: '',
            productUserId: 'user456',
          }),
        ).toThrow('Program ID is required')

        expect(() =>
          programAssignmentSchema.parse({
            programId: 'program123',
            productUserId: '',
          }),
        ).toThrow('Product User ID is required')
      })
    })
  })

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle multiple validation errors', () => {
      const userProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: -1,
        currentDay: -1,
      }

      const result = validateUserProgress(mockProgram, userProgress, 'test-program')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors.some((e) => e.type === 'milestone_index_invalid')).toBe(true)
      expect(result.errors.some((e) => e.type === 'day_index_invalid')).toBe(true)
    })

    it('should handle programs with milestone structural issues', () => {
      const userProgress: UserProgress = {
        currentProgram: 'corrupt-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const result = validateUserProgress(corruptProgram, userProgress, 'corrupt-program')

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.type === 'program_structure_changed')).toBe(true)
    })

    it('should provide different repair strategies based on error type', () => {
      // Test repair for position beyond program bounds
      const beyondBoundsProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 10,
        currentDay: 5,
      }

      const beyondResult = validateUserProgress(mockProgram, beyondBoundsProgress, 'test-program')
      expect(beyondResult.repairActions[0]?.type).toBe('adjust_to_valid_position')

      // Test repair for structural issues
      const structuralProgress: UserProgress = {
        currentProgram: 'invalid-program',
        currentMilestone: 0,
        currentDay: 0,
      }

      const structuralResult = validateUserProgress(
        invalidProgram,
        structuralProgress,
        'invalid-program',
      )
      expect(structuralResult.repairActions.some((a) => a.type === 'reset_to_start')).toBe(true)
    })

    it('should handle boundary conditions correctly', () => {
      // Test exactly at program completion
      const completionProgress: UserProgress = {
        currentProgram: 'test-program',
        currentMilestone: 2,
        currentDay: 0,
      }

      const result = validateUserProgress(mockProgram, completionProgress, 'test-program')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Enhanced Workout Data Validation', () => {
    describe('workoutDataEntrySchema', () => {
      it('should validate correct workout data', () => {
        const validData: WorkoutDataEntryData = {
          sets: 3,
          reps: 10,
          notes: 'Great workout!',
          weight: 135.5,
          time: 300,
          distance: 5.2,
          distanceUnit: 'miles',
          timeUnit: 'minutes',
        }

        expect(workoutDataEntrySchema.parse(validData)).toEqual(validData)
      })

      it('should validate minimal workout data', () => {
        const minimalData: WorkoutDataEntryData = {
          sets: 1,
          reps: 1,
          notes: '',
        }

        expect(workoutDataEntrySchema.parse(minimalData)).toEqual(minimalData)
      })

      it('should reject invalid sets values', () => {
        expect(() => workoutDataEntrySchema.parse({ sets: 0, reps: 10, notes: '' })).toThrow(
          'Sets must be at least 1',
        )

        expect(() => workoutDataEntrySchema.parse({ sets: 100, reps: 10, notes: '' })).toThrow(
          'Sets cannot exceed 99',
        )

        expect(() => workoutDataEntrySchema.parse({ sets: 1.5, reps: 10, notes: '' })).toThrow(
          'Sets must be a whole number',
        )
      })

      it('should reject invalid reps values', () => {
        expect(() => workoutDataEntrySchema.parse({ sets: 3, reps: 0, notes: '' })).toThrow(
          'Reps must be at least 1',
        )

        expect(() => workoutDataEntrySchema.parse({ sets: 3, reps: 1000, notes: '' })).toThrow(
          'Reps cannot exceed 999',
        )

        expect(() => workoutDataEntrySchema.parse({ sets: 3, reps: 10.5, notes: '' })).toThrow(
          'Reps must be a whole number',
        )
      })

      it('should reject invalid weight values', () => {
        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', weight: -1 }),
        ).toThrow('Weight cannot be negative')

        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', weight: 1001 }),
        ).toThrow('Weight cannot exceed 1000 lbs')
      })

      it('should reject invalid time values', () => {
        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', time: -1 }),
        ).toThrow('Time cannot be negative')

        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', time: 1000 }),
        ).toThrow('Time cannot exceed 999')
      })

      it('should reject invalid distance values', () => {
        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', distance: -1 }),
        ).toThrow('Distance cannot be negative')

        expect(() =>
          workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: '', distance: 1000 }),
        ).toThrow('Distance cannot exceed 999')
      })

      it('should reject long notes', () => {
        const longNotes = 'x'.repeat(501)
        expect(() => workoutDataEntrySchema.parse({ sets: 3, reps: 10, notes: longNotes })).toThrow(
          'Notes cannot exceed 500 characters',
        )
      })

      it('should validate enum values for units', () => {
        expect(() =>
          workoutDataEntrySchema.parse({
            sets: 3,
            reps: 10,
            notes: '',
            distanceUnit: 'kilometers' as any,
          }),
        ).toThrow()

        expect(() =>
          workoutDataEntrySchema.parse({
            sets: 3,
            reps: 10,
            notes: '',
            timeUnit: 'days' as any,
          }),
        ).toThrow()
      })
    })

    describe('amrapDataEntrySchema', () => {
      it('should validate correct AMRAP data', () => {
        const validData: AmrapDataEntryData = {
          totalRounds: 5,
          partialRoundExercises: [
            { exerciseId: 'ex1', reps: 10 },
            { exerciseId: 'ex2', reps: 15 },
          ],
          notes: 'Solid AMRAP session!',
        }

        expect(amrapDataEntrySchema.parse(validData)).toEqual(validData)
      })

      it('should validate minimal AMRAP data', () => {
        const minimalData: AmrapDataEntryData = {
          totalRounds: 0,
        }

        expect(amrapDataEntrySchema.parse(minimalData)).toEqual(minimalData)
      })

      it('should reject invalid total rounds', () => {
        expect(() => amrapDataEntrySchema.parse({ totalRounds: -1 })).toThrow(
          'Total rounds cannot be negative',
        )

        expect(() => amrapDataEntrySchema.parse({ totalRounds: 100 })).toThrow(
          'Total rounds cannot exceed 99',
        )

        expect(() => amrapDataEntrySchema.parse({ totalRounds: 5.5 })).toThrow(
          'Total rounds must be a whole number',
        )
      })

      it('should validate partial round exercises', () => {
        const validData = {
          totalRounds: 3,
          partialRoundExercises: [
            { exerciseId: 'ex1', reps: 10 },
            { exerciseId: 'ex2', reps: 0 },
          ],
        }

        expect(amrapDataEntrySchema.parse(validData)).toEqual(validData)
      })

      it('should reject invalid partial round data', () => {
        expect(() =>
          amrapDataEntrySchema.parse({
            totalRounds: 3,
            partialRoundExercises: [{ exerciseId: '', reps: 10 }],
          }),
        ).toThrow('Exercise ID is required')

        expect(() =>
          amrapDataEntrySchema.parse({
            totalRounds: 3,
            partialRoundExercises: [{ exerciseId: 'ex1', reps: -1 }],
          }),
        ).toThrow('Partial round reps cannot be negative')

        expect(() =>
          amrapDataEntrySchema.parse({
            totalRounds: 3,
            partialRoundExercises: [{ exerciseId: 'ex1', reps: 1000 }],
          }),
        ).toThrow('Partial round reps cannot exceed 999')

        expect(() =>
          amrapDataEntrySchema.parse({
            totalRounds: 3,
            partialRoundExercises: [{ exerciseId: 'ex1', reps: 10.5 }],
          }),
        ).toThrow('Partial round reps must be a whole number')
      })
    })

    describe('validateWorkoutField', () => {
      it('should validate individual workout fields correctly', () => {
        expect(validateWorkoutField('sets', 3)).toBeNull()
        expect(validateWorkoutField('reps', 10)).toBeNull()
        expect(validateWorkoutField('weight', 135.5)).toBeNull()
        expect(validateWorkoutField('time', 300)).toBeNull()
        expect(validateWorkoutField('distance', 5.2)).toBeNull()
        expect(validateWorkoutField('notes', 'Good workout')).toBeNull()
      })

      it('should return errors for invalid field values', () => {
        expect(validateWorkoutField('sets', 0)).toBe('Sets must be at least 1')
        expect(validateWorkoutField('sets', 100)).toBe('Sets cannot exceed 99')
        expect(validateWorkoutField('reps', 0)).toBe('Reps must be at least 1')
        expect(validateWorkoutField('reps', 1000)).toBe('Reps cannot exceed 999')
        expect(validateWorkoutField('weight', -1)).toBe('Weight cannot be negative')
        expect(validateWorkoutField('weight', 1001)).toBe('Weight cannot exceed 1000 lbs')
        expect(validateWorkoutField('time', -1)).toBe('Time cannot be negative')
        expect(validateWorkoutField('distance', 1000)).toBe('Distance cannot exceed 999')
        expect(validateWorkoutField('notes', 'x'.repeat(501))).toBe(
          'Notes cannot exceed 500 characters',
        )
      })

      it('should handle optional fields correctly', () => {
        expect(validateWorkoutField('weight', undefined)).toBeNull()
        expect(validateWorkoutField('weight', null)).toBeNull()
        expect(validateWorkoutField('weight', '')).toBeNull()
        expect(validateWorkoutField('time', undefined)).toBeNull()
        expect(validateWorkoutField('distance', undefined)).toBeNull()
      })

      it('should handle unit fields correctly', () => {
        expect(validateWorkoutField('distanceUnit', 'miles')).toBeNull()
        expect(validateWorkoutField('timeUnit', 'minutes')).toBeNull()
      })
    })

    describe('validateAmrapField', () => {
      it('should validate AMRAP fields correctly', () => {
        expect(validateAmrapField('totalRounds', 5)).toBeNull()
        expect(validateAmrapField('notes', 'Great AMRAP session')).toBeNull()
      })

      it('should return errors for invalid AMRAP values', () => {
        expect(validateAmrapField('totalRounds', -1)).toBe('Total rounds cannot be negative')
        expect(validateAmrapField('totalRounds', 100)).toBe('Total rounds cannot exceed 99')
        expect(validateAmrapField('notes', 'x'.repeat(501))).toBe(
          'Notes cannot exceed 500 characters',
        )
      })

      it('should handle optional fields correctly', () => {
        expect(validateAmrapField('notes', undefined)).toBeNull()
        expect(validateAmrapField('notes', null)).toBeNull()
      })

      it('should handle partial round exercises field', () => {
        expect(validateAmrapField('partialRoundExercises', [])).toBeNull()
      })
    })

    describe('validateWorkoutDataEntry', () => {
      it('should validate complete workout forms', () => {
        const validData: WorkoutDataEntryData = {
          sets: 3,
          reps: 10,
          notes: 'Great workout!',
          weight: 135,
          time: 60,
          distance: 5,
          distanceUnit: 'miles',
          timeUnit: 'minutes',
        }

        const result = validateWorkoutDataEntry(validData)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
      })

      it('should return validation errors for invalid data', () => {
        const invalidData = {
          sets: 0,
          reps: 1000,
          notes: 'x'.repeat(501),
          weight: -1,
          time: 1000,
          distance: -5,
        }

        const result = validateWorkoutDataEntry(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors).toMatchObject({
          sets: 'Sets must be at least 1',
          reps: 'Reps cannot exceed 999',
          notes: 'Notes cannot exceed 500 characters',
          weight: 'Weight cannot be negative',
          time: 'Time cannot exceed 999',
          distance: 'Distance cannot be negative',
        })
      })

      it('should handle mixed valid and invalid data', () => {
        const mixedData = {
          sets: 3,
          reps: 0,
          notes: 'Valid note',
          weight: 135,
        }

        const result = validateWorkoutDataEntry(mixedData)
        expect(result.isValid).toBe(false)
        expect(result.errors).toEqual({
          reps: 'Reps must be at least 1',
        })
      })
    })

    describe('validateAmrapDataEntry', () => {
      it('should validate complete AMRAP forms', () => {
        const validData: AmrapDataEntryData = {
          totalRounds: 5,
          partialRoundExercises: [
            { exerciseId: 'ex1', reps: 10 },
            { exerciseId: 'ex2', reps: 15 },
          ],
          notes: 'Excellent AMRAP!',
        }

        const result = validateAmrapDataEntry(validData)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
      })

      it('should return validation errors for invalid AMRAP data', () => {
        const invalidData = {
          totalRounds: -1,
          partialRoundExercises: [
            { exerciseId: '', reps: 10 },
            { exerciseId: 'ex2', reps: -5 },
          ],
          notes: 'x'.repeat(501),
        }

        const result = validateAmrapDataEntry(invalidData)
        expect(result.isValid).toBe(false)
        expect(Object.keys(result.errors).length).toBeGreaterThan(0)
      })
    })

    describe('sanitizeWorkoutInput', () => {
      it('should sanitize string inputs', () => {
        expect(sanitizeWorkoutInput('  123  ')).toBe(123)
        expect(sanitizeWorkoutInput('45.5')).toBe(45.5)
        expect(sanitizeWorkoutInput('valid text')).toBe('valid text')
        expect(sanitizeWorkoutInput('')).toBeUndefined()
        expect(sanitizeWorkoutInput('   ')).toBeUndefined()
      })

      it('should remove potentially harmful characters', () => {
        expect(sanitizeWorkoutInput('text<script>alert("xss")</script>')).toBe(
          'textscriptalert("xss")/script',
        )
        expect(sanitizeWorkoutInput('text with "quotes" & ampersand')).toBe(
          'text with quotes  ampersand',
        )
      })

      it('should handle numeric inputs', () => {
        expect(sanitizeWorkoutInput(123)).toBe(123)
        expect(sanitizeWorkoutInput(45.5)).toBe(45.5)
        expect(sanitizeWorkoutInput(0)).toBe(0)
        expect(sanitizeWorkoutInput(NaN)).toBeUndefined()
        expect(sanitizeWorkoutInput(Infinity)).toBeUndefined()
        expect(sanitizeWorkoutInput(-Infinity)).toBeUndefined()
      })

      it('should handle edge cases', () => {
        expect(sanitizeWorkoutInput(null as any)).toBeUndefined()
        expect(sanitizeWorkoutInput(undefined as any)).toBeUndefined()
        expect(sanitizeWorkoutInput({} as any)).toBeUndefined()
        expect(sanitizeWorkoutInput([] as any)).toBeUndefined()
      })
    })

    describe('Integration Tests', () => {
      it('should work end-to-end with workout data entry', () => {
        const userData = {
          sets: '3',
          reps: '10',
          weight: '135.5',
          notes: 'Good session',
        }

        // Simulate form processing
        const processedData = {
          sets: sanitizeWorkoutInput(userData.sets),
          reps: sanitizeWorkoutInput(userData.reps),
          weight: sanitizeWorkoutInput(userData.weight),
          notes: sanitizeWorkoutInput(userData.notes),
        }

        // Validate individual fields
        expect(validateWorkoutField('sets', processedData.sets)).toBeNull()
        expect(validateWorkoutField('reps', processedData.reps)).toBeNull()
        expect(validateWorkoutField('weight', processedData.weight)).toBeNull()
        expect(validateWorkoutField('notes', processedData.notes)).toBeNull()

        // Validate entire form
        const validationResult = validateWorkoutDataEntry(processedData)
        expect(validationResult.isValid).toBe(true)
      })

      it('should catch edge cases in real-world scenario', () => {
        const maliciousUserData = {
          sets: '<script>alert("xss")</script>',
          reps: '999999',
          weight: '-100',
          notes: 'x'.repeat(600),
        }

        const processedData = {
          sets: sanitizeWorkoutInput(maliciousUserData.sets),
          reps: sanitizeWorkoutInput(maliciousUserData.reps),
          weight: sanitizeWorkoutInput(maliciousUserData.weight),
          notes: sanitizeWorkoutInput(maliciousUserData.notes),
        }

        // Check individual field validation
        expect(validateWorkoutField('reps', processedData.reps)).toContain('exceed')
        expect(validateWorkoutField('weight', processedData.weight)).toContain('negative')
        expect(validateWorkoutField('notes', processedData.notes)).toContain('500 characters')

        // Full form validation should catch all issues
        const validationResult = validateWorkoutDataEntry(processedData)
        expect(validationResult.isValid).toBe(false)
        expect(Object.keys(validationResult.errors).length).toBeGreaterThan(2)
      })

      it('should handle AMRAP data processing end-to-end', () => {
        const amrapUserData = {
          totalRounds: '7',
          notes: 'Pushed hard today!',
          partialRoundExercises: [
            { exerciseId: 'pushups', reps: 8 },
            { exerciseId: 'squats', reps: 12 },
          ],
        }

        const processedData = {
          totalRounds: sanitizeWorkoutInput(amrapUserData.totalRounds),
          notes: sanitizeWorkoutInput(amrapUserData.notes),
          partialRoundExercises: amrapUserData.partialRoundExercises,
        }

        expect(validateAmrapField('totalRounds', processedData.totalRounds)).toBeNull()
        expect(validateAmrapField('notes', processedData.notes)).toBeNull()

        const validationResult = validateAmrapDataEntry(processedData)
        expect(validationResult.isValid).toBe(true)
      })
    })

    describe('Performance and Boundary Tests', () => {
      it('should handle maximum valid values', () => {
        const maxValidData: WorkoutDataEntryData = {
          sets: 99,
          reps: 999,
          notes: 'x'.repeat(500),
          weight: 1000,
          time: 999,
          distance: 999,
          distanceUnit: 'miles',
          timeUnit: 'hours',
        }

        const result = validateWorkoutDataEntry(maxValidData)
        expect(result.isValid).toBe(true)
      })

      it('should handle minimum valid values', () => {
        const minValidData: WorkoutDataEntryData = {
          sets: 1,
          reps: 1,
          notes: '',
        }

        const result = validateWorkoutDataEntry(minValidData)
        expect(result.isValid).toBe(true)
      })

      it('should reject boundary-exceeding values', () => {
        const exceedingData = {
          sets: 100,
          reps: 1000,
          weight: 1001,
          time: 1000,
          distance: 1000,
          notes: 'x'.repeat(501),
        }

        const result = validateWorkoutDataEntry(exceedingData)
        expect(result.isValid).toBe(false)
        expect(Object.keys(result.errors)).toEqual(
          expect.arrayContaining(['sets', 'reps', 'weight', 'time', 'distance', 'notes']),
        )
      })

      it('should handle AMRAP boundary conditions', () => {
        // Maximum valid AMRAP data
        const maxAmrapData: AmrapDataEntryData = {
          totalRounds: 99,
          partialRoundExercises: [{ exerciseId: 'ex1', reps: 999 }],
          notes: 'x'.repeat(500),
        }

        const maxResult = validateAmrapDataEntry(maxAmrapData)
        expect(maxResult.isValid).toBe(true)

        // Exceeding boundaries
        const exceedingAmrapData = {
          totalRounds: 100,
          partialRoundExercises: [{ exerciseId: 'ex1', reps: 1000 }],
          notes: 'x'.repeat(501),
        }

        const exceedingResult = validateAmrapDataEntry(exceedingAmrapData)
        expect(exceedingResult.isValid).toBe(false)
      })
    })
  })
})
