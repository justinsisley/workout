import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createProductUser,
  findProductUserByUsername,
  updateUserStatus,
  trackAuthenticationStatus,
  checkUsernameAvailability,
} from '@/actions/auth'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'

describe('Data Integrity Across Authentication Workflows', () => {
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
            contains: 'int_',
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

  describe('Complete User Registration Workflow', () => {
    it('should maintain data integrity throughout user registration process', async () => {
      const username = 'int_registration'

      // Step 1: Check username availability
      const availabilityCheck = await checkUsernameAvailability(username)
      expect(availabilityCheck.available).toBe(true)

      // Step 2: Create user (simulating successful passkey registration)
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      expect(createResult.productUserId).toBeDefined()

      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Step 3: Verify user can be found immediately after creation
      const lookupResult = await findProductUserByUsername(username)
      expect(lookupResult.success).toBe(true)
      expect(lookupResult.productUser).toBeDefined()
      expect(lookupResult.productUser?.id).toBe(userId)
      expect(lookupResult.productUser?.username).toBe(username)

      // Step 4: Check that username is no longer available
      const secondAvailabilityCheck = await checkUsernameAvailability(username)
      expect(secondAvailabilityCheck.available).toBe(false)

      // Step 5: Track initial registration authentication event
      const authTrackResult = await trackAuthenticationStatus(userId, {
        eventType: 'registration',
        timestamp: new Date().toISOString(),
        details: 'Initial user registration',
      })
      expect(authTrackResult.success).toBe(true)

      // Step 6: Track a login event to set lastAuthenticationDate
      const loginTrackResult = await trackAuthenticationStatus(userId, {
        eventType: 'login',
        timestamp: new Date().toISOString(),
        details: 'First login after registration',
      })
      expect(loginTrackResult.success).toBe(true)

      // Step 7: Verify user data integrity after all operations
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(finalUser.username).toBe(username)
      expect(finalUser.passkeyCredentials).toEqual([])
      expect(finalUser.totalWorkoutsCompleted).toBe(0)
      expect(finalUser.currentDay).toBe(1)
      expect(finalUser.lastAuthenticationDate).toBeDefined()
    })
  })

  describe('Complete Authentication Workflow', () => {
    it('should maintain data integrity throughout authentication process', async () => {
      const username = 'int_auth'

      // Pre-setup: Create a user
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Step 1: Lookup user for authentication (simulate passkey challenge generation)
      const initialLookup = await findProductUserByUsername(username)
      expect(initialLookup.success).toBe(true)
      expect(initialLookup.productUser?.id).toBe(userId)

      // Step 2: Track authentication attempt
      const authAttemptResult = await trackAuthenticationStatus(userId, {
        eventType: 'authentication_failure',
        timestamp: new Date().toISOString(),
        details: 'User attempting authentication',
      })
      expect(authAttemptResult.success).toBe(true)

      // Step 3: Simulate successful authentication (track login event)
      const loginResult = await trackAuthenticationStatus(userId, {
        eventType: 'login',
        timestamp: new Date().toISOString(),
        details: 'Successful authentication',
      })
      expect(loginResult.success).toBe(true)

      // Step 4: Update user activity data post-authentication
      const statusUpdate = await updateUserStatus(userId, {
        currentDay: 2,
        totalWorkoutsCompleted: 1,
        lastWorkoutDate: new Date().toISOString(),
      })
      expect(statusUpdate.success).toBe(true)

      // Step 5: Verify all data consistency after complete workflow
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(finalUser.username).toBe(username)
      expect(finalUser.currentDay).toBe(2)
      expect(finalUser.totalWorkoutsCompleted).toBe(1)
      expect(finalUser.lastWorkoutDate).toBeTruthy()
      expect(finalUser.lastAuthenticationDate).toBeTruthy()

      // Step 6: Verify user can still be found consistently
      const finalLookup = await findProductUserByUsername(username)
      expect(finalLookup.success).toBe(true)
      expect(finalLookup.productUser?.id).toBe(userId)
      expect(finalLookup.productUser?.currentDay).toBe(2)
      expect(finalLookup.productUser?.totalWorkoutsCompleted).toBe(1)
    })
  })

  describe('Multi-Session Data Integrity', () => {
    it('should maintain data integrity across multiple authentication sessions', async () => {
      const username = 'int_sessions'

      // Create user
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Simulate multiple authentication sessions
      const sessions = [
        { day: 1, workouts: 1 },
        { day: 3, workouts: 3 },
        { day: 5, workouts: 6 },
        { day: 7, workouts: 10 },
      ]

      for (const [index, session] of sessions.entries()) {
        // Authentication for each session
        const loginResult = await trackAuthenticationStatus(userId, {
          eventType: 'login',
          timestamp: new Date().toISOString(),
          details: `Session ${index + 1} login`,
        })
        expect(loginResult.success).toBe(true)

        // Update progress in each session
        const updateResult = await updateUserStatus(userId, {
          currentDay: session.day,
          totalWorkoutsCompleted: session.workouts,
          lastWorkoutDate: new Date().toISOString(),
        })
        expect(updateResult.success).toBe(true)

        // Verify data consistency after each session
        const userCheck = await findProductUserByUsername(username)
        expect(userCheck.success).toBe(true)
        expect(userCheck.productUser?.currentDay).toBe(session.day)
        expect(userCheck.productUser?.totalWorkoutsCompleted).toBe(session.workouts)
      }

      // Final integrity check
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(finalUser.username).toBe(username)
      expect(finalUser.currentDay).toBe(7)
      expect(finalUser.totalWorkoutsCompleted).toBe(10)
      expect(finalUser.lastAuthenticationDate).toBeTruthy()
      expect(finalUser.lastWorkoutDate).toBeTruthy()
    })
  })

  describe('Cross-Function Data Consistency', () => {
    it('should maintain consistency between different server actions', async () => {
      const username = 'int_cross_func'

      // Test data flows between all server actions
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Verify creation through lookup
      const lookupAfterCreate = await findProductUserByUsername(username)
      expect(lookupAfterCreate.success).toBe(true)
      expect(lookupAfterCreate.productUser?.id).toBe(userId)

      // Update status and verify through lookup
      const updateResult = await updateUserStatus(userId, {
        currentDay: 15,
        totalWorkoutsCompleted: 20,
      })
      expect(updateResult.success).toBe(true)

      const lookupAfterUpdate = await findProductUserByUsername(username)
      expect(lookupAfterUpdate.success).toBe(true)
      expect(lookupAfterUpdate.productUser?.currentDay).toBe(15)
      expect(lookupAfterUpdate.productUser?.totalWorkoutsCompleted).toBe(20)

      // Track authentication and verify through lookup
      const authResult = await trackAuthenticationStatus(userId, {
        eventType: 'login',
        timestamp: new Date().toISOString(),
      })
      expect(authResult.success).toBe(true)

      const lookupAfterAuth = await findProductUserByUsername(username)
      expect(lookupAfterAuth.success).toBe(true)
      expect(lookupAfterAuth.productUser?.lastAuthenticationDate).toBeTruthy()

      // Verify final state consistency across all access methods
      const directDbLookup = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      const serverActionLookup = await findProductUserByUsername(username)
      expect(serverActionLookup.success).toBe(true)

      // Both methods should return consistent data
      expect(directDbLookup.username).toBe(serverActionLookup.productUser?.username)
      expect(directDbLookup.currentDay).toBe(serverActionLookup.productUser?.currentDay)
      expect(directDbLookup.totalWorkoutsCompleted).toBe(
        serverActionLookup.productUser?.totalWorkoutsCompleted,
      )
      expect(directDbLookup.lastAuthenticationDate).toBe(
        serverActionLookup.productUser?.lastAuthenticationDate,
      )
    })
  })

  describe('Database Transaction Integrity', () => {
    it('should maintain database consistency during operation failures', async () => {
      const username = 'int_transactions'

      // Create user
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Get initial state
      const initialState = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      // Attempt invalid operation that should fail
      const invalidUpdate = await updateUserStatus('invalid-user-id', {
        totalWorkoutsCompleted: 100,
      })
      expect(invalidUpdate.success).toBe(false)

      // Verify original user data is unchanged
      const stateAfterFailure = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(stateAfterFailure.username).toBe(initialState.username)
      expect(stateAfterFailure.totalWorkoutsCompleted).toBe(initialState.totalWorkoutsCompleted)
      expect(stateAfterFailure.currentDay).toBe(initialState.currentDay)

      // Perform valid operation to ensure system still works
      const validUpdate = await updateUserStatus(userId, {
        totalWorkoutsCompleted: 5,
      })
      expect(validUpdate.success).toBe(true)
      expect(validUpdate.productUser?.totalWorkoutsCompleted).toBe(5)
    })
  })

  describe('Username Uniqueness Integrity', () => {
    it('should maintain username uniqueness across all operations', async () => {
      const baseUsername = 'int_unique'
      const userIds: string[] = []

      // Create multiple users with different usernames
      for (let i = 1; i <= 3; i++) {
        const username = `${baseUsername}_${i}`

        // Verify username is available
        const availability = await checkUsernameAvailability(username)
        expect(availability.available).toBe(true)

        // Create user
        const createResult = await createProductUser(username)
        expect(createResult.success).toBe(true)
        userIds.push(createResult.productUserId!)
        testUserIds.push(createResult.productUserId!)

        // Verify username is no longer available
        const postCreateAvailability = await checkUsernameAvailability(username)
        expect(postCreateAvailability.available).toBe(false)
      }

      // Verify all users exist and have unique usernames
      for (let i = 0; i < userIds.length; i++) {
        const expectedUsername = `${baseUsername}_${i + 1}`

        const user = await payload.findByID({
          collection: 'productUsers',
          id: userIds[i],
        })

        expect(user.username).toBe(expectedUsername)

        // Verify lookup works for each user
        const lookupResult = await findProductUserByUsername(expectedUsername)
        expect(lookupResult.success).toBe(true)
        expect(lookupResult.productUser?.id).toBe(userIds[i])
      }

      // Verify cannot create duplicate usernames
      for (let i = 1; i <= 3; i++) {
        const duplicateAttempt = await createProductUser(`${baseUsername}_${i}`)
        expect(duplicateAttempt.success).toBe(false)
      }
    })
  })

  describe('Temporal Data Integrity', () => {
    it('should maintain correct timestamp ordering and data integrity', async () => {
      const username = 'int_temporal'

      // Create user
      const createResult = await createProductUser(username)
      expect(createResult.success).toBe(true)
      const userId = createResult.productUserId!
      testUserIds.push(userId)

      // Track multiple authentication events with specific timestamps
      const baseTime = new Date('2025-01-01T10:00:00Z')
      const events = [
        { type: 'login', offset: 0, details: 'First login' },
        { type: 'activity', offset: 1000, details: 'User activity' },
        { type: 'login', offset: 2000, details: 'Second login' },
        { type: 'logout', offset: 3000, details: 'Logout' },
      ]

      let lastAuthDate: string | null = null

      for (const event of events) {
        const timestamp = new Date(baseTime.getTime() + event.offset).toISOString()

        const result = await trackAuthenticationStatus(userId, {
          eventType: event.type as any,
          timestamp,
          details: event.details,
        })
        expect(result.success).toBe(true)

        // For login events, check that lastAuthenticationDate is updated
        if (event.type === 'login') {
          const user = await payload.findByID({
            collection: 'productUsers',
            id: userId,
          })
          expect(user.lastAuthenticationDate).toBeTruthy()

          if (lastAuthDate) {
            // Ensure timestamp is more recent than previous login
            expect(new Date(user.lastAuthenticationDate).getTime()).toBeGreaterThanOrEqual(
              new Date(lastAuthDate).getTime(),
            )
          }
          lastAuthDate = user.lastAuthenticationDate
        }
      }

      // Verify final state maintains temporal integrity
      const finalUser = await payload.findByID({
        collection: 'productUsers',
        id: userId,
      })

      expect(finalUser.lastAuthenticationDate).toBeTruthy()
      expect(new Date(finalUser.lastAuthenticationDate).getTime()).toBeGreaterThanOrEqual(
        new Date(baseTime.getTime() + 2000).getTime(), // Should be from second login or later
      )
    })
  })
})
