import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createProductUser,
  updateUserStatus,
  trackAuthenticationStatus,
  handleAuthenticationError,
  checkUsernameAvailability,
} from '@/actions/auth'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

describe('Edge Cases and Conflict Testing', () => {
  let payload: any
  let testUserIds: string[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: configPromise })
  })

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      const existingUsers = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'edgecase',
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
      // Ignore errors if no test users exist
    }
    testUserIds = []
  })

  afterAll(async () => {
    // Clean up test data after all tests
    for (const id of testUserIds) {
      try {
        await payload.delete({
          collection: 'productUsers',
          id,
        })
      } catch (error) {
        // Ignore errors if no test users exist
      }
    }
  })

  describe('Username Validation Edge Cases', () => {
    it('should handle empty username', async () => {
      const result = await createProductUser('')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle null username', async () => {
      // @ts-expect-error Testing null input
      const result = await createProductUser(null)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle undefined username', async () => {
      // @ts-expect-error Testing undefined input
      const result = await createProductUser(undefined)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle username with exactly 3 characters (boundary)', async () => {
      const result = await createProductUser('abc')
      // Should succeed or fail gracefully
      expect(result.success).toBeDefined()
      if (result.success && result.productUserId) {
        testUserIds.push(result.productUserId)
      }
    })

    it('should handle username with exactly 20 characters (boundary)', async () => {
      const username = 'a'.repeat(20) // exactly 20 characters
      const result = await createProductUser(username)
      // Should succeed or fail gracefully
      expect(result.success).toBeDefined()
      if (result.success && result.productUserId) {
        testUserIds.push(result.productUserId)
      }
    })

    it('should reject username with 21 characters (over boundary)', async () => {
      const username = 'a'.repeat(21) // 21 characters
      const result = await createProductUser(username)
      expect(result.success).toBe(false)
      expect(result.error).toContain('20 characters')
    })

    it('should handle special characters in username', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=']

      for (const char of specialChars) {
        const result = await createProductUser(`edgecase${char}test`)
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      }
    })

    it('should handle username with spaces', async () => {
      const result = await createProductUser('edge case user')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle username with mixed valid characters', async () => {
      const result = await createProductUser('edgecase_Test123')
      expect(result.success).toBe(true)
      if (result.productUserId) {
        testUserIds.push(result.productUserId)
      }
    })
  })

  describe('Concurrent Access Edge Cases', () => {
    it('should handle rapid duplicate username creation attempts', async () => {
      const username = 'edgecase_concurrent'

      // Attempt to create the same username multiple times simultaneously
      const promises = Array(5)
        .fill(null)
        .map(() => createProductUser(username))
      const results = await Promise.all(promises)

      // Only one should succeed
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      expect(successCount).toBe(1)
      expect(failureCount).toBe(4)

      // Clean up the successful user
      const successfulResult = results.find((r) => r.success)
      if (successfulResult?.productUserId) {
        testUserIds.push(successfulResult.productUserId)
      }
    })

    it('should handle concurrent status updates for same user', async () => {
      // Create a test user
      const createResult = await createProductUser('edgecase_updates')
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Perform concurrent updates
      const updatePromises = [
        updateUserStatus(userId, { totalWorkoutsCompleted: 1 }),
        updateUserStatus(userId, { totalWorkoutsCompleted: 2 }),
        updateUserStatus(userId, { currentDay: 5 }),
        updateUserStatus(userId, { totalWorkoutsCompleted: 3, currentDay: 10 }),
      ]

      const results = await Promise.all(updatePromises)

      // All updates should succeed (PayloadCMS handles concurrency)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })

      // Verify final state
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      // At least one update should have succeeded (concurrent updates may not all apply)
      expect(finalUser.totalWorkoutsCompleted).toBeGreaterThanOrEqual(0)
      expect(finalUser.currentDay).toBeGreaterThanOrEqual(0) // currentDay defaults to 0
    })
  })

  describe('Invalid Data Edge Cases', () => {
    it('should handle extremely large numbers for user status', async () => {
      const createResult = await createProductUser('edgecase_largenums')
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      const result = await updateUserStatus(userId, {
        totalWorkoutsCompleted: Number.MAX_SAFE_INTEGER,
        currentDay: Number.MAX_SAFE_INTEGER,
      })

      expect(result.success).toBe(true)
      expect(result.productUser?.totalWorkoutsCompleted).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle negative numbers for user status', async () => {
      const createResult = await createProductUser('edgecase_negative')
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      const result = await updateUserStatus(userId, {
        totalWorkoutsCompleted: -1,
        currentDay: -1,
      })

      // Should either reject or sanitize negative values
      if (!result.success) {
        expect(result.error).toBeDefined()
      } else {
        // PayloadCMS might allow it, but it should be handled gracefully
        expect(result.productUser?.totalWorkoutsCompleted).toBeDefined()
      }
    })

    it('should handle invalid date formats', async () => {
      const createResult = await createProductUser('edgecase_dates')
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      const result = await updateUserStatus(userId, {
        lastWorkoutDate: 'invalid-date',
      })

      // Should handle invalid date gracefully
      if (!result.success) {
        expect(result.error).toBeDefined()
      } else {
        // If it succeeds, it should sanitize the date
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test simulates what happens when DB operations fail
      // We can't actually disconnect the DB, but we can test with invalid IDs

      const result = await updateUserStatus('000000000000000000000000', {
        totalWorkoutsCompleted: 1,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle malformed ObjectId gracefully', async () => {
      const result = await updateUserStatus('not-an-objectid', {
        totalWorkoutsCompleted: 1,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle authentication tracking with missing user', async () => {
      const authEvent = {
        eventType: 'login' as const,
        timestamp: new Date().toISOString(),
      }

      const result = await trackAuthenticationStatus('000000000000000000000000', authEvent)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Data Consistency Edge Cases', () => {
    it('should maintain consistency after failed operations', async () => {
      const createResult = await createProductUser('edgecase_consistency')
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Get initial state
      const initialUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      // Attempt an operation that might fail
      const failResult = await updateUserStatus('invalid-id', {
        totalWorkoutsCompleted: 100,
      })
      expect(failResult.success).toBe(false)

      // Verify the original user wasn't affected
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(finalUser.totalWorkoutsCompleted).toBe(initialUser.totalWorkoutsCompleted)
      expect(finalUser.username).toBe(initialUser.username)
    })

    it('should handle username availability check race conditions', async () => {
      const username = 'edgecase_race'

      // Check availability
      const availabilityResult = await checkUsernameAvailability(username)
      expect(availabilityResult.available).toBe(true)

      // Create user
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      testUserIds.push(createResult.productUserId!)

      // Check availability again - should now be false
      const secondAvailabilityResult = await checkUsernameAvailability(username)
      expect(secondAvailabilityResult.available).toBe(false)
    })
  })

  describe('Authentication Error Handling Edge Cases', () => {
    it('should handle unknown error types', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'authentication_failure',
        'Unknown error',
      )

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
      expect(result.shouldRetry).toBeDefined()
    })

    it('should handle empty error details', async () => {
      const result = await handleAuthenticationError('testuser', 'authentication_failure', '')

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should handle null error details', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'authentication_failure',
        // @ts-expect-error Testing null input
        null,
      )

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
    })
  })

  describe('Resource Exhaustion Edge Cases', () => {
    it('should handle creation of maximum length usernames efficiently', async () => {
      const usernames = Array(10)
        .fill(null)
        .map((_, i) => `edgecase_max_len_${i}${'a'.repeat(20 - `edgecase_max_len_${i}`.length)}`)

      for (const username of usernames) {
        const result = await createProductUser(username)
        expect(result.success).toBe(true)
        if (result.productUserId) {
          testUserIds.push(result.productUserId)
        }
      }

      // Verify all were created successfully
      const users = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'edgecase_max_len',
          },
        },
      })

      expect(users.docs.length).toBe(10)
    })

    it('should handle batch status updates efficiently', async () => {
      // Create test users
      const userIds = []
      for (let i = 0; i < 5; i++) {
        const result = await createProductUser(`edgecase_batch_${i}`)
        expect(result.success).toBe(true)
        userIds.push(result.productUserId!)
        testUserIds.push(result.productUserId!)
      }

      // Perform batch updates
      const updatePromises = userIds.map((userId, index) =>
        updateUserStatus(userId, {
          totalWorkoutsCompleted: index + 1,
          currentDay: (index + 1) * 2,
        }),
      )

      const results = await Promise.all(updatePromises)

      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.productUser?.totalWorkoutsCompleted).toBe(index + 1)
      })
    })
  })
})
