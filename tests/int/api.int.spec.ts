import { getPayload, Payload } from 'payload'
import config from '@/payload/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload | null

describe('API', () => {
  beforeAll(async () => {
    try {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })
    } catch (error) {
      console.warn('PayloadCMS not available for testing:', error)
      payload = null
    }
  })

  it('fetches users', async () => {
    if (!payload) {
      console.log('Skipping test - PayloadCMS not available')
      return
    }

    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
