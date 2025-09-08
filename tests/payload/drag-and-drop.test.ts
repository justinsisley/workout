import { describe, it, expect } from 'vitest'
import { Programs } from '../../src/payload/collections/programs'

describe('PayloadCMS Drag-and-Drop Ordering Tests', () => {
  describe('Array Field Drag-and-Drop Configuration', () => {
    it('should have drag-and-drop ordering configured for embedded milestone days array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )

      expect(daysField, 'Days field should exist in embedded milestones').toBeDefined()
      expect((daysField as any).type, 'Days field should be array type').toBe('array')
      expect((daysField as any).minRows, 'Days field should have minimum rows').toBe(1)

      // Verify drag-and-drop description
      expect(
        (daysField as any)?.admin?.description,
        'Days field should have drag-and-drop description',
      ).toContain('Drag and drop to reorder')

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

      // Verify array field structure supports ordering
      expect(
        (milestonesField as any).fields,
        'Milestones field should have nested fields',
      ).toBeDefined()
      expect(
        (milestonesField as any).fields.length,
        'Milestones field should have nested fields',
      ).toBeGreaterThan(0)

      // Verify embedded milestone structure
      const nameField = (milestonesField as any).fields.find((f: any) => f.name === 'name')
      expect(nameField, 'Name field should exist in embedded milestones').toBeDefined()
      expect(nameField.type, 'Name field should be text type').toBe('text')
    })
  })

  describe('Nested Array Drag-and-Drop Configuration', () => {
    it('should have proper ordering configuration for embedded milestone days exercises array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const exercisesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'exercises',
      )

      expect(exercisesField, 'Exercises field should exist in days array').toBeDefined()
      expect((exercisesField as any).type, 'Exercises field should be array type').toBe('array')

      // Verify exercises array has proper structure
      expect(
        (exercisesField as any).fields,
        'Exercises field should have nested fields',
      ).toBeDefined()
      expect(
        (exercisesField as any).fields.length,
        'Exercises field should have nested fields',
      ).toBeGreaterThan(0)

      // Verify exercise relationship field exists
      const exerciseField = (exercisesField as any).fields.find((f: any) => f.name === 'exercise')
      expect(exerciseField, 'Exercise relationship field should exist').toBeDefined()
      expect(exerciseField.type, 'Exercise field should be relationship type').toBe('relationship')
      expect(exerciseField.relationTo, 'Exercise field should relate to exercises').toBe(
        'exercises',
      )
      expect(exerciseField.required, 'Exercise field should be required').toBe(true)

      // Verify sets field exists
      const setsField = (exercisesField as any).fields.find((f: any) => f.name === 'sets')
      expect(setsField, 'Sets field should exist').toBeDefined()
      expect(setsField.type, 'Sets field should be number type').toBe('number')
      expect(setsField.required, 'Sets field should be required').toBe(true)
      expect(setsField.min, 'Sets field should have minimum value').toBe(1)
    })
  })

  describe('Array Field Admin Configuration', () => {
    it('should have proper admin configuration for array fields', () => {
      const arrayFields = [{ collection: Programs, field: 'milestones' }]

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
        { collection: Programs, field: 'milestones' }, // No minRows specified
      ]

      arrayFields.forEach(({ collection, field }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)

        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()
      })
    })

    it('should have proper validation for nested array fields', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const exercisesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'exercises',
      )

      // Days array should have minRows requirement
      expect((daysField as any).minRows, 'Days array should have minRows requirement').toBe(1)

      // Exercises array should have minRows requirement
      expect(
        (exercisesField as any).minRows,
        'Exercises array should have minRows requirement',
      ).toBe(1)

      // But should have proper field validation
      const exerciseField = (exercisesField as any).fields.find((f: any) => f.name === 'exercise')
      expect(exerciseField.required, 'Exercise field should be required').toBe(true)

      const setsField = (exercisesField as any).fields.find((f: any) => f.name === 'sets')
      expect(setsField.required, 'Sets field should be required').toBe(true)
      expect(setsField.min, 'Sets field should have minimum value').toBe(1)
    })
  })

  describe('Array Field Type Safety', () => {
    it('should have proper TypeScript types for array fields', () => {
      // This test verifies that the array fields are properly configured
      // to generate correct TypeScript types

      const arrayFields = [{ collection: Programs, field: 'milestones' }]

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
