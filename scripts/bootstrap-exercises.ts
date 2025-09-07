#!/usr/bin/env node

/**
 * Bootstrap Exercises Script
 *
 * This script reads the master_exercise_list.csv file and populates the exercises collection
 * with the exercise data including titles, descriptions, and video URLs. Exercises are created
 * as drafts (not published) so they can be reviewed before publishing.
 *
 * CSV Format: Exercise,Description,VideoURL
 *
 * Usage:
 *   npm run bootstrap:exercises
 *   or
 *   npx tsx scripts/bootstrap-exercises.ts
 */

import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload/payload.config.js'

interface ExerciseData {
  Exercise: string
  Description: string
  VideoURL: string
}

interface ProcessedExercise {
  title: string
  description: string
  videoUrl: string
  isPublished: false
}

async function bootstrapExercises() {
  console.log('🚀 Starting exercise bootstrap process...')

  // Check for required environment variables
  if (!process.env.PAYLOAD_SECRET) {
    console.error('❌ PAYLOAD_SECRET environment variable is required')
    console.log('💡 Set it with: export PAYLOAD_SECRET="your-secret-key-here"')
    process.exit(1)
  }

  if (!process.env.DATABASE_URI) {
    console.error('❌ DATABASE_URI environment variable is required')
    console.log('💡 Set it with: export DATABASE_URI="mongodb://localhost:27017/workout-app"')
    process.exit(1)
  }

  try {
    // Initialize Payload
    const payload = await getPayload({ config })
    console.log('✅ Payload initialized successfully')

    // Read and parse CSV file
    const csvPath = path.join(process.cwd(), 'scripts', 'master_exercise_list.csv')
    const exercises: ProcessedExercise[] = []

    console.log(`📖 Reading CSV file: ${csvPath}`)

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data: ExerciseData) => {
          // Skip empty rows
          if (data.Exercise && data.Description && data.VideoURL) {
            exercises.push({
              title: data.Exercise.trim(),
              description: data.Description.trim(),
              videoUrl: data.VideoURL.trim(),
              isPublished: false,
            })
          }
        })
        .on('end', () => {
          console.log(`📊 Parsed ${exercises.length} exercises from CSV`)
          resolve()
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV file:', error)
          reject(error)
        })
    })

    if (exercises.length === 0) {
      console.log('⚠️  No exercises found in CSV file')
      return
    }

    // Check for existing exercises to avoid duplicates
    console.log('🔍 Checking for existing exercises...')
    const existingExercises = await payload.find({
      collection: 'exercises',
      limit: 1000, // Get all exercises
    })

    const existingTitles = new Set(
      existingExercises.docs.map((ex) => ex.title?.toLowerCase()).filter(Boolean),
    )

    // Filter out exercises that already exist
    const newExercises = exercises.filter(
      (exercise) => !existingTitles.has(exercise.title.toLowerCase()),
    )

    if (newExercises.length === 0) {
      console.log('✅ All exercises already exist in the database')
      return
    }

    console.log(`📝 Creating ${newExercises.length} new exercises...`)

    // Create exercises in batches to avoid overwhelming the database
    const batchSize = 10
    let created = 0

    for (let i = 0; i < newExercises.length; i += batchSize) {
      const batch = newExercises.slice(i, i + batchSize)

      const createPromises = batch.map(async (exercise) => {
        try {
          const result = await payload.create({
            collection: 'exercises',
            data: exercise,
          })
          console.log(`✅ Created: ${exercise.title}`)
          return result
        } catch (error) {
          console.error(`❌ Failed to create "${exercise.title}":`, error)
          throw error
        }
      })

      await Promise.all(createPromises)
      created += batch.length
      console.log(`📈 Progress: ${created}/${newExercises.length} exercises created`)
    }

    console.log(`🎉 Successfully created ${created} exercises!`)
    console.log('📋 Next steps:')
    console.log('   1. Review the exercises in the Payload admin panel')
    console.log('   2. Update video URLs with exercise-specific videos if needed')
    console.log('   3. Publish exercises when ready')
  } catch (error) {
    console.error('❌ Bootstrap process failed:', error)
    process.exit(1)
  } finally {
    // Close the database connection
    process.exit(0)
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapExercises()
}

export { bootstrapExercises }
