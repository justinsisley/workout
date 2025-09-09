import { describe, it, expect } from 'vitest'
import { Exercises } from '../../src/payload/collections/exercises'
import { Programs } from '../../src/payload/collections/programs'
import { ProductUsers } from '../../src/payload/collections/product-users'
import { ExerciseCompletions } from '../../src/payload/collections/exercise-completions'

describe('PayloadCMS Collections', () => {
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

    it('should validate YouTube URLs correctly', () => {
      const videoUrlField = Exercises.fields?.find((field: any) => field.name === 'videoUrl')

      expect((videoUrlField as any)?.validate).toBeDefined()

      // Test valid YouTube URLs
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'dQw4w9WgXcQ',
        'https://youtube.com/embed/dQw4w9WgXcQ',
      ]

      validUrls.forEach((url) => {
        const result = (videoUrlField as any)?.validate?.(url)
        expect(result).toBe(true)
      })

      // Test invalid URLs
      const invalidUrls = ['https://example.com/video', 'not-a-url', 'https://vimeo.com/123456']

      invalidUrls.forEach((url) => {
        const result = (videoUrlField as any)?.validate?.(url)
        expect(result).toBe('Please provide a valid YouTube URL or video ID')
      })

      // Test empty value (should be valid for drafts)
      const emptyResult = (videoUrlField as any)?.validate?.('')
      expect(emptyResult).toBe(true)
    })

    it('should have progressive validation configured', () => {
      const titleField = Exercises.fields?.find((field: any) => field.name === 'title')
      const descriptionField = Exercises.fields?.find((field: any) => field.name === 'description')
      const videoUrlField = Exercises.fields?.find((field: any) => field.name === 'videoUrl')

      // All fields should be optional (no required: true)
      expect((titleField as any)?.required).toBeUndefined()
      expect((descriptionField as any)?.required).toBeUndefined()
      expect((videoUrlField as any)?.required).toBeUndefined()
    })

    it('should have isPublished field with correct default', () => {
      const isPublishedField = Exercises.fields?.find((field: any) => field.name === 'isPublished')

      expect(isPublishedField).toBeDefined()
      expect((isPublishedField as any)?.type).toBe('checkbox')
      expect((isPublishedField as any)?.defaultValue).toBe(false)
    })
  })

  describe('Programs Collection', () => {
    it('should have correct collection configuration', () => {
      expect(Programs.slug).toBe('programs')
      expect(Programs.admin?.useAsTitle).toBe('name')
      expect(Programs.admin?.defaultColumns).toEqual(['name', 'isPublished', 'createdAt'])
    })

    it('should have required fields', () => {
      const fields = Programs.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('description')
      expect(fieldNames).toContain('objective')
      // culminatingEvent removed as per change log
      expect(fieldNames).toContain('milestones')
      expect(fieldNames).toContain('isPublished')
    })

    // culminatingEvent relationship test removed - field removed as per change log

    it('should have embedded milestones array with proper configuration', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect(milestonesField).toBeDefined()
      expect((milestonesField as any)?.type).toBe('array')
      expect((milestonesField as any)?.admin?.initCollapsed).toBe(false)
      expect((milestonesField as any)?.admin?.description).toBeDefined()
    })

    it('should have embedded milestone structure with days and exercises', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const milestoneFields = (milestonesField as any)?.fields || []
      const fieldNames = milestoneFields.map((field: any) => field.name)

      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('theme')
      expect(fieldNames).toContain('objective')
      expect(fieldNames).toContain('days')
    })

    it('should have proper access controls', () => {
      expect(Programs.access?.read).toBeDefined()
      expect(Programs.access?.create).toBeDefined()
      expect(Programs.access?.update).toBeDefined()
      expect(Programs.access?.delete).toBeDefined()
    })

    it('should have progressive validation configured', () => {
      const nameField = Programs.fields?.find((field: any) => field.name === 'name')
      const descriptionField = Programs.fields?.find((field: any) => field.name === 'description')
      const objectiveField = Programs.fields?.find((field: any) => field.name === 'objective')
      // culminatingEvent field removed as per change log - was optional

      // All fields should be optional (no required: true) for progressive validation
      expect((nameField as any)?.required).toBeUndefined()
      expect((descriptionField as any)?.required).toBeUndefined()
      expect((objectiveField as any)?.required).toBeUndefined()
      // culminatingEvent field removed as per change log
    })

    it('should have isPublished field with correct default', () => {
      const isPublishedField = Programs.fields?.find((field: any) => field.name === 'isPublished')

      expect(isPublishedField).toBeDefined()
      expect((isPublishedField as any)?.type).toBe('checkbox')
      expect((isPublishedField as any)?.defaultValue).toBe(false)
      expect((isPublishedField as any)?.admin?.position).toBe('sidebar')
    })

    it('should have proper field descriptions for publishing requirements', () => {
      const nameField = Programs.fields?.find((field: any) => field.name === 'name')
      const descriptionField = Programs.fields?.find((field: any) => field.name === 'description')
      const objectiveField = Programs.fields?.find((field: any) => field.name === 'objective')

      expect((nameField as any)?.admin?.description).toContain('required for publishing')
      expect((descriptionField as any)?.admin?.description).toContain('required for publishing')
      expect((objectiveField as any)?.admin?.description).toContain('required for publishing')
    })

    it('should have proper admin placeholders', () => {
      const nameField = Programs.fields?.find((field: any) => field.name === 'name')
      const descriptionField = Programs.fields?.find((field: any) => field.name === 'description')
      const objectiveField = Programs.fields?.find((field: any) => field.name === 'objective')

      expect((nameField as any)?.admin?.placeholder).toBeDefined()
      expect((descriptionField as any)?.admin?.placeholder).toBeDefined()
      expect((objectiveField as any)?.admin?.placeholder).toBeDefined()
    })

    it('should have drag-and-drop ordering configured for milestones', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect((milestonesField as any)?.type).toBe('array')
      expect((milestonesField as any)?.admin?.description).toContain('Drag and drop to reorder')
    })

    it('should have proper admin configuration for milestones array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect((milestonesField as any)?.admin?.initCollapsed).toBe(false)
      expect((milestonesField as any)?.admin?.description).toContain('Drag and drop to reorder')
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

    it('should have required fields', () => {
      const fields = ProductUsers.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('username')
      expect(fieldNames).toContain('currentProgram')
      expect(fieldNames).toContain('currentMilestone')
      expect(fieldNames).toContain('currentDay')
      expect(fieldNames).toContain('lastWorkoutDate')
      expect(fieldNames).toContain('totalWorkoutsCompleted')
    })

    it('should have username field with correct configuration', () => {
      const usernameField = ProductUsers.fields?.find((field: any) => field.name === 'username')

      expect(usernameField).toBeDefined()
      expect((usernameField as any)?.type).toBe('text')
      expect((usernameField as any)?.required).toBe(true)
      expect((usernameField as any)?.unique).toBe(true)
      expect((usernameField as any)?.index).toBe(true)
    })

    it('should have currentProgram relationship configured correctly', () => {
      const currentProgramField = ProductUsers.fields?.find(
        (field: any) => field.name === 'currentProgram',
      )

      expect(currentProgramField).toBeDefined()
      expect((currentProgramField as any)?.type).toBe('relationship')
      expect((currentProgramField as any)?.relationTo).toBe('programs')
    })

    it('should have currentMilestone relationship configured correctly', () => {
      const currentMilestoneField = ProductUsers.fields?.find(
        (field: any) => field.name === 'currentMilestone',
      )

      expect(currentMilestoneField).toBeDefined()
      expect((currentMilestoneField as any)?.type).toBe('relationship')
      expect((currentMilestoneField as any)?.relationTo).toBe('programs')
    })

    it('should have currentDay field with correct default and validation', () => {
      const currentDayField = ProductUsers.fields?.find((field: any) => field.name === 'currentDay')

      expect(currentDayField).toBeDefined()
      expect((currentDayField as any)?.type).toBe('number')
      expect((currentDayField as any)?.defaultValue).toBe(1)
      expect((currentDayField as any)?.min).toBe(1)
    })

    it('should have lastWorkoutDate as optional date field', () => {
      const lastWorkoutDateField = ProductUsers.fields?.find(
        (field: any) => field.name === 'lastWorkoutDate',
      )

      expect(lastWorkoutDateField).toBeDefined()
      expect((lastWorkoutDateField as any)?.type).toBe('date')
      expect((lastWorkoutDateField as any)?.required).toBeUndefined()
    })

    it('should have totalWorkoutsCompleted with correct default and validation', () => {
      const totalWorkoutsField = ProductUsers.fields?.find(
        (field: any) => field.name === 'totalWorkoutsCompleted',
      )

      expect(totalWorkoutsField).toBeDefined()
      expect((totalWorkoutsField as any)?.type).toBe('number')
      expect((totalWorkoutsField as any)?.defaultValue).toBe(0)
      expect((totalWorkoutsField as any)?.min).toBe(0)
    })

    it('should have proper access controls for admin-only management', () => {
      expect(ProductUsers.access?.read).toBeDefined()
      expect(ProductUsers.access?.create).toBeDefined()
      expect(ProductUsers.access?.update).toBeDefined()
      expect(ProductUsers.access?.delete).toBeDefined()
    })

    it('should validate usernames correctly', () => {
      const usernameField = ProductUsers.fields?.find((field: any) => field.name === 'username')

      expect((usernameField as any)?.validate).toBeDefined()

      // Test valid usernames
      const validUsernames = ['justin', 'user123', 'test_user', 'admin']
      validUsernames.forEach((username) => {
        const result = (usernameField as any)?.validate(username)
        expect(result).toBe(true)
      })

      // Test invalid usernames
      const invalidUsernames = [
        'ab',
        'a',
        'user@domain.com',
        'user with spaces',
        '',
        null,
        undefined,
      ]
      invalidUsernames.forEach((username) => {
        const result = (usernameField as any)?.validate(username)
        expect(result).not.toBe(true)
      })
    })

    it('should have proper admin descriptions', () => {
      const usernameField = ProductUsers.fields?.find((field: any) => field.name === 'username')
      const currentProgramField = ProductUsers.fields?.find(
        (field: any) => field.name === 'currentProgram',
      )

      expect((usernameField as any)?.admin?.description).toContain('passkey authentication')
      expect((currentProgramField as any)?.admin?.description).toContain('currently enrolled')
    })

    it('should have proper admin configuration', () => {
      expect(ProductUsers.admin?.description).toContain('WebAuthN passkeys')
      expect(ProductUsers.admin?.description).toContain('separate from admin users')
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

    it('should have required relationship fields', () => {
      const fields = ExerciseCompletions.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('productUser')
      expect(fieldNames).toContain('exercise')
      expect(fieldNames).toContain('program')
      expect(fieldNames).toContain('milestoneIndex')
      expect(fieldNames).toContain('dayIndex')
      expect(fieldNames).toContain('completedAt')
    })

    it('should have performance tracking fields', () => {
      const fields = ExerciseCompletions.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('sets')
      expect(fieldNames).toContain('reps')
      expect(fieldNames).toContain('weight')
      expect(fieldNames).toContain('time')
      expect(fieldNames).toContain('notes')
    })

    it('should have productUser relationship configured correctly', () => {
      const productUserField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'productUser',
      )

      expect(productUserField).toBeDefined()
      expect((productUserField as any)?.type).toBe('relationship')
      expect((productUserField as any)?.relationTo).toBe('productUsers')
      expect((productUserField as any)?.required).toBe(true)
    })

    it('should have exercise relationship configured correctly', () => {
      const exerciseField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'exercise',
      )

      expect(exerciseField).toBeDefined()
      expect((exerciseField as any)?.type).toBe('relationship')
      expect((exerciseField as any)?.relationTo).toBe('exercises')
      expect((exerciseField as any)?.required).toBe(true)
    })

    it('should have sets field with correct validation', () => {
      const setsField = ExerciseCompletions.fields?.find((field: any) => field.name === 'sets')

      expect(setsField).toBeDefined()
      expect((setsField as any)?.type).toBe('number')
      expect((setsField as any)?.required).toBe(true)
      expect((setsField as any)?.min).toBe(1)
    })

    it('should have reps field with correct validation', () => {
      const repsField = ExerciseCompletions.fields?.find((field: any) => field.name === 'reps')

      expect(repsField).toBeDefined()
      expect((repsField as any)?.type).toBe('number')
      expect((repsField as any)?.required).toBe(true)
      expect((repsField as any)?.min).toBe(1)
    })

    it('should have weight field as optional with correct validation', () => {
      const weightField = ExerciseCompletions.fields?.find((field: any) => field.name === 'weight')

      expect(weightField).toBeDefined()
      expect((weightField as any)?.type).toBe('number')
      expect((weightField as any)?.required).toBeFalsy()
      expect((weightField as any)?.min).toBe(0)
    })

    it('should have time field as optional with correct validation', () => {
      const timeField = ExerciseCompletions.fields?.find((field: any) => field.name === 'time')

      expect(timeField).toBeDefined()
      expect((timeField as any)?.type).toBe('number')
      expect((timeField as any)?.required).toBeFalsy()
      expect((timeField as any)?.min).toBe(0)
    })

    it('should have completedAt field as required date', () => {
      const completedAtField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'completedAt',
      )

      expect(completedAtField).toBeDefined()
      expect((completedAtField as any)?.type).toBe('date')
      expect((completedAtField as any)?.required).toBe(true)
    })

    it('should have notes field as optional textarea', () => {
      const notesField = ExerciseCompletions.fields?.find((field: any) => field.name === 'notes')

      expect(notesField).toBeDefined()
      expect((notesField as any)?.type).toBe('textarea')
      expect((notesField as any)?.required).toBeFalsy()
    })

    it('should have proper access controls for admin-only management', () => {
      expect(ExerciseCompletions.access?.read).toBeDefined()
      expect(ExerciseCompletions.access?.create).toBeDefined()
      expect(ExerciseCompletions.access?.update).toBeDefined()
      expect(ExerciseCompletions.access?.delete).toBeDefined()
    })

    it('should have proper admin descriptions', () => {
      const productUserField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'productUser',
      )
      const exerciseField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'exercise',
      )
      const setsField = ExerciseCompletions.fields?.find((field: any) => field.name === 'sets')

      expect((productUserField as any)?.admin?.description).toContain('completed this exercise')
      expect((exerciseField as any)?.admin?.description).toContain('exercise that was completed')
      expect((setsField as any)?.admin?.description).toContain('Number of sets completed')
    })

    it('should have proper admin configuration', () => {
      expect(ExerciseCompletions.admin?.description).toContain('Exercise completion records')
      expect(ExerciseCompletions.admin?.description).toContain('performance data')
    })
  })

  describe('Collection Relationships Verification', () => {
    it('should have all relationship fields properly configured between collections', () => {
      // Verify all relationship fields exist and point to correct collections
      const relationshipMap = {
        // Exercises collection relationships
        'exercises.alternatives': { relationTo: 'exercises', hasMany: true },

        // Programs collection relationships
        // programs.culminatingEvent removed as per change log

        // ProductUsers collection relationships
        'productUsers.currentProgram': { relationTo: 'programs' },
        'productUsers.currentMilestone': { relationTo: 'programs' },

        // ExerciseCompletions collection relationships
        'exerciseCompletions.productUser': { relationTo: 'productUsers', required: true },
        'exerciseCompletions.exercise': { relationTo: 'exercises', required: true },
      }

      // Verify each relationship
      Object.entries(relationshipMap).forEach(([path, expected]) => {
        const [collectionSlug, ...fieldPath] = path.split('.')
        const collection = getCollectionBySlug(collectionSlug as string)
        const field = getFieldByPath(collection, fieldPath)

        expect(field, `Field ${path} should exist`).toBeDefined()
        expect(field.type, `Field ${path} should be relationship type`).toBe('relationship')
        expect(field.relationTo, `Field ${path} should relate to ${expected.relationTo}`).toBe(
          expected.relationTo,
        )

        if ((expected as any).required !== undefined) {
          expect(
            (field as any).required,
            `Field ${path} required should be ${(expected as any).required}`,
          ).toBe((expected as any).required)
        }

        if ((expected as any).hasMany !== undefined) {
          expect(
            (field as any).hasMany,
            `Field ${path} hasMany should be ${(expected as any).hasMany}`,
          ).toBe((expected as any).hasMany)
        }
      })
    })

    it('should have proper foreign key constraints through PayloadCMS relationships', () => {
      // PayloadCMS automatically handles foreign key constraints through relationships
      // This test verifies that all relationship fields are properly configured
      // to ensure referential integrity

      const collections = [Exercises, Programs, ProductUsers, ExerciseCompletions]

      collections.forEach((collection) => {
        const relationshipFields =
          collection.fields?.filter(
            (field) =>
              field.type === 'relationship' ||
              (field.type === 'array' && hasRelationshipInArray(field)),
          ) || []

        relationshipFields.forEach((field) => {
          if (field.type === 'relationship') {
            expect(
              field.relationTo,
              `Collection ${collection.slug} relationship field should have relationTo`,
            ).toBeDefined()
          }
        })
      })
    })

    it('should have drag-and-drop ordering configured for all array fields', () => {
      const arrayFields = [{ collection: Programs, field: 'milestones' }]

      arrayFields.forEach(({ collection, field }) => {
        const arrayField = collection.fields?.find((f: any) => f.name === field)
        expect(arrayField, `Array field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect(arrayField?.type, `Field ${field} should be array type`).toBe('array')
        expect(
          (arrayField as any)?.admin?.description,
          `Field ${field} should have drag-and-drop description`,
        ).toContain('Drag and drop to reorder')
      })
    })

    it('should have conditional field logic properly configured', () => {
      // Test embedded milestone days conditional fields in Programs
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const exercisesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'exercises',
      )
      const restNotesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'restNotes',
      )
      const isAmrapField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'isAmrap',
      )
      const amrapDurationField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'amrapDuration',
      )

      expect(
        exercisesField?.admin?.condition,
        'Exercises field should have condition',
      ).toBeDefined()
      expect(
        restNotesField?.admin?.condition,
        'Rest notes field should have condition',
      ).toBeDefined()
      expect(
        isAmrapField?.admin?.condition,
        'AMRAP checkbox field should have condition',
      ).toBeDefined()
      expect(
        amrapDurationField?.admin?.condition,
        'AMRAP duration field should have condition',
      ).toBeDefined()
    })

    it('should have AMRAP fields properly configured', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const isAmrapField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'isAmrap',
      )
      const amrapDurationField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'amrapDuration',
      )

      // Test isAmrap field configuration
      expect(isAmrapField).toBeDefined()
      expect(isAmrapField?.type).toBe('checkbox')
      expect(isAmrapField?.label).toBe('AMRAP Day')
      expect(isAmrapField?.defaultValue).toBe(false)
      expect(isAmrapField?.admin?.description).toContain('AMRAP')

      // Test amrapDuration field configuration
      expect(amrapDurationField).toBeDefined()
      expect(amrapDurationField?.type).toBe('number')
      expect(amrapDurationField?.label).toBe('AMRAP Duration (minutes)')
      expect(amrapDurationField?.min).toBe(1)
      expect(amrapDurationField?.max).toBe(120)
      expect(amrapDurationField?.admin?.description).toContain('Duration for AMRAP workout')
    })

    it('should have duration dual-field structure properly configured', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const exercisesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'exercises',
      )
      const durationValueField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'durationValue',
      )
      const durationUnitField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'durationUnit',
      )

      // Test durationValue field configuration
      expect(durationValueField).toBeDefined()
      expect(durationValueField?.type).toBe('number')
      expect(durationValueField?.label).toBe('Duration Value')
      expect(durationValueField?.min).toBe(0)
      expect(durationValueField?.max).toBe(999)
      expect(durationValueField?.admin?.width).toBe('50%')
      expect(durationValueField?.admin?.description).toContain(
        'Duration amount for time-based exercises',
      )

      // Test durationUnit field configuration
      expect(durationUnitField).toBeDefined()
      expect(durationUnitField?.type).toBe('select')
      expect(durationUnitField?.label).toBe('Duration Unit')
      expect(durationUnitField?.admin?.width).toBe('50%')
      expect(durationUnitField?.admin?.description).toContain('Time unit for the duration value')

      // Test duration unit options
      const unitOptions = durationUnitField?.options
      expect(unitOptions).toBeDefined()
      expect(unitOptions?.length).toBe(3)
      expect(unitOptions?.find((opt: any) => opt.value === 'seconds')).toBeDefined()
      expect(unitOptions?.find((opt: any) => opt.value === 'minutes')).toBeDefined()
      expect(unitOptions?.find((opt: any) => opt.value === 'hours')).toBeDefined()
    })

    it('should have distance dual-field structure properly configured', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const daysField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'days',
      )
      const exercisesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'exercises',
      )
      const distanceValueField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'distanceValue',
      )
      const distanceUnitField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'distanceUnit',
      )

      // Test distanceValue field configuration
      expect(distanceValueField).toBeDefined()
      expect(distanceValueField?.type).toBe('number')
      expect(distanceValueField?.label).toBe('Distance Value')
      expect(distanceValueField?.min).toBe(0)
      expect(distanceValueField?.max).toBe(999)
      expect(distanceValueField?.admin?.width).toBe('50%')
      expect(distanceValueField?.admin?.step).toBe(0.1)
      expect(distanceValueField?.admin?.description).toContain(
        'Distance amount for distance-based exercises',
      )

      // Test distanceUnit field configuration
      expect(distanceUnitField).toBeDefined()
      expect(distanceUnitField?.type).toBe('select')
      expect(distanceUnitField?.label).toBe('Distance Unit')
      expect(distanceUnitField?.admin?.width).toBe('50%')
      expect(distanceUnitField?.admin?.description).toContain(
        'Distance unit for the distance value',
      )

      // Test distance unit options
      const unitOptions = distanceUnitField?.options
      expect(unitOptions).toBeDefined()
      expect(unitOptions?.length).toBe(2)
      expect(unitOptions?.find((opt: any) => opt.value === 'meters')).toBeDefined()
      expect(unitOptions?.find((opt: any) => opt.value === 'miles')).toBeDefined()
    })

    it('should have enhanced beforeValidate hook for dual-field validation', () => {
      // Test that the Programs collection has beforeValidate hooks configured
      expect(Programs.hooks?.beforeValidate).toBeDefined()
      expect(Programs.hooks?.beforeValidate?.length).toBeGreaterThan(0)

      // The hook should be a function that validates dual-field requirements
      const hook = Programs.hooks?.beforeValidate?.[0]
      expect(typeof hook).toBe('function')
    })

    it('should validate AMRAP field requirements through beforeValidate hook', () => {
      const hook = Programs.hooks?.beforeValidate?.[0]

      if (!hook) {
        throw new Error('beforeValidate hook not found')
      }

      // Test AMRAP validation: should fail when isAmrap is true but amrapDuration is missing
      const invalidAmrapData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                isAmrap: true,
                // amrapDuration missing - should cause validation error
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidAmrapData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('AMRAP duration is required when AMRAP day is selected')
    })

    it('should validate duration dual-field requirements through beforeValidate hook', () => {
      const hook = Programs.hooks?.beforeValidate?.[0]

      if (!hook) {
        throw new Error('beforeValidate hook not found')
      }

      // Test duration validation: should fail when durationValue is set but durationUnit is missing
      const invalidDurationData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    durationValue: 30,
                    // durationUnit missing - should cause validation error
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidDurationData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('duration unit is required when duration value is specified')

      // Test reverse: durationUnit set but durationValue missing
      const invalidDurationData2 = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    durationUnit: 'seconds',
                    // durationValue missing - should cause validation error
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidDurationData2,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('duration value is required when duration unit is specified')
    })

    it('should validate distance dual-field requirements through beforeValidate hook', () => {
      const hook = Programs.hooks?.beforeValidate?.[0]

      if (!hook) {
        throw new Error('beforeValidate hook not found')
      }

      // Test distance validation: should fail when distanceValue is set but distanceUnit is missing
      const invalidDistanceData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    distanceValue: 1.5,
                    // distanceUnit missing - should cause validation error
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidDistanceData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('distance unit is required when distance value is specified')

      // Test reverse: distanceUnit set but distanceValue missing
      const invalidDistanceData2 = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    distanceUnit: 'miles',
                    // distanceValue missing - should cause validation error
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidDistanceData2,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('distance value is required when distance unit is specified')
    })

    it('should validate duration range limits through beforeValidate hook', () => {
      const hook = Programs.hooks?.beforeValidate?.[0]

      if (!hook) {
        throw new Error('beforeValidate hook not found')
      }

      // Test duration range validation: hours > 99 should fail
      const invalidHoursDurationData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    durationValue: 100, // Exceeds 99 hour limit
                    durationUnit: 'hours',
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidHoursDurationData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('duration cannot exceed 99 hours')

      // Test duration range validation: minutes > 999 should fail
      const invalidMinutesDurationData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    durationValue: 1000, // Exceeds 999 minute limit
                    durationUnit: 'minutes',
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidMinutesDurationData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('duration cannot exceed 999 minutes')
    })

    it('should validate distance range limits through beforeValidate hook', () => {
      const hook = Programs.hooks?.beforeValidate?.[0]

      if (!hook) {
        throw new Error('beforeValidate hook not found')
      }

      // Test distance range validation: miles > 100 should fail
      const invalidMilesDistanceData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    distanceValue: 101, // Exceeds 100 mile limit
                    distanceUnit: 'miles',
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidMilesDistanceData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('distance cannot exceed 100 miles')

      // Test distance range validation: meters > 50000 should fail
      const invalidMetersDistanceData = {
        isPublished: true,
        name: 'Test Program',
        description: 'Test Description',
        objective: 'Test Objective',
        milestones: [
          {
            name: 'Test Milestone',
            theme: 'Test Theme',
            objective: 'Test Objective',
            days: [
              {
                dayType: 'workout',
                exercises: [
                  {
                    exercise: 'test-exercise-id',
                    sets: 3,
                    reps: 10,
                    distanceValue: 50001, // Exceeds 50,000 meter limit
                    distanceUnit: 'meters',
                  },
                ],
              },
            ],
          },
        ],
      }

      expect(() => {
        hook({
          data: invalidMetersDistanceData,
          operation: 'update',
          collection: {} as any,
          context: {} as any,
          req: {} as any,
        })
      }).toThrow('distance cannot exceed 50,000 meters')
    })

    it('should have proper cascade behavior configured through PayloadCMS', () => {
      // PayloadCMS handles cascade behavior automatically through relationships
      // This test verifies that all required relationships are properly configured
      // to ensure proper data integrity when records are deleted

      const requiredRelationships = [
        { collection: 'exerciseCompletions', field: 'productUser', required: true },
        { collection: 'exerciseCompletions', field: 'exercise', required: true },
      ]

      requiredRelationships.forEach(({ collection: collectionSlug, field, required }) => {
        const collection = getCollectionBySlug(collectionSlug)
        const fieldObj = getFieldByPath(collection, field.split('.'))

        expect(fieldObj, `Required field ${field} should exist in ${collectionSlug}`).toBeDefined()
        expect(fieldObj.required, `Field ${field} should be required`).toBe(required)
      })
    })

    it('should have all collection slugs properly registered in payload config', () => {
      const expectedSlugs = ['exercises', 'programs', 'productUsers', 'exerciseCompletions']

      expectedSlugs.forEach((slug) => {
        const collection = getCollectionBySlug(slug)
        expect(collection, `Collection ${slug} should be defined`).toBeDefined()
        expect(collection.slug, `Collection ${slug} should have correct slug`).toBe(slug)
      })
    })

    it('should have proper relationship validation configured', () => {
      // Test that all relationship fields have proper validation
      const relationshipFields = [
        { collection: ExerciseCompletions, field: 'productUser', required: true },
        { collection: ExerciseCompletions, field: 'exercise', required: true },
      ]

      relationshipFields.forEach(({ collection, field, required }) => {
        const fieldObj = collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect((fieldObj as any).type, `Field ${field} should be relationship type`).toBe(
          'relationship',
        )
        expect((fieldObj as any).required, `Field ${field} should be required: ${required}`).toBe(
          required,
        )
      })
    })
  })
})

// Helper functions for relationship verification tests
function getCollectionBySlug(slug: string) {
  const collections = {
    exercises: Exercises,
    programs: Programs,
    productUsers: ProductUsers,
    exerciseCompletions: ExerciseCompletions,
  }
  return collections[slug as keyof typeof collections]
}

function getFieldByPath(collection: any, fieldPath: string[]) {
  let current = collection.fields
  for (const fieldName of fieldPath) {
    const field = current?.find((f: any) => f.name === fieldName)
    if (!field) return undefined
    current = field.fields || field
  }
  return current
}

function hasRelationshipInArray(field: any) {
  return field.fields?.some((f: any) => f.type === 'relationship')
}
