import { describe, it, expect } from 'vitest'
import { Exercises } from '../../src/payload/collections/exercises'
import { Sessions } from '../../src/payload/collections/sessions'

describe('PayloadCMS Collections', () => {
  describe('Exercises Collection', () => {
    it('should have correct collection configuration', () => {
      expect(Exercises.slug).toBe('exercises')
      expect(Exercises.admin?.useAsTitle).toBe('title')
      expect(Exercises.admin?.defaultColumns).toEqual(['title', 'description', 'videoUrl'])
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
      expect(Sessions.admin?.defaultColumns).toEqual(['name', 'exercises'])
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
})
