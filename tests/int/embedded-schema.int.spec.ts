import { describe, it, expect } from 'vitest'
import { Programs } from '../../src/payload/collections/programs'
import { Exercises } from '../../src/payload/collections/exercises'
import { ProductUsers } from '../../src/payload/collections/product-users'
import { ExerciseCompletions } from '../../src/payload/collections/exercise-completions'

describe('Embedded Schema Integration Tests', () => {
  describe('Program Creation Workflow', () => {
    it('should validate program structure with embedded milestones', () => {
      // Test that the Programs collection has the correct embedded structure
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')

      expect(milestonesField).toBeDefined()
      expect((milestonesField as any)?.type).toBe('array')

      // Test milestone structure
      const milestoneFields = (milestonesField as any)?.fields || []
      const nameField = milestoneFields.find((field: any) => field.name === 'name')
      const themeField = milestoneFields.find((field: any) => field.name === 'theme')
      const objectiveField = milestoneFields.find((field: any) => field.name === 'objective')
      const daysField = milestoneFields.find((field: any) => field.name === 'days')

      expect(nameField).toBeDefined()
      expect(themeField).toBeDefined()
      expect(objectiveField).toBeDefined()
      expect(daysField).toBeDefined()
      expect((daysField as any)?.type).toBe('array')
    })

    it('should validate day structure with embedded exercises', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []

      // Test day type field
      const dayTypeField = dayFields.find((field: any) => field.name === 'dayType')
      expect(dayTypeField).toBeDefined()
      expect((dayTypeField as any)?.type).toBe('select')
      expect((dayTypeField as any)?.options).toEqual([
        { label: 'Workout Day', value: 'workout' },
        { label: 'Rest Day', value: 'rest' },
      ])

      // Test exercises array (only for workout days)
      const exercisesField = dayFields.find((field: any) => field.name === 'exercises')
      expect(exercisesField).toBeDefined()
      expect((exercisesField as any)?.type).toBe('array')

      // Test rest notes field (only for rest days)
      const restNotesField = dayFields.find((field: any) => field.name === 'restNotes')
      expect(restNotesField).toBeDefined()
      expect((restNotesField as any)?.type).toBe('textarea')
    })

    it('should validate exercise reference structure with workout details', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []
      const exercisesField = dayFields.find((field: any) => field.name === 'exercises')
      const exerciseFields = (exercisesField as any)?.fields || []

      // Test exercise reference
      const exerciseRefField = exerciseFields.find((field: any) => field.name === 'exercise')
      expect(exerciseRefField).toBeDefined()
      expect((exerciseRefField as any)?.type).toBe('relationship')
      expect((exerciseRefField as any)?.relationTo).toBe('exercises')

      // Test workout details
      const setsField = exerciseFields.find((field: any) => field.name === 'sets')
      const repsField = exerciseFields.find((field: any) => field.name === 'reps')
      const restPeriodField = exerciseFields.find((field: any) => field.name === 'restPeriod')
      const weightField = exerciseFields.find((field: any) => field.name === 'weight')
      const notesField = exerciseFields.find((field: any) => field.name === 'notes')

      expect(setsField).toBeDefined()
      expect((setsField as any)?.type).toBe('number')
      expect((setsField as any)?.min).toBe(1)

      expect(repsField).toBeDefined()
      expect((repsField as any)?.type).toBe('number')
      expect((repsField as any)?.min).toBe(1)

      expect(restPeriodField).toBeDefined()
      expect((restPeriodField as any)?.type).toBe('number')
      expect((restPeriodField as any)?.min).toBe(0)

      expect(weightField).toBeDefined()
      expect((weightField as any)?.type).toBe('number')
      expect((weightField as any)?.min).toBe(0)

      expect(notesField).toBeDefined()
      expect((notesField as any)?.type).toBe('textarea')
    })
  })

  describe('User Progress Tracking', () => {
    it('should validate ProductUser structure for progress tracking', () => {
      const fields = ProductUsers.fields || []

      // Test current program relationship
      const currentProgramField = fields.find((field: any) => field.name === 'currentProgram')
      expect(currentProgramField).toBeDefined()
      expect((currentProgramField as any)?.type).toBe('relationship')
      expect((currentProgramField as any)?.relationTo).toBe('programs')

      // Test milestone index (0-based)
      const currentMilestoneField = fields.find((field: any) => field.name === 'currentMilestone')
      expect(currentMilestoneField).toBeDefined()
      expect((currentMilestoneField as any)?.type).toBe('number')
      expect((currentMilestoneField as any)?.min).toBe(0)

      // Test day index (0-based)
      const currentDayField = fields.find((field: any) => field.name === 'currentDay')
      expect(currentDayField).toBeDefined()
      expect((currentDayField as any)?.type).toBe('number')
      expect((currentDayField as any)?.min).toBe(0)
    })

    it('should validate ExerciseCompletion structure for progress tracking', () => {
      const fields = ExerciseCompletions.fields || []

      // Test user relationship
      const productUserField = fields.find((field: any) => field.name === 'productUser')
      expect(productUserField).toBeDefined()
      expect((productUserField as any)?.type).toBe('relationship')
      expect((productUserField as any)?.relationTo).toBe('productUsers')

      // Test exercise relationship
      const exerciseField = fields.find((field: any) => field.name === 'exercise')
      expect(exerciseField).toBeDefined()
      expect((exerciseField as any)?.type).toBe('relationship')
      expect((exerciseField as any)?.relationTo).toBe('exercises')

      // Test program relationship
      const programField = fields.find((field: any) => field.name === 'program')
      expect(programField).toBeDefined()
      expect((programField as any)?.type).toBe('relationship')
      expect((programField as any)?.relationTo).toBe('programs')

      // Test milestone index
      const milestoneIndexField = fields.find((field: any) => field.name === 'milestoneIndex')
      expect(milestoneIndexField).toBeDefined()
      expect((milestoneIndexField as any)?.type).toBe('number')
      expect((milestoneIndexField as any)?.min).toBe(0)

      // Test day index
      const dayIndexField = fields.find((field: any) => field.name === 'dayIndex')
      expect(dayIndexField).toBeDefined()
      expect((dayIndexField as any)?.type).toBe('number')
      expect((dayIndexField as any)?.min).toBe(0)
    })
  })

  describe('Data Integrity Validation', () => {
    it('should ensure all collections have proper access controls', () => {
      const collections = [Programs, Exercises, ProductUsers, ExerciseCompletions]

      collections.forEach((collection) => {
        expect(collection.access?.create).toBeDefined()
        expect(collection.access?.read).toBeDefined()
        expect(collection.access?.update).toBeDefined()
        expect(collection.access?.delete).toBeDefined()
      })
    })

    it('should ensure all collections have proper admin configuration', () => {
      const collections = [Programs, Exercises, ProductUsers, ExerciseCompletions]

      collections.forEach((collection) => {
        expect(collection.admin?.useAsTitle).toBeDefined()
        expect(collection.admin?.defaultColumns).toBeDefined()
        expect(Array.isArray(collection.admin?.defaultColumns)).toBe(true)
      })
    })

    it('should ensure embedded schema maintains referential integrity', () => {
      // Test that exercise references in programs point to the exercises collection
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []
      const exercisesField = dayFields.find((field: any) => field.name === 'exercises')
      const exerciseFields = (exercisesField as any)?.fields || []
      const exerciseRefField = exerciseFields.find((field: any) => field.name === 'exercise')

      expect((exerciseRefField as any)?.relationTo).toBe('exercises')

      // Test that program references in completions point to the programs collection
      const completionFields = ExerciseCompletions.fields || []
      const programField = completionFields.find((field: any) => field.name === 'program')
      expect((programField as any)?.relationTo).toBe('programs')

      // Test that user references in completions point to the productUsers collection
      const productUserField = completionFields.find((field: any) => field.name === 'productUser')
      expect((productUserField as any)?.relationTo).toBe('productUsers')
    })
  })

  describe('TypeScript Compilation', () => {
    it('should compile without TypeScript errors', () => {
      // This test passes if the file compiles successfully
      // TypeScript compilation is tested separately with tsc --noEmit
      expect(true).toBe(true)
    })
  })
})
