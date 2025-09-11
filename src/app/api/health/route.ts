import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { serverConfig, NODE_ENV } from '@/lib/config'

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'unknown',
        environment: 'healthy',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
    }

    // Check database connection
    try {
      const payload = await getPayload({
        config: configPromise,
      })
      // Simple database ping by trying to access the database
      await payload.find({
        collection: 'users',
        limit: 1,
      })
      healthCheck.services.database = 'healthy'
    } catch (error) {
      healthCheck.services.database = 'unhealthy'
      healthCheck.status = 'degraded'
      console.error('Database health check failed:', error)
    }

    // Check environment configuration
    try {
      // This will throw if required environment variables are missing
      const config = serverConfig()
      if (!config.DATABASE_URI || !config.PAYLOAD_SECRET) {
        throw new Error('Missing required environment variables')
      }
    } catch (error) {
      healthCheck.services.environment = 'unhealthy'
      healthCheck.status = 'unhealthy'
      console.error('Environment health check failed:', error)
    }

    const statusCode =
      healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: {
          api: 'unhealthy',
          database: 'unknown',
          environment: 'unknown',
        },
      },
      { status: 503 },
    )
  }
}
