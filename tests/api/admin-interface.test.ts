import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

describe('Admin Interface Integration Tests', () => {
  let payload: any
  let testUserIds: string[] = []
  let testProgramId: string

  beforeAll(async () => {
    payload = await getPayload({ config: configPromise })

    // Create a test program for relationships
    const testProgram = await payload.create({
      collection: 'programs',
      data: {
        name: 'Test Program',
        description: 'Test program for admin interface tests',
        difficulty: 'beginner',
        duration: 30,
        milestones: [
          {
            name: 'Test Milestone 1',
            description: 'First milestone',
            duration: 10,
            days: [
              {
                dayNumber: 1,
                exercises: [],
              },
            ],
          },
        ],
      },
    })
    testProgramId = testProgram.id
  })

  beforeEach(async () => {
    // Clean up test data
    try {
      const existingUsers = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'admintest',
          },
        },
      })

      for (const user of existingUsers.docs) {
        await payload.delete({
          collection: 'productUsers',
          id: user.id,
        })
      }
    } catch (error) {
      // Ignore if no users exist
    }
    testUserIds = []
  })

  afterAll(async () => {
    // Clean up all test data
    for (const id of testUserIds) {
      try {
        await payload.delete({
          collection: 'productUsers',
          id,
        })
      } catch (error) {
        // Ignore if user doesn't exist
      }
    }

    // Clean up test program
    try {
      await payload.delete({
        collection: 'programs',
        id: testProgramId,
      })
    } catch (error) {
      // Ignore if program doesn't exist
    }
  })

  describe('ProductUsers Collection Admin Interface', () => {
    it('should create product user through PayloadCMS admin interface', async () => {
      const userData = {
        username: 'admintest_user1',
        passkeyCredentials: [],
        currentProgram: testProgramId,
        currentMilestone: testProgramId,
        currentDay: 1,
        totalWorkoutsCompleted: 0,
        lastWorkoutDate: null,
        lastAuthenticationDate: new Date().toISOString(),
      }

      const result = await payload.create({
        collection: 'productUsers',
        data: userData,
      })

      expect(result).toBeDefined()
      expect(result.username).toBe('admintest_user1')
      expect(
        typeof result.currentProgram === 'object'
          ? result.currentProgram.id
          : result.currentProgram,
      ).toBe(testProgramId)
      expect(
        typeof result.currentMilestone === 'object'
          ? result.currentMilestone.id
          : result.currentMilestone,
      ).toBe(testProgramId)
      expect(result.currentDay).toBe(1)

      testUserIds.push(result.id)
    })

    it('should find and filter users by username', async () => {
      // Create test users
      const user1 = await payload.create({
        collection: 'productUsers',
        data: {
          username: 'admintest_filter1',
          passkeyCredentials: [],
          currentProgram: testProgramId,
        },
      })

      const user2 = await payload.create({
        collection: 'productUsers',
        data: {
          username: 'admintest_filter2',
          passkeyCredentials: [],
          currentProgram: testProgramId,
        },
      })

      testUserIds.push(user1.id, user2.id)

      // Test filtering by username
      const filteredResults = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'admintest_filter1',
          },
        },
      })

      expect(filteredResults.docs).toHaveLength(1)
      expect(filteredResults.docs[0].username).toBe('admintest_filter1')
    })

    it('should update user status through admin interface', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'productUsers',
        data: {
          username: 'admintest_update',
          passkeyCredentials: [],
          currentProgram: testProgramId,
          currentMilestone: testProgramId,
          currentDay: 1,
          totalWorkoutsCompleted: 0,
        },
      })

      testUserIds.push(user.id)

      // Update the user
      const updatedUser = await payload.update({
        collection: 'productUsers',
        id: user.id,
        data: {
          currentDay: 5,
          totalWorkoutsCompleted: 10,
          lastWorkoutDate: new Date().toISOString(),
        },
      })

      expect(updatedUser.currentDay).toBe(5)
      expect(updatedUser.totalWorkoutsCompleted).toBe(10)
      expect(updatedUser.lastWorkoutDate).toBeTruthy()
    })

    it('should enforce username uniqueness constraint', async () => {
      const username = 'admintest_unique'

      // Create first user
      const user1 = await payload.create({
        collection: 'productUsers',
        data: {
          username,
          passkeyCredentials: [],
          currentProgram: testProgramId,
        },
      })

      testUserIds.push(user1.id)

      // Try to create second user with same username - should fail
      await expect(
        payload.create({
          collection: 'productUsers',
          data: {
            username,
            passkeyCredentials: [],
            currentProgram: testProgramId,
          },
        }),
      ).rejects.toThrow()
    })

    it('should validate username format requirements', async () => {
      // Test username too short
      await expect(
        payload.create({
          collection: 'productUsers',
          data: {
            username: 'ab', // Too short
            passkeyCredentials: [],
            currentProgram: 'beginner',
          },
        }),
      ).rejects.toThrow()

      // Test invalid characters
      await expect(
        payload.create({
          collection: 'productUsers',
          data: {
            username: 'admin test!', // Invalid characters
            passkeyCredentials: [],
            currentProgram: 'beginner',
          },
        }),
      ).rejects.toThrow()
    })

    it('should display proper admin columns', async () => {
      // Create test user with all relevant fields
      const user = await payload.create({
        collection: 'productUsers',
        data: {
          username: 'admintest_columns',
          passkeyCredentials: [],
          currentProgram: testProgramId,
          currentMilestone: testProgramId,
          currentDay: 15,
          totalWorkoutsCompleted: 25,
        },
      })

      testUserIds.push(user.id)

      // Verify all admin-relevant fields are present
      const retrievedUser = await payload.findByID({
        collection: 'productUsers',
        id: user.id,
      })

      // These are the fields configured for defaultColumns in the admin
      expect(retrievedUser.username).toBe('admintest_columns')
      expect(
        typeof retrievedUser.currentProgram === 'object'
          ? retrievedUser.currentProgram.id
          : retrievedUser.currentProgram,
      ).toBe(testProgramId)
      expect(
        typeof retrievedUser.currentMilestone === 'object'
          ? retrievedUser.currentMilestone.id
          : retrievedUser.currentMilestone,
      ).toBe(testProgramId)
      expect(retrievedUser.currentDay).toBe(15)
    })

    it('should support bulk operations through admin interface', async () => {
      // Create multiple test users
      const users = []
      for (let i = 1; i <= 3; i++) {
        const user = await payload.create({
          collection: 'productUsers',
          data: {
            username: `admintest_bulk${i}`,
            passkeyCredentials: [],
            currentProgram: testProgramId,
            currentDay: 1,
          },
        })
        users.push(user)
        testUserIds.push(user.id)
      }

      // Find all test users
      const allTestUsers = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'admintest_bulk',
          },
        },
      })

      expect(allTestUsers.docs).toHaveLength(3)

      // Bulk update - simulate admin bulk operation
      for (const user of allTestUsers.docs) {
        await payload.update({
          collection: 'productUsers',
          id: user.id,
          data: {
            totalWorkoutsCompleted: 5,
          },
        })
      }

      // Verify updates
      const updatedUsers = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'admintest_bulk',
          },
        },
      })

      updatedUsers.docs.forEach((user: any) => {
        expect(user.totalWorkoutsCompleted).toBe(5)
      })
    })
  })

  describe('Admin Interface Security and Access', () => {
    it('should properly handle passkey credentials storage', async () => {
      const mockCredential = {
        credentialID: 'test-credential-id',
        publicKey: 'mock-public-key',
        counter: 0,
        deviceType: 'singleDevice' as const,
        backedUp: false,
        transports: [{ transport: 'internal' }],
        registrationDate: new Date().toISOString(),
      }

      const user = await payload.create({
        collection: 'productUsers',
        data: {
          username: 'admintest_security',
          passkeyCredentials: [mockCredential],
          currentProgram: testProgramId,
        },
      })

      testUserIds.push(user.id)

      expect(user.passkeyCredentials).toHaveLength(1)
      expect(user.passkeyCredentials[0].credentialID).toBe('test-credential-id')
      expect(user.passkeyCredentials[0].deviceType).toBe('singleDevice')
    })

    it('should validate required fields for admin operations', async () => {
      // Username is required
      await expect(
        payload.create({
          collection: 'productUsers',
          data: {
            passkeyCredentials: [],
            currentProgram: testProgramId,
          },
        }),
      ).rejects.toThrow()
    })
  })
})
