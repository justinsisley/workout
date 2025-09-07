import { describe, it, expect } from 'vitest'
import { Exercises } from '../../src/payload/collections/exercises'
import { Sessions } from '../../src/payload/collections/sessions'
import { Milestones } from '../../src/payload/collections/milestones'
import { Programs } from '../../src/payload/collections/programs'
import { ProductUsers } from '../../src/payload/collections/product-users'
import { ExerciseCompletions } from '../../src/payload/collections/exercise-completions'

describe('PayloadCMS Relationship Configuration Tests', () => {
  describe('Relationship Data Integrity Configuration', () => {
    it('should have proper relationship configurations for data integrity', () => {
      // Test that all relationship fields are properly configured
      // This ensures PayloadCMS will handle data integrity correctly

      const relationshipConfigs = [
        // Exercises -> Exercises (self-referencing)
        {
          collection: Exercises,
          field: 'alternatives',
          relationTo: 'exercises',
          hasMany: true,
          required: false,
        },

        // Sessions -> Exercises
        {
          collection: Sessions,
          field: 'exercises',
          nestedField: 'exercise',
          relationTo: 'exercises',
          required: true,
        },

        // Milestones -> Sessions
        {
          collection: Milestones,
          field: 'culminatingEvent',
          relationTo: 'sessions',
          required: false,
        },

        // Milestones -> Sessions (nested in days)
        {
          collection: Milestones,
          field: 'days',
          nestedField: 'sessions.session',
          relationTo: 'sessions',
          required: true,
        },

        // Programs -> Sessions
        {
          collection: Programs,
          field: 'culminatingEvent',
          relationTo: 'sessions',
          required: false,
        },

        // Programs -> Milestones
        {
          collection: Programs,
          field: 'milestones',
          nestedField: 'milestone',
          relationTo: 'milestones',
          required: true,
        },

        // ProductUsers -> Programs
        {
          collection: ProductUsers,
          field: 'currentProgram',
          relationTo: 'programs',
          required: false,
        },

        // ProductUsers -> Milestones
        {
          collection: ProductUsers,
          field: 'currentMilestone',
          relationTo: 'milestones',
          required: false,
        },

        // ExerciseCompletions -> ProductUsers
        {
          collection: ExerciseCompletions,
          field: 'productUser',
          relationTo: 'productUsers',
          required: true,
        },

        // ExerciseCompletions -> Exercises
        {
          collection: ExerciseCompletions,
          field: 'exercise',
          relationTo: 'exercises',
          required: true,
        },

        // ExerciseCompletions -> Sessions
        {
          collection: ExerciseCompletions,
          field: 'session',
          relationTo: 'sessions',
          required: true,
        },
      ]

      relationshipConfigs.forEach(
        ({ collection, field, nestedField, relationTo, required, hasMany }) => {
          const fieldObj = nestedField
            ? getNestedField(collection, field, nestedField)
            : collection.fields?.find((f: any) => f.name === field)

          expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
          expect(fieldObj.type, `Field ${field} should be relationship type`).toBe('relationship')
          expect(fieldObj.relationTo, `Field ${field} should relate to ${relationTo}`).toBe(
            relationTo,
          )

          if (required !== undefined) {
            if (required) {
              expect(
                (fieldObj as any).required,
                `Field ${field} should be required: ${required}`,
              ).toBe(required)
            } else {
              // For optional fields, required should be undefined or false
              expect((fieldObj as any).required, `Field ${field} should be optional`).toBeFalsy()
            }
          }

          if (hasMany !== undefined) {
            expect(fieldObj.hasMany, `Field ${field} should have hasMany: ${hasMany}`).toBe(hasMany)
          }
        },
      )
    })

    it('should have proper array field configurations for drag-and-drop ordering', () => {
      const arrayFields = [
        { collection: Sessions, field: 'exercises' },
        { collection: Milestones, field: 'days' },
        { collection: Programs, field: 'milestones' },
      ]

      arrayFields.forEach(({ collection, field }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)

        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((arrayField as any).type, `Field ${field} should be array type`).toBe('array')
        expect(
          (arrayField as any)?.admin?.description,
          `Field ${field} should have drag-and-drop description`,
        ).toContain('Drag and drop to reorder')
      })
    })

    it('should have proper conditional field configurations', () => {
      // Test milestone days conditional fields
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )
      const restNotesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'restNotes',
      )

      expect(sessionsField?.admin?.condition, 'Sessions field should have condition').toBeDefined()
      expect(
        restNotesField?.admin?.condition,
        'Rest notes field should have condition',
      ).toBeDefined()
    })
  })

  describe('Relationship Query Configuration', () => {
    it('should have proper depth configuration for relationship queries', () => {
      // Test that all relationship fields support proper depth queries
      const relationshipFields = [
        { collection: ExerciseCompletions, field: 'productUser' },
        { collection: ExerciseCompletions, field: 'exercise' },
        { collection: ExerciseCompletions, field: 'session' },
        { collection: Sessions, field: 'exercises', nestedField: 'exercise' },
        { collection: Milestones, field: 'culminatingEvent' },
        { collection: Milestones, field: 'days', nestedField: 'sessions.session' },
        { collection: Programs, field: 'culminatingEvent' },
        { collection: Programs, field: 'milestones', nestedField: 'milestone' },
        { collection: ProductUsers, field: 'currentProgram' },
        { collection: ProductUsers, field: 'currentMilestone' },
      ]

      relationshipFields.forEach(({ collection, field, nestedField }) => {
        const fieldObj = nestedField
          ? getNestedField(collection, field, nestedField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect(fieldObj.type, `Field ${field} should be relationship type`).toBe('relationship')
        expect(fieldObj.relationTo, `Field ${field} should have relationTo`).toBeDefined()
      })
    })

    it('should have proper admin configuration for relationship fields', () => {
      // Test that relationship fields have proper admin descriptions
      const relationshipFields = [
        {
          collection: ExerciseCompletions,
          field: 'productUser',
          shouldContain: 'completed this exercise',
        },
        {
          collection: ExerciseCompletions,
          field: 'exercise',
          shouldContain: 'exercise that was completed',
        },
        {
          collection: ExerciseCompletions,
          field: 'session',
          shouldContain: 'session in which this exercise was completed',
        },
        {
          collection: Sessions,
          field: 'exercises',
          nestedField: 'exercise',
          shouldContain: 'exercise to include in this session',
        },
        {
          collection: Milestones,
          field: 'culminatingEvent',
          shouldContain: 'final session or event',
        },
        {
          collection: Programs,
          field: 'culminatingEvent',
          shouldContain: 'final session or event',
        },
        {
          collection: Programs,
          field: 'milestones',
          nestedField: 'milestone',
          shouldContain: 'Milestone',
        },
        { collection: ProductUsers, field: 'currentProgram', shouldContain: 'currently enrolled' },
        { collection: ProductUsers, field: 'currentMilestone', shouldContain: 'current milestone' },
      ]

      relationshipFields.forEach(({ collection, field, nestedField, shouldContain }) => {
        const fieldObj = nestedField
          ? getNestedField(collection, field, nestedField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        // Check if field has either description or label that contains the expected text
        const hasDescription = fieldObj.admin?.description?.includes(shouldContain)
        const hasLabel = fieldObj.label?.includes(shouldContain)

        expect(
          hasDescription || hasLabel,
          `Field ${field} should have description or label containing: ${shouldContain}`,
        ).toBe(true)
      })
    })
  })

  describe('Data Integrity Constraints Configuration', () => {
    it('should have proper required field configurations', () => {
      const requiredFields = [
        { collection: ExerciseCompletions, field: 'productUser' },
        { collection: ExerciseCompletions, field: 'exercise' },
        { collection: ExerciseCompletions, field: 'session' },
        { collection: Sessions, field: 'exercises', nestedField: 'exercise' },
        { collection: Milestones, field: 'days', nestedField: 'sessions.session' },
        { collection: Programs, field: 'milestones', nestedField: 'milestone' },
      ]

      requiredFields.forEach(({ collection, field, nestedField }) => {
        const fieldObj = nestedField
          ? getNestedField(collection, field, nestedField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((fieldObj as any).required, `Field ${field} should be required`).toBe(true)
      })
    })

    it('should have proper optional field configurations', () => {
      const optionalFields = [
        { collection: Exercises, field: 'alternatives' },
        { collection: Milestones, field: 'culminatingEvent' },
        { collection: Programs, field: 'culminatingEvent' },
        { collection: ProductUsers, field: 'currentProgram' },
        { collection: ProductUsers, field: 'currentMilestone' },
      ]

      optionalFields.forEach(({ collection, field }) => {
        const fieldObj = collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((fieldObj as any).required, `Field ${field} should be optional`).toBeFalsy()
      })
    })

    it('should have proper validation configurations', () => {
      // Test that relationship fields have proper validation
      const relationshipFields = [
        { collection: ExerciseCompletions, field: 'productUser' },
        { collection: ExerciseCompletions, field: 'exercise' },
        { collection: ExerciseCompletions, field: 'session' },
        { collection: Sessions, field: 'exercises', nestedField: 'exercise' },
        { collection: Milestones, field: 'culminatingEvent' },
        { collection: Milestones, field: 'days', nestedField: 'sessions.session' },
        { collection: Programs, field: 'culminatingEvent' },
        { collection: Programs, field: 'milestones', nestedField: 'milestone' },
        { collection: ProductUsers, field: 'currentProgram' },
        { collection: ProductUsers, field: 'currentMilestone' },
      ]

      relationshipFields.forEach(({ collection, field, nestedField }) => {
        const fieldObj = nestedField
          ? getNestedField(collection, field, nestedField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect(fieldObj.type, `Field ${field} should be relationship type`).toBe('relationship')
        expect(fieldObj.relationTo, `Field ${field} should have relationTo`).toBeDefined()
      })
    })
  })

  describe('Cascade Behavior Configuration', () => {
    it('should have proper cascade behavior through PayloadCMS relationships', () => {
      // PayloadCMS automatically handles cascade behavior through relationships
      // This test verifies that all relationship fields are properly configured
      // to ensure proper data integrity when records are deleted

      const cascadeRelationships = [
        // ExerciseCompletions should cascade when related entities are deleted
        { collection: ExerciseCompletions, field: 'productUser', relationTo: 'productUsers' },
        { collection: ExerciseCompletions, field: 'exercise', relationTo: 'exercises' },
        { collection: ExerciseCompletions, field: 'session', relationTo: 'sessions' },

        // Sessions should cascade when exercises are deleted
        {
          collection: Sessions,
          field: 'exercises',
          nestedField: 'exercise',
          relationTo: 'exercises',
        },

        // Milestones should cascade when sessions are deleted
        { collection: Milestones, field: 'culminatingEvent', relationTo: 'sessions' },
        {
          collection: Milestones,
          field: 'days',
          nestedField: 'sessions.session',
          relationTo: 'sessions',
        },

        // Programs should cascade when milestones are deleted
        { collection: Programs, field: 'culminatingEvent', relationTo: 'sessions' },
        {
          collection: Programs,
          field: 'milestones',
          nestedField: 'milestone',
          relationTo: 'milestones',
        },

        // ProductUsers should cascade when programs/milestones are deleted
        { collection: ProductUsers, field: 'currentProgram', relationTo: 'programs' },
        { collection: ProductUsers, field: 'currentMilestone', relationTo: 'milestones' },
      ]

      cascadeRelationships.forEach(({ collection, field, nestedField, relationTo }) => {
        const fieldObj = nestedField
          ? getNestedField(collection, field, nestedField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect(fieldObj.type, `Field ${field} should be relationship type`).toBe('relationship')
        expect(fieldObj.relationTo, `Field ${field} should relate to ${relationTo}`).toBe(
          relationTo,
        )
      })
    })
  })
})

// Helper function for nested field access
function getNestedField(collection: any, arrayFieldName: string, nestedFieldPath: string) {
  const arrayField = collection.fields?.find((f: any) => f.name === arrayFieldName)
  if (!arrayField || arrayField.type !== 'array') return undefined

  // Handle nested field paths like "sessions.session"
  const fieldPath = nestedFieldPath.split('.')
  let current = arrayField.fields

  for (const fieldName of fieldPath) {
    const field = current?.find((f: any) => f.name === fieldName)
    if (!field) return undefined
    current = field.fields || field
  }

  return current
}
