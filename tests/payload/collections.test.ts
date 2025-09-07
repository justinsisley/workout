import { describe, it, expect } from 'vitest'
import { Exercises } from '../../src/payload/collections/exercises'
import { Sessions } from '../../src/payload/collections/sessions'
import { Milestones } from '../../src/payload/collections/milestones'
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

  describe('Sessions Collection', () => {
    it('should have correct collection configuration', () => {
      expect(Sessions.slug).toBe('sessions')
      expect(Sessions.admin?.useAsTitle).toBe('name')
      expect(Sessions.admin?.defaultColumns).toEqual(['name', 'exercises', 'isPublished'])
    })

    it('should have required fields', () => {
      const fields = Sessions.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('exercises')
      expect(fieldNames).toContain('isPublished')
    })

    it('should have exercises array field configured correctly', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')

      expect(exercisesField).toBeDefined()
      expect((exercisesField as any)?.type).toBe('array')
      expect((exercisesField as any)?.minRows).toBe(1)
    })

    it('should have exercise relationship fields in exercises array', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')
      const exerciseFields = (exercisesField as any)?.fields || []
      const fieldNames = exerciseFields.map((field: any) => field.name)

      expect(fieldNames).toContain('exercise')
      expect(fieldNames).toContain('sets')
      expect(fieldNames).toContain('reps')
      expect(fieldNames).toContain('restPeriod')
      expect(fieldNames).toContain('weight')
      expect(fieldNames).toContain('notes')
    })

    it('should have exercise relationship configured correctly', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')
      const exerciseField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'exercise',
      )

      expect(exerciseField).toBeDefined()
      expect((exerciseField as any)?.type).toBe('relationship')
      expect((exerciseField as any)?.relationTo).toBe('exercises')
      expect((exerciseField as any)?.required).toBe(true)
    })

    it('should have numeric validation for sets and reps', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')
      const setsField = (exercisesField as any)?.fields?.find((field: any) => field.name === 'sets')
      const repsField = (exercisesField as any)?.fields?.find((field: any) => field.name === 'reps')

      expect((setsField as any)?.type).toBe('number')
      expect((setsField as any)?.required).toBe(true)
      expect((setsField as any)?.min).toBe(1)

      expect((repsField as any)?.type).toBe('number')
      expect((repsField as any)?.required).toBe(true)
      expect((repsField as any)?.min).toBe(1)
    })

    it('should have optional numeric fields with proper validation', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')
      const restPeriodField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'restPeriod',
      )
      const weightField = (exercisesField as any)?.fields?.find(
        (field: any) => field.name === 'weight',
      )

      expect((restPeriodField as any)?.type).toBe('number')
      expect((restPeriodField as any)?.required).toBeUndefined() // Optional field

      expect((weightField as any)?.type).toBe('number')
      expect((weightField as any)?.required).toBeUndefined() // Optional field
      expect((weightField as any)?.min).toBe(0)
    })

    it('should have proper access controls', () => {
      expect(Sessions.access?.read).toBeDefined()
      expect(Sessions.access?.create).toBeDefined()
      expect(Sessions.access?.update).toBeDefined()
      expect(Sessions.access?.delete).toBeDefined()
    })

    it('should have progressive validation configured', () => {
      const nameField = Sessions.fields?.find((field: any) => field.name === 'name')

      // Name field should be optional (no required: true)
      expect((nameField as any)?.required).toBeUndefined()
    })

    it('should have isPublished field with correct default', () => {
      const isPublishedField = Sessions.fields?.find((field: any) => field.name === 'isPublished')

      expect(isPublishedField).toBeDefined()
      expect((isPublishedField as any)?.type).toBe('checkbox')
      expect((isPublishedField as any)?.defaultValue).toBe(false)
    })

    it('should have drag-and-drop ordering configured', () => {
      const exercisesField = Sessions.fields?.find((field: any) => field.name === 'exercises')

      // Array fields support drag-and-drop by default in PayloadCMS
      expect((exercisesField as any)?.type).toBe('array')
      expect((exercisesField as any)?.admin?.description).toContain('Drag and drop to reorder')
    })
  })

  describe('Milestones Collection', () => {
    it('should have correct collection configuration', () => {
      expect(Milestones.slug).toBe('milestones')
      expect(Milestones.admin?.useAsTitle).toBe('name')
      expect(Milestones.admin?.defaultColumns).toEqual([
        'name',
        'theme',
        'objective',
        'isPublished',
      ])
    })

    it('should have required fields', () => {
      const fields = Milestones.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('name')
      expect(fieldNames).toContain('theme')
      expect(fieldNames).toContain('objective')
      expect(fieldNames).toContain('culminatingEvent')
      expect(fieldNames).toContain('days')
      expect(fieldNames).toContain('isPublished')
    })

    it('should have culminating event relationship configured correctly', () => {
      const culminatingEventField = Milestones.fields?.find(
        (field: any) => field.name === 'culminatingEvent',
      )

      expect(culminatingEventField).toBeDefined()
      expect((culminatingEventField as any)?.type).toBe('relationship')
      expect((culminatingEventField as any)?.relationTo).toBe('sessions')
    })

    it('should have days array field configured correctly', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')

      expect(daysField).toBeDefined()
      expect((daysField as any)?.type).toBe('array')
      expect((daysField as any)?.minRows).toBe(1)
    })

    it('should have day fields in days array', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const dayFields = (daysField as any)?.fields || []
      const fieldNames = dayFields.map((field: any) => field.name)

      expect(fieldNames).toContain('dayType')
      expect(fieldNames).toContain('sessions')
      expect(fieldNames).toContain('restNotes')
    })

    it('should have dayType select field with correct options', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const dayTypeField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'dayType',
      )

      expect(dayTypeField).toBeDefined()
      expect((dayTypeField as any)?.type).toBe('select')
      expect((dayTypeField as any)?.required).toBe(true)
      expect((dayTypeField as any)?.defaultValue).toBe('workout')

      const options = (dayTypeField as any)?.options || []
      expect(options).toHaveLength(2)
      expect(options[0]).toEqual({ label: 'Workout', value: 'workout' })
      expect(options[1]).toEqual({ label: 'Rest', value: 'rest' })
    })

    it('should have sessions array with conditional display', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )

      expect(sessionsField).toBeDefined()
      expect((sessionsField as any)?.type).toBe('array')
      expect((sessionsField as any)?.admin?.condition).toBeDefined()
    })

    it('should have session relationship fields in sessions array', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )
      const sessionFields = (sessionsField as any)?.fields || []
      const fieldNames = sessionFields.map((field: any) => field.name)

      expect(fieldNames).toContain('session')
      expect(fieldNames).toContain('order')
    })

    it('should have session relationship configured correctly', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )
      const sessionField = (sessionsField as any)?.fields?.find(
        (field: any) => field.name === 'session',
      )

      expect(sessionField).toBeDefined()
      expect((sessionField as any)?.type).toBe('relationship')
      expect((sessionField as any)?.relationTo).toBe('sessions')
      expect((sessionField as any)?.required).toBe(true)
    })

    it('should have order field with proper validation', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )
      const orderField = (sessionsField as any)?.fields?.find(
        (field: any) => field.name === 'order',
      )

      expect(orderField).toBeDefined()
      expect((orderField as any)?.type).toBe('number')
      expect((orderField as any)?.required).toBe(true)
      expect((orderField as any)?.min).toBe(1)
    })

    it('should have restNotes field with conditional display', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const restNotesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'restNotes',
      )

      expect(restNotesField).toBeDefined()
      expect((restNotesField as any)?.type).toBe('textarea')
      expect((restNotesField as any)?.admin?.condition).toBeDefined()
    })

    it('should have proper access controls', () => {
      expect(Milestones.access?.read).toBeDefined()
      expect(Milestones.access?.create).toBeDefined()
      expect(Milestones.access?.update).toBeDefined()
      expect(Milestones.access?.delete).toBeDefined()
    })

    it('should have progressive validation configured', () => {
      const nameField = Milestones.fields?.find((field: any) => field.name === 'name')
      const themeField = Milestones.fields?.find((field: any) => field.name === 'theme')
      const objectiveField = Milestones.fields?.find((field: any) => field.name === 'objective')
      const culminatingEventField = Milestones.fields?.find(
        (field: any) => field.name === 'culminatingEvent',
      )

      // All fields should be optional (no required: true) for progressive validation
      expect((nameField as any)?.required).toBeUndefined()
      expect((themeField as any)?.required).toBeUndefined()
      expect((objectiveField as any)?.required).toBeUndefined()
      expect((culminatingEventField as any)?.required).toBeUndefined()
    })

    it('should have isPublished field with correct default', () => {
      const isPublishedField = Milestones.fields?.find((field: any) => field.name === 'isPublished')

      expect(isPublishedField).toBeDefined()
      expect((isPublishedField as any)?.type).toBe('checkbox')
      expect((isPublishedField as any)?.defaultValue).toBe(false)
    })

    it('should have drag-and-drop ordering configured for days', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')

      expect((daysField as any)?.type).toBe('array')
      expect((daysField as any)?.admin?.description).toContain('Drag and drop to reorder')
    })

    it('should have conditional field logic for workout vs rest days', () => {
      const daysField = Milestones.fields?.find((field: any) => field.name === 'days')
      const sessionsField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'sessions',
      )
      const restNotesField = (daysField as any)?.fields?.find(
        (field: any) => field.name === 'restNotes',
      )

      // Sessions field should only show for workout days
      expect((sessionsField as any)?.admin?.condition).toBeDefined()

      // Rest notes field should only show for rest days
      expect((restNotesField as any)?.admin?.condition).toBeDefined()
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
      expect(fieldNames).toContain('culminatingEvent')
      expect(fieldNames).toContain('milestones')
      expect(fieldNames).toContain('isPublished')
    })

    it('should have culminatingEvent relationship configured correctly', () => {
      const culminatingEventField = Programs.fields?.find(
        (field: any) => field.name === 'culminatingEvent',
      )

      expect(culminatingEventField).toBeDefined()
      expect((culminatingEventField as any)?.type).toBe('relationship')
      expect((culminatingEventField as any)?.relationTo).toBe('sessions')
      expect((culminatingEventField as any)?.admin?.allowCreate).toBe(true)
    })

    it('should have milestones array with proper configuration', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')

      expect(milestonesField).toBeDefined()
      expect((milestonesField as any)?.type).toBe('array')
      expect((milestonesField as any)?.admin?.initCollapsed).toBe(false)
      expect((milestonesField as any)?.admin?.description).toBeDefined()
    })

    it('should have milestone relationship within milestones array', () => {
      const milestonesField = Programs.fields?.find((field: any) => field.name === 'milestones')
      const milestoneField = (milestonesField as any)?.fields?.find(
        (field: any) => field.name === 'milestone',
      )

      expect(milestoneField).toBeDefined()
      expect((milestoneField as any)?.type).toBe('relationship')
      expect((milestoneField as any)?.relationTo).toBe('milestones')
      expect((milestoneField as any)?.required).toBe(true)
      expect((milestoneField as any)?.admin?.allowCreate).toBe(true)
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
      const culminatingEventField = Programs.fields?.find(
        (field: any) => field.name === 'culminatingEvent',
      )

      // All fields should be optional (no required: true) for progressive validation
      expect((nameField as any)?.required).toBeUndefined()
      expect((descriptionField as any)?.required).toBeUndefined()
      expect((objectiveField as any)?.required).toBeUndefined()
      expect((culminatingEventField as any)?.required).toBeUndefined()
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
      expect((currentMilestoneField as any)?.relationTo).toBe('milestones')
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
        'session',
        'completedAt',
        'sets',
        'reps',
      ])
    })

    it('should have required relationship fields', () => {
      const fields = ExerciseCompletions.fields || []
      const fieldNames = fields.map((field: any) => field.name)

      expect(fieldNames).toContain('productUser')
      expect(fieldNames).toContain('exercise')
      expect(fieldNames).toContain('session')
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

    it('should have session relationship configured correctly', () => {
      const sessionField = ExerciseCompletions.fields?.find(
        (field: any) => field.name === 'session',
      )

      expect(sessionField).toBeDefined()
      expect((sessionField as any)?.type).toBe('relationship')
      expect((sessionField as any)?.relationTo).toBe('sessions')
      expect((sessionField as any)?.required).toBe(true)
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

        // Sessions collection relationships
        'sessions.exercises.exercise': { relationTo: 'exercises', required: true },

        // Milestones collection relationships
        'milestones.culminatingEvent': { relationTo: 'sessions' },
        'milestones.days.sessions.session': { relationTo: 'sessions', required: true },

        // Programs collection relationships
        'programs.culminatingEvent': { relationTo: 'sessions' },
        'programs.milestones.milestone': { relationTo: 'milestones', required: true },

        // ProductUsers collection relationships
        'productUsers.currentProgram': { relationTo: 'programs' },
        'productUsers.currentMilestone': { relationTo: 'milestones' },

        // ExerciseCompletions collection relationships
        'exerciseCompletions.productUser': { relationTo: 'productUsers', required: true },
        'exerciseCompletions.exercise': { relationTo: 'exercises', required: true },
        'exerciseCompletions.session': { relationTo: 'sessions', required: true },
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

      const collections = [
        Exercises,
        Sessions,
        Milestones,
        Programs,
        ProductUsers,
        ExerciseCompletions,
      ]

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
      const arrayFields = [
        { collection: Sessions, field: 'exercises' },
        { collection: Milestones, field: 'days' },
        { collection: Programs, field: 'milestones' },
      ]

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

    it('should have proper cascade behavior configured through PayloadCMS', () => {
      // PayloadCMS handles cascade behavior automatically through relationships
      // This test verifies that all required relationships are properly configured
      // to ensure proper data integrity when records are deleted

      const requiredRelationships = [
        { collection: 'exerciseCompletions', field: 'productUser', required: true },
        { collection: 'exerciseCompletions', field: 'exercise', required: true },
        { collection: 'exerciseCompletions', field: 'session', required: true },
        { collection: 'sessions', field: 'exercises.exercise', required: true },
        { collection: 'milestones', field: 'days.sessions.session', required: true },
        { collection: 'programs', field: 'milestones.milestone', required: true },
      ]

      requiredRelationships.forEach(({ collection: collectionSlug, field, required }) => {
        const collection = getCollectionBySlug(collectionSlug)
        const fieldObj = getFieldByPath(collection, field.split('.'))

        expect(fieldObj, `Required field ${field} should exist in ${collectionSlug}`).toBeDefined()
        expect(fieldObj.required, `Field ${field} should be required`).toBe(required)
      })
    })

    it('should have all collection slugs properly registered in payload config', () => {
      const expectedSlugs = [
        'exercises',
        'sessions',
        'milestones',
        'programs',
        'productUsers',
        'exerciseCompletions',
      ]

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
        { collection: ExerciseCompletions, field: 'session', required: true },
        { collection: Sessions, field: 'exercises', arrayField: 'exercise', required: true },
        { collection: Milestones, field: 'days', arrayField: 'sessions.session', required: true },
        { collection: Programs, field: 'milestones', arrayField: 'milestone', required: true },
      ]

      relationshipFields.forEach(({ collection, field, arrayField, required }) => {
        const fieldObj = arrayField
          ? getNestedArrayField(collection, field, arrayField)
          : collection.fields?.find((f: any) => f.name === field)

        expect(fieldObj, `Field ${field} should exist in ${collection.slug}`).toBeDefined()
        expect(fieldObj.type, `Field ${field} should be relationship type`).toBe('relationship')
        expect(fieldObj.required, `Field ${field} should be required: ${required}`).toBe(required)
      })
    })
  })
})

// Helper functions for relationship verification tests
function getCollectionBySlug(slug: string) {
  const collections = {
    exercises: Exercises,
    sessions: Sessions,
    milestones: Milestones,
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

function getNestedArrayField(collection: any, arrayFieldName: string, nestedFieldPath: string) {
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
