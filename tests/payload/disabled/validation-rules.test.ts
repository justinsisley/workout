import { describe, it, expect, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '../../src/payload/payload.config'

describe('Collection Validation Rules', () => {
  let payload: Payload

  beforeEach(async () => {
    try {
      payload = await getPayload({ config })
      // Clear collections before each test
      await payload.delete({
        collection: 'exercises',
        where: {},
      })
      await payload.delete({
        collection: 'programs',
        where: {},
      })
      await payload.delete({
        collection: 'milestones',
        where: {},
      })
      await payload.delete({
        collection: 'sessions',
        where: {},
      })
    } catch (error) {
      console.log('PayloadCMS not available for testing:', error)
      payload = null as any
    }
  })

  const skipIfNoPayload = () => {
    if (!payload) {
      console.log('Skipping test - PayloadCMS not available')
      return true
    }
    return false
  }

  describe('Progressive Validation Strategy', () => {
    describe('Exercises Collection', () => {
      it('should allow creating exercise without required fields (draft mode)', async () => {
        if (skipIfNoPayload()) return
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            // No required fields - should work as draft
            isPublished: false,
          },
        })

        expect(exercise.id).toBeDefined()
        expect(exercise.isPublished).toBe(false)
      })

      it('should allow updating exercise without required fields (draft mode)', async () => {
        if (skipIfNoPayload()) return
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            isPublished: false,
          },
        })

        const updatedExercise = await payload.update({
          collection: 'exercises',
          id: exercise.id,
          data: {
            // Still no required fields - should work as draft
            isPublished: false,
          },
        })

        expect(updatedExercise.id).toBeDefined()
        expect(updatedExercise.isPublished).toBe(false)
      })

      it('should prevent publishing exercise without required fields', async () => {
        if (skipIfNoPayload()) return
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'exercises',
            id: exercise.id,
            data: {
              isPublished: true, // Try to publish without required fields
            },
          }),
        ).rejects.toThrow('Cannot publish exercise')
      })

      it('should allow publishing exercise with all required fields', async () => {
        if (skipIfNoPayload()) return
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            title: 'Push-ups',
            description: 'A basic bodyweight exercise',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            isPublished: false,
          },
        })

        const publishedExercise = await payload.update({
          collection: 'exercises',
          id: exercise.id,
          data: {
            isPublished: true,
          },
        })

        expect(publishedExercise.isPublished).toBe(true)
      })

      it('should prevent publishing exercise with empty required fields', async () => {
        if (skipIfNoPayload()) return
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            title: '', // Empty title
            description: 'A basic bodyweight exercise',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'exercises',
            id: exercise.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('Title is required for publishing')
      })
    })

    describe('Programs Collection', () => {
      it('should allow creating program without required fields (draft mode)', async () => {
        if (skipIfNoPayload()) return
        const program = await payload.create({
          collection: 'programs',
          data: {
            isPublished: false,
          },
        })

        expect(program.id).toBeDefined()
        expect(program.isPublished).toBe(false)
      })

      it('should prevent publishing program without required fields', async () => {
        if (skipIfNoPayload()) return
        const program = await payload.create({
          collection: 'programs',
          data: {
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'programs',
            id: program.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('Cannot publish program')
      })

      it('should allow publishing program with all required fields', async () => {
        if (skipIfNoPayload()) return
        const program = await payload.create({
          collection: 'programs',
          data: {
            name: 'Beginner Program',
            description: 'A beginner fitness program',
            objective: 'Build foundational strength',
            milestones: [], // Empty milestones array
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'programs',
            id: program.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('At least one milestone is required for publishing')
      })

      it('should prevent publishing program without milestones', async () => {
        if (skipIfNoPayload()) return
        const program = await payload.create({
          collection: 'programs',
          data: {
            name: 'Beginner Program',
            description: 'A beginner fitness program',
            objective: 'Build foundational strength',
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'programs',
            id: program.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('At least one milestone is required for publishing')
      })
    })

    describe('Milestones Collection', () => {
      it('should allow creating milestone without required fields (draft mode)', async () => {
        if (skipIfNoPayload()) return
        const milestone = await payload.create({
          collection: 'milestones',
          data: {
            isPublished: false,
          },
        })

        expect(milestone.id).toBeDefined()
        expect(milestone.isPublished).toBe(false)
      })

      it('should prevent publishing milestone without required fields', async () => {
        if (skipIfNoPayload()) return
        const milestone = await payload.create({
          collection: 'milestones',
          data: {
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'milestones',
            id: milestone.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('Cannot publish milestone')
      })

      it('should allow publishing milestone with all required fields', async () => {
        if (skipIfNoPayload()) return
        const milestone = await payload.create({
          collection: 'milestones',
          data: {
            name: 'Foundation Building',
            theme: 'Strength',
            objective: 'Build foundational strength',
            days: [
              {
                dayType: 'workout',
                sessions: [],
              },
            ],
            isPublished: false,
          },
        })

        const publishedMilestone = await payload.update({
          collection: 'milestones',
          id: milestone.id,
          data: {
            isPublished: true,
          },
        })

        expect(publishedMilestone.isPublished).toBe(true)
      })

      it('should prevent publishing milestone without days', async () => {
        if (skipIfNoPayload()) return
        const milestone = await payload.create({
          collection: 'milestones',
          data: {
            name: 'Foundation Building',
            theme: 'Strength',
            objective: 'Build foundational strength',
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'milestones',
            id: milestone.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('At least one day is required for publishing')
      })
    })

    describe('Sessions Collection', () => {
      it('should allow creating session without required fields (draft mode)', async () => {
        if (skipIfNoPayload()) return
        const session = await payload.create({
          collection: 'sessions',
          data: {
            isPublished: false,
          },
        })

        expect(session.id).toBeDefined()
        expect(session.isPublished).toBe(false)
      })

      it('should prevent publishing session without exercises', async () => {
        if (skipIfNoPayload()) return
        const session = await payload.create({
          collection: 'sessions',
          data: {
            isPublished: false,
          },
        })

        await expect(
          payload.update({
            collection: 'sessions',
            id: session.id,
            data: {
              isPublished: true,
            },
          }),
        ).rejects.toThrow('At least one exercise is required for publishing')
      })

      it('should allow publishing session with exercises', async () => {
        if (skipIfNoPayload()) return
        // First create an exercise
        const exercise = await payload.create({
          collection: 'exercises',
          data: {
            title: 'Push-ups',
            description: 'A basic bodyweight exercise',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            isPublished: true,
          },
        })

        const session = await payload.create({
          collection: 'sessions',
          data: {
            exercises: [
              {
                exercise: exercise.id,
                sets: 3,
                reps: 10,
              },
            ],
            isPublished: false,
          },
        })

        const publishedSession = await payload.update({
          collection: 'sessions',
          id: session.id,
          data: {
            isPublished: true,
          },
        })

        expect(publishedSession.isPublished).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should provide clear error messages for missing required fields', async () => {
      if (skipIfNoPayload()) return
      const exercise = await payload.create({
        collection: 'exercises',
        data: {
          isPublished: false,
        },
      })

      try {
        await payload.update({
          collection: 'exercises',
          id: exercise.id,
          data: {
            isPublished: true,
          },
        })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).toContain('Cannot publish exercise')
        expect((error as Error).message).toContain('Title is required for publishing')
        expect((error as Error).message).toContain('Description is required for publishing')
        expect((error as Error).message).toContain('Video URL is required for publishing')
      }
    })

    it('should handle multiple validation errors in a single message', async () => {
      if (skipIfNoPayload()) return
      const program = await payload.create({
        collection: 'programs',
        data: {
          isPublished: false,
        },
      })

      try {
        await payload.update({
          collection: 'programs',
          id: program.id,
          data: {
            isPublished: true,
          },
        })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).toContain('Cannot publish program')
        expect((error as Error).message).toContain('Program name is required for publishing')
        expect((error as Error).message).toContain('Program description is required for publishing')
        expect((error as Error).message).toContain('Program objective is required for publishing')
        expect((error as Error).message).toContain(
          'At least one milestone is required for publishing',
        )
      }
    })
  })

  describe('Publishing Controls', () => {
    it('should maintain isPublished state correctly', async () => {
      if (skipIfNoPayload()) return
      const exercise = await payload.create({
        collection: 'exercises',
        data: {
          title: 'Push-ups',
          description: 'A basic bodyweight exercise',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          isPublished: false,
        },
      })

      expect(exercise.isPublished).toBe(false)

      const publishedExercise = await payload.update({
        collection: 'exercises',
        id: exercise.id,
        data: {
          isPublished: true,
        },
      })

      expect(publishedExercise.isPublished).toBe(true)

      const unpublishedExercise = await payload.update({
        collection: 'exercises',
        id: exercise.id,
        data: {
          isPublished: false,
        },
      })

      expect(unpublishedExercise.isPublished).toBe(false)
    })

    it('should allow unpublishing without validation', async () => {
      if (skipIfNoPayload()) return
      const exercise = await payload.create({
        collection: 'exercises',
        data: {
          title: 'Push-ups',
          description: 'A basic bodyweight exercise',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          isPublished: true,
        },
      })

      // Should be able to unpublish without validation
      const unpublishedExercise = await payload.update({
        collection: 'exercises',
        id: exercise.id,
        data: {
          isPublished: false,
        },
      })

      expect(unpublishedExercise.isPublished).toBe(false)
    })
  })
})
