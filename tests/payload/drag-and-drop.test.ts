import { describe, it, expect } from 'vitest'
import { Sessions } from '../../src/payload/collections/sessions'
import { Milestones } from '../../src/payload/collections/milestones'
import { Programs } from '../../src/payload/collections/programs'

describe('PayloadCMS Drag-and-Drop Ordering Tests', () => {
  describe('Array Field Drag-and-Drop Configuration', () => {
    it('should have drag-and-drop ordering configured for Sessions exercises array', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')

      expect(exercisesField, 'Exercises field should exist in Sessions collection').toBeDefined()
      expect((exercisesField as any).type, 'Exercises field should be array type').toBe('array')
      expect((exercisesField as any).minRows, 'Exercises field should have minimum rows').toBe(1)

      // Verify drag-and-drop description
      expect(
        (exercisesField as any)?.admin?.description,
        'Exercises field should have drag-and-drop description',
      ).toContain('Drag and drop to reorder')

      // Verify array field structure supports ordering
      expect(
        (exercisesField as any).fields,
        'Exercises field should have nested fields',
      ).toBeDefined()
      expect(
        (exercisesField as any).fields.length,
        'Exercises field should have multiple nested fields',
      ).toBeGreaterThan(0)

      // Verify exercise relationship field exists
      const exerciseField = (exercisesField as any).fields.find((f: any) => f.name === 'exercise')
      expect(exerciseField, 'Exercise relationship field should exist').toBeDefined()
      expect(exerciseField.type, 'Exercise field should be relationship type').toBe('relationship')
      expect(exerciseField.relationTo, 'Exercise field should relate to exercises').toBe(
        'exercises',
      )
    })

    it('should have drag-and-drop ordering configured for Milestones days array', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')

      expect(daysField, 'Days field should exist in Milestones collection').toBeDefined()
      expect((daysField as any).type, 'Days field should be array type').toBe('array')
      expect((daysField as any).minRows, 'Days field should have minimum rows').toBe(1)

      // Verify drag-and-drop description
      expect(
        (daysField as any)?.admin?.description,
        'Days field should have drag-and-drop description',
      ).toContain('Drag and drop to reorder')

      // Verify day number derivation from position
      expect(
        (daysField as any)?.admin?.description,
        'Days field should mention day number derivation',
      ).toContain('Day number is automatically derived from position')

      // Verify array field structure supports ordering
      expect((daysField as any).fields, 'Days field should have nested fields').toBeDefined()
      expect(
        (daysField as any).fields.length,
        'Days field should have multiple nested fields',
      ).toBeGreaterThan(0)

      // Verify dayType field exists
      const dayTypeField = (daysField as any).fields.find((f: any) => f.name === 'dayType')
      expect(dayTypeField, 'DayType field should exist').toBeDefined()
      expect(dayTypeField.type, 'DayType field should be select type').toBe('select')
      expect(dayTypeField.required, 'DayType field should be required').toBe(true)
      expect(dayTypeField.defaultValue, 'DayType field should have default value').toBe('workout')
    })

    it('should have drag-and-drop ordering configured for Programs milestones array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect(milestonesField, 'Milestones field should exist in Programs collection').toBeDefined()
      expect((milestonesField as any).type, 'Milestones field should be array type').toBe('array')

      // Verify drag-and-drop description
      expect(
        (milestonesField as any)?.admin?.description,
        'Milestones field should have drag-and-drop description',
      ).toContain('Drag and drop to reorder')

      // Verify milestone sequence ordering
      expect(
        (milestonesField as any)?.admin?.description,
        'Milestones field should mention sequence ordering',
      ).toContain('reorder milestones in the program sequence')

      // Verify array field structure supports ordering
      expect(
        (milestonesField as any).fields,
        'Milestones field should have nested fields',
      ).toBeDefined()
      expect(
        (milestonesField as any).fields.length,
        'Milestones field should have nested fields',
      ).toBeGreaterThan(0)

      // Verify milestone relationship field exists
      const milestoneField = (milestonesField as any).fields.find(
        (f: any) => f.name === 'milestone',
      )
      expect(milestoneField, 'Milestone relationship field should exist').toBeDefined()
      expect(milestoneField.type, 'Milestone field should be relationship type').toBe(
        'relationship',
      )
      expect(milestoneField.relationTo, 'Milestone field should relate to milestones').toBe(
        'milestones',
      )
      expect(milestoneField.required, 'Milestone field should be required').toBe(true)
    })
  })

  describe('Nested Array Drag-and-Drop Configuration', () => {
    it('should have proper ordering configuration for milestone days sessions array', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )

      expect(sessionsField, 'Sessions field should exist in days array').toBeDefined()
      expect((sessionsField as any).type, 'Sessions field should be array type').toBe('array')

      // Verify sessions array has proper structure
      expect(
        (sessionsField as any).fields,
        'Sessions field should have nested fields',
      ).toBeDefined()
      expect(
        (sessionsField as any).fields.length,
        'Sessions field should have nested fields',
      ).toBeGreaterThan(0)

      // Verify session relationship field exists
      const sessionField = (sessionsField as any).fields.find((f: any) => f.name === 'session')
      expect(sessionField, 'Session relationship field should exist').toBeDefined()
      expect(sessionField.type, 'Session field should be relationship type').toBe('relationship')
      expect(sessionField.relationTo, 'Session field should relate to sessions').toBe('sessions')
      expect(sessionField.required, 'Session field should be required').toBe(true)

      // Verify order field exists for session ordering
      const orderField = (sessionsField as any).fields.find((f: any) => f.name === 'order')
      expect(orderField, 'Order field should exist for session ordering').toBeDefined()
      expect(orderField.type, 'Order field should be number type').toBe('number')
      expect(orderField.required, 'Order field should be required').toBe(true)
      expect(orderField.min, 'Order field should have minimum value').toBe(1)
    })
  })

  describe('Array Field Admin Configuration', () => {
    it('should have proper admin configuration for array fields', () => {
      const arrayFields = [
        { collection: Sessions, field: 'exercises' },
        { collection: Milestones, field: 'days' },
        { collection: Programs, field: 'milestones' },
      ]

      arrayFields.forEach(({ collection, field }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)

        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((arrayField as any).type, `Field ${field} should be array type`).toBe('array')

        // Verify admin configuration
        expect(
          (arrayField as any).admin,
          `Field ${field} should have admin configuration`,
        ).toBeDefined()
        expect(
          (arrayField as any).admin.description,
          `Field ${field} should have description`,
        ).toBeDefined()
        expect(
          (arrayField as any).admin.description,
          `Field ${field} should mention drag-and-drop`,
        ).toContain('Drag and drop to reorder')
      })
    })

    it('should have proper admin configuration for Programs milestones array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect(
        (milestonesField as any).admin,
        'Milestones field should have admin configuration',
      ).toBeDefined()
      expect(
        (milestonesField as any).admin.initCollapsed,
        'Milestones field should not be collapsed by default',
      ).toBe(false)
      expect(
        (milestonesField as any).admin.description,
        'Milestones field should have proper description',
      ).toBeDefined()
    })
  })

  describe('Array Field Validation', () => {
    it('should have proper validation for array fields', () => {
      const arrayFields = [
        { collection: Sessions, field: 'exercises', minRows: 1 },
        { collection: Milestones, field: 'days', minRows: 1 },
        { collection: Programs, field: 'milestones' }, // No minRows specified
      ]

      arrayFields.forEach(({ collection, field, minRows }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)

        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()

        if (minRows !== undefined) {
          expect(
            (arrayField as any).minRows,
            `Field ${field} should have minRows: ${minRows}`,
          ).toBe(minRows)
        }
      })
    })

    it('should have proper validation for nested array fields', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )

      // Sessions array should not have minRows (optional for rest days)
      expect(
        (sessionsField as any).minRows,
        'Sessions array should not have minRows requirement',
      ).toBeUndefined()

      // But should have proper field validation
      const sessionField = (sessionsField as any).fields.find((f: any) => f.name === 'session')
      expect(sessionField.required, 'Session field should be required').toBe(true)

      const orderField = (sessionsField as any).fields.find((f: any) => f.name === 'order')
      expect(orderField.required, 'Order field should be required').toBe(true)
      expect(orderField.min, 'Order field should have minimum value').toBe(1)
    })
  })

  describe('Array Field Type Safety', () => {
    it('should have proper TypeScript types for array fields', () => {
      // This test verifies that the array fields are properly configured
      // to generate correct TypeScript types

      const arrayFields = [
        { collection: Sessions, field: 'exercises' },
        { collection: Milestones, field: 'days' },
        { collection: Programs, field: 'milestones' },
      ]

      arrayFields.forEach(({ collection, field }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)

        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((arrayField as any).type, `Field ${field} should be array type`).toBe('array')

        // Verify that array fields have proper structure for type generation
        expect(
          (arrayField as any).fields,
          `Field ${field} should have fields for type generation`,
        ).toBeDefined()
        expect(
          Array.isArray((arrayField as any).fields),
          `Field ${field} fields should be an array`,
        ).toBe(true)
      })
    })
  })
})
