import { describe, it, expect } from 'vitest'
import { Exercises } from '../../src/payload/collections/exercises'
import { Programs } from '../../src/payload/collections/programs'
import { ProductUsers } from '../../src/payload/collections/product-users'
import { ExerciseCompletions } from '../../src/payload/collections/exercise-completions'

describe('PayloadCMS Collections - Embedded Schema', () => {
  describe('Exercises Collection', () => {
    it('should have correct collection configuration', () => {
      expect(Exercises.slug).toBe('exercises')
      expect(Exercises.admin?.useAsTitle).toBe('title')
      expect(Exercises.admin?.defaultColumns).toEqual([
        'title',
        'description',
        'videoUrl',
        'isPublished',
      ])
    })

    it('should have required fields', () => {
      const fields = Exercises.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('title')
      expect(fieldNames).toContain('description')
      expect(fieldNames).toContain('videoUrl')
      expect(fieldNames).toContain('alternatives')
      expect(fieldNames).toContain('isPublished')
    })

    it('should have alternatives relationship configured correctly', () => {
      const alternativesField = Exercises.fields?.find(
        (field: any) => field.name === 'alternatives',
      )

      expect(alternativesField).toBeDefined()
      expect((alternativesField as any)?.type).toBe('relationship')
      expect((alternativesField as any)?.relationTo).toBe('exercises')
      expect((alternativesField as any)?.hasMany).toBe(true)
    })

    it('should have proper access controls', () => {
      expect(Exercises.access?.read).toBeDefined()
      expect(Exercises.access?.create).toBeDefined()
      expect(Exercises.access?.update).toBeDefined()
      expect(Exercises.access?.delete).toBeDefined()
    })
  })

  describe('Programs Collection - Embedded Schema', () => {
    it('should have correct collection configuration', () => {
      expect(Programs.slug).toBe('programs')
      expect(Programs.admin?.useAsTitle).toBe('name')
      expect(Programs.admin?.defaultColumns).toEqual(['name', 'isPublished', 'createdAt'])
    })

    it('should have embedded milestones array field', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')

      expect(milestonesField).toBeDefined()
      expect((milestonesField as any)?.type).toBe('array')
      // Note: required property may not be present on array fields
    })

    it('should have embedded days array within milestones', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')

      expect(daysField).toBeDefined()
      expect((daysField as any)?.type).toBe('array')
    })

    it('should have embedded exercises array within workout days', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []
      const exercisesField = dayFields.find((field: any) => field.name === 'exercises')

      expect(exercisesField).toBeDefined()
      expect((exercisesField as any)?.type).toBe('array')
    })

    it('should have exercise reference with workout details', () => {
      const fields = Programs.fields || []
      const milestonesField = fields.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const daysField = milestoneFields.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []
      const exercisesField = dayFields.find((field: any) => field.name === 'exercises')
      const exerciseFields = (exercisesField as any)?.fields || []

      const exerciseRefField = exerciseFields.find((field: any) => field.name === 'exercise')
      const setsField = exerciseFields.find((field: any) => field.name === 'sets')
      const repsField = exerciseFields.find((field: any) => field.name === 'reps')
      const restPeriodField = exerciseFields.find((field: any) => field.name === 'restPeriod')
      const weightField = exerciseFields.find((field: any) => field.name === 'weight')
      const notesField = exerciseFields.find((field: any) => field.name === 'notes')

      expect(exerciseRefField).toBeDefined()
      expect((exerciseRefField as any)?.type).toBe('relationship')
      expect((exerciseRefField as any)?.relationTo).toBe('exercises')

      expect(setsField).toBeDefined()
      expect((setsField as any)?.type).toBe('number')

      expect(repsField).toBeDefined()
      expect((repsField as any)?.type).toBe('number')

      expect(restPeriodField).toBeDefined()
      expect((restPeriodField as any)?.type).toBe('number')

      expect(weightField).toBeDefined()
      expect((weightField as any)?.type).toBe('number')

      expect(notesField).toBeDefined()
      expect((notesField as any)?.type).toBe('textarea')
    })

    it('should have proper access controls', () => {
      expect(Programs.access?.read).toBeDefined()
      expect(Programs.access?.create).toBeDefined()
      expect(Programs.access?.update).toBeDefined()
      expect(Programs.access?.delete).toBeDefined()
    })
  })

  describe('ProductUsers Collection', () => {
    it('should have correct collection configuration', () => {
      expect(ProductUsers.slug).toBe('productUsers')
      expect(ProductUsers.admin?.useAsTitle).toBe('username')
      expect(ProductUsers.admin?.defaultColumns).toEqual([
        'username',
        'currentProgram',
        'currentMilestone',
        'currentDay',
      ])
    })

    it('should have currentMilestone as number field (0-based index)', () => {
      const fields = ProductUsers.fields || []
      const currentMilestoneField = fields.find((field: any) => field.name === 'currentMilestone')

      expect(currentMilestoneField).toBeDefined()
      expect((currentMilestoneField as any)?.type).toBe('number')
      expect((currentMilestoneField as any)?.min).toBe(0)
    })

    it('should have currentDay as number field', () => {
      const fields = ProductUsers.fields || []
      const currentDayField = fields.find((field: any) => field.name === 'currentDay')

      expect(currentDayField).toBeDefined()
      expect((currentDayField as any)?.type).toBe('number')
      expect((currentDayField as any)?.min).toBe(0)
    })

    it('should have currentProgram relationship', () => {
      const fields = ProductUsers.fields || []
      const currentProgramField = fields.find((field: any) => field.name === 'currentProgram')

      expect(currentProgramField).toBeDefined()
      expect((currentProgramField as any)?.type).toBe('relationship')
      expect((currentProgramField as any)?.relationTo).toBe('programs')
    })

    it('should not have totalWorkoutsCompleted field', () => {
      const fields = ProductUsers.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).not.toContain('totalWorkoutsCompleted')
    })

    it('should have proper access controls', () => {
      expect(ProductUsers.access?.read).toBeDefined()
      expect(ProductUsers.access?.create).toBeDefined()
      expect(ProductUsers.access?.update).toBeDefined()
      expect(ProductUsers.access?.delete).toBeDefined()
    })
  })

  describe('ExerciseCompletions Collection', () => {
    it('should have correct collection configuration', () => {
      expect(ExerciseCompletions.slug).toBe('exerciseCompletions')
      expect(ExerciseCompletions.admin?.useAsTitle).toBe('id')
      expect(ExerciseCompletions.admin?.defaultColumns).toEqual([
        'productUser',
        'exercise',
        'program',
        'milestoneIndex',
        'dayIndex',
        'completedAt',
      ])
    })

    it('should have milestoneIndex field', () => {
      const fields = ExerciseCompletions.fields || []
      const milestoneIndexField = fields.find((field: any) => field.name === 'milestoneIndex')

      expect(milestoneIndexField).toBeDefined()
      expect((milestoneIndexField as any)?.type).toBe('number')
      expect((milestoneIndexField as any)?.min).toBe(0)
    })

    it('should have dayIndex field', () => {
      const fields = ExerciseCompletions.fields || []
      const dayIndexField = fields.find((field: any) => field.name === 'dayIndex')

      expect(dayIndexField).toBeDefined()
      expect((dayIndexField as any)?.type).toBe('number')
      expect((dayIndexField as any)?.min).toBe(0)
    })

    it('should have program relationship', () => {
      const fields = ExerciseCompletions.fields || []
      const programField = fields.find((field: any) => field.name === 'program')

      expect(programField).toBeDefined()
      expect((programField as any)?.type).toBe('relationship')
      expect((programField as any)?.relationTo).toBe('programs')
    })

    it('should have exercise relationship', () => {
      const fields = ExerciseCompletions.fields || []
      const exerciseField = fields.find((field: any) => field.name === 'exercise')

      expect(exerciseField).toBeDefined()
      expect((exerciseField as any)?.type).toBe('relationship')
      expect((exerciseField as any)?.relationTo).toBe('exercises')
    })

    it('should have productUser relationship', () => {
      const fields = ExerciseCompletions.fields || []
      const productUserField = fields.find((field: any) => field.name === 'productUser')

      expect(productUserField).toBeDefined()
      expect((productUserField as any)?.type).toBe('relationship')
      expect((productUserField as any)?.relationTo).toBe('productUsers')
    })

    it('should not have session relationship', () => {
      const fields = ExerciseCompletions.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).not.toContain('session')
    })

    it('should have proper access controls', () => {
      expect(ExerciseCompletions.access?.read).toBeDefined()
      expect(ExerciseCompletions.access?.create).toBeDefined()
      expect(ExerciseCompletions.access?.update).toBeDefined()
      expect(ExerciseCompletions.access?.delete).toBeDefined()
    })
  })
})
