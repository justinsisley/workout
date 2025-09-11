import { describe, it, expect } from 'vitest'
import {
  validateUserProgress,
  isValidProgressPosition,
  getProgressErrorMessage,
  getRepairInstructions,
  usernameSchema,
  passkeyCredentialSchema,
  exerciseCompletionSchema,
  programAssignmentSchema,
  type ProgressValidationError,
  type ProgressRepairAction,
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
})
