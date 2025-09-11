import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createProductUser,
  findProductUserByUsername,
  updateUserStatus,
  trackAuthenticationStatus,
  handleAuthenticationError,
  checkUsernameAvailability,
} from '@/actions/auth'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

describe('User Management Server Actions', () => {
  let payload: any
  let testUserId: string

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
            contains: 'test',
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
  })

  afterAll(async () => {
    // Clean up test data after all tests
    try {
      const existingUsers = await payload.find({
        collection: 'productUsers',
        where: {
          username: {
            contains: 'test',
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
  })

  describe('createProductUser', () => {
    it('should create a new product user successfully', async () => {
      const username = 'testuser123'
      const result = await createProductUser(username)

      expect(result.success).toBe(true)
      expect(result.productUserId).toBeDefined()
      expect(result.error).toBeUndefined()

      testUserId = result.productUserId!
    })

    it('should fail to create user with invalid username', async () => {
      const username = 'a' // Too short
      const result = await createProductUser(username)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.productUserId).toBeUndefined()
    })

    it('should fail to create duplicate user', async () => {
      const username = 'testuser456'

      // Create first user
      const firstResult = await createProductUser(username)
      expect(firstResult.success).toBe(true)

      // Try to create second user with same username
      const secondResult = await createProductUser(username)
      expect(secondResult.success).toBe(false)
      expect(secondResult.error).toContain('already taken')
    })
  })

  describe('findProductUserByUsername', () => {
    beforeEach(async () => {
      // Create a test user for lookup tests
      const createResult = await createProductUser('testlookup123')
      expect(createResult.success).toBe(true)
      testUserId = createResult.productUserId!
    })

    it('should find existing user by username', async () => {
      const result = await findProductUserByUsername('testlookup123')

      expect(result.success).toBe(true)
      expect(result.productUser).toBeDefined()
      expect(result.productUser?.username).toBe('testlookup123')
      expect(result.error).toBeUndefined()
    })

    it('should fail to find non-existent user', async () => {
      const result = await findProductUserByUsername('nonexistentuser')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
      expect(result.productUser).toBeUndefined()
    })

    it('should fail with invalid username format', async () => {
      const result = await findProductUserByUsername('ab') // Too short

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateUserStatus', () => {
    beforeEach(async () => {
      // Create a test user for status update tests
      const createResult = await createProductUser('testupdate123')
      expect(createResult.success).toBe(true)
      testUserId = createResult.productUserId!
    })

    it('should update user status successfully', async () => {
      const statusUpdate = {
        currentDay: 5,
        totalWorkoutsCompleted: 10,
        lastWorkoutDate: new Date().toISOString(),
      }

      const result = await updateUserStatus(testUserId, statusUpdate)

      expect(result.success).toBe(true)
      expect(result.productUser).toBeDefined()
      expect(result.productUser?.currentDay).toBe(5)
      expect(result.productUser?.totalWorkoutsCompleted).toBe(10)
      expect(result.productUser?.lastWorkoutDate).toBeDefined()
    })

    it('should fail with invalid user ID', async () => {
      const statusUpdate = { totalWorkoutsCompleted: 1 }
      const result = await updateUserStatus('invalid-id', statusUpdate)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should update partial status fields', async () => {
      const statusUpdate = { totalWorkoutsCompleted: 5 }
      const result = await updateUserStatus(testUserId, statusUpdate)

      expect(result.success).toBe(true)
      expect(result.productUser?.totalWorkoutsCompleted).toBe(5)
    })
  })

  describe('trackAuthenticationStatus', () => {
    beforeEach(async () => {
      // Create a test user for authentication tracking tests
      const createResult = await createProductUser('testauth123')
      expect(createResult.success).toBe(true)
      testUserId = createResult.productUserId!
    })

    it('should track login event successfully', async () => {
      const authEvent = {
        eventType: 'login' as const,
        timestamp: new Date().toISOString(),
        details: 'Test login event',
      }

      const result = await trackAuthenticationStatus(testUserId, authEvent)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      // Verify the user was updated with lastAuthenticationDate
      const updatedUser = await payload.findByID({
        collection: 'productUsers',
        id: testUserId,
      })
      expect(updatedUser.lastAuthenticationDate).toBeTruthy()
    })

    it('should track other event types without updating user', async () => {
      const authEvent = {
        eventType: 'logout' as const,
        details: 'Test logout event',
      }

      const result = await trackAuthenticationStatus(testUserId, authEvent)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail with invalid user ID', async () => {
      const authEvent = {
        eventType: 'login' as const,
      }

      const result = await trackAuthenticationStatus('invalid-id', authEvent)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('handleAuthenticationError', () => {
    it('should handle duplicate user error', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'duplicate_user',
        'Username already exists',
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('already taken')
      expect(result.shouldRetry).toBe(true)
    })

    it('should handle authentication failure', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'authentication_failure',
        'Invalid credentials',
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Authentication failed')
      expect(result.shouldRetry).toBe(true)
    })

    it('should handle rate limit exceeded', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'rate_limit_exceeded',
        'Too many attempts',
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Too many authentication attempts')
      expect(result.shouldRetry).toBe(false)
    })

    it('should handle invalid credentials', async () => {
      const result = await handleAuthenticationError(
        'testuser',
        'invalid_credentials',
        'Credentials not found',
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid username or passkey')
      expect(result.shouldRetry).toBe(true)
    })
  })

  describe('checkUsernameAvailability', () => {
    it('should return available for new username', async () => {
      const result = await checkUsernameAvailability('newavailableuser123')

      expect(result.available).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return not available for existing username', async () => {
      // First create a user
      const username = 'testexistinguser123'
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)

      // Then check availability
      const result = await checkUsernameAvailability(username)

      expect(result.available).toBe(false)
      expect(result.error).toBe('Username is already taken')
    })

    it('should validate username format', async () => {
      const result = await checkUsernameAvailability('ab') // Too short

      expect(result.available).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
