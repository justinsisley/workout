#!/usr/bin/env tsx

import {
  generateProgramDurationSummary,
  validateProgramDuration,
} from '../src/utils/program-duration'
import type { Program } from '../src/payload/payload-types'

// Mock program data for testing
const mockProgram: Program = {
  id: 'test-program-id',
  name: 'Foundation Strength Program',
  description: 'Build fundamental movement patterns and base strength',
  objective: 'Build foundational strength and muscle mass',
  milestones: [
    {
      name: 'Movement Foundation',
      theme: 'Foundation',
      objective: 'Learn proper form and movement patterns',
      days: [
        {
          dayType: 'workout',
          exercises: [
            {
              exercise: 'push-up-id',
              sets: 3,
              reps: 8,
              restPeriod: 60,
              weight: 0,
            },
            {
              exercise: 'plank-id',
              sets: 3,
              reps: 1,
              restPeriod: 30,
              durationValue: 30,
              durationUnit: 'seconds',
            },
          ],
        },
        {
          dayType: 'rest',
          restNotes: 'Active recovery - light walking recommended',
        },
        {
          dayType: 'workout',
          exercises: [
            {
              exercise: 'squat-id',
              sets: 3,
              reps: 12,
              restPeriod: 90,
              weight: 20,
            },
          ],
        },
      ],
    },
    {
      name: 'Strength Building',
      theme: 'Strength',
      objective: 'Increase strength and muscle mass',
      days: [
        {
          dayType: 'workout',
          exercises: [
            {
              exercise: 'deadlift-id',
              sets: 4,
              reps: 6,
              restPeriod: 120,
              weight: 135,
            },
          ],
        },
        {
          dayType: 'rest',
          restNotes: 'Complete rest day',
        },
      ],
    },
  ],
  isPublished: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function testDurationUtilities() {
  console.log('🧪 Testing Program Duration Utilities...')

  try {
    console.log('\n📊 Generating Program Duration Summary...')
    const summary = generateProgramDurationSummary(mockProgram)

    console.log('Program Duration Summary:')
    console.log(`- Total days: ${summary.totalDays}`)
    console.log(`- Workout days: ${summary.workoutDays}`)
    console.log(`- Rest days: ${summary.restDays}`)
    console.log(`- Estimated weeks: ${summary.estimatedWeeks}`)
    console.log(`- Average workout duration: ${summary.averageWorkoutDurationMinutes} minutes`)
    console.log(`- Total estimated workout hours: ${summary.totalEstimatedWorkoutHours}`)

    console.log('\nMilestone Breakdown:')
    summary.milestoneBreakdown.forEach((milestone, index) => {
      console.log(
        `  ${index + 1}. ${milestone.name}: ${milestone.days} days (${milestone.workoutDays} workout, ${milestone.restDays} rest)`,
      )
    })

    console.log('\n✅ Testing Program Validation...')
    const validation = validateProgramDuration(summary)

    console.log('Validation Results:')
    console.log(`- Is valid: ${validation.isValid}`)
    if (validation.warnings.length > 0) {
      console.log('- Warnings:')
      validation.warnings.forEach((warning) => console.log(`  • ${warning}`))
    }
    if (validation.recommendations.length > 0) {
      console.log('- Recommendations:')
      validation.recommendations.forEach((rec) => console.log(`  • ${rec}`))
    }

    console.log('\n🎯 Testing Edge Cases...')

    // Test empty program
    const emptyProgram: Program = {
      id: 'empty',
      milestones: [],
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const emptySummary = generateProgramDurationSummary(emptyProgram)
    console.log(`Empty program duration: ${emptySummary.totalDays} days`)

    // Test program with only rest days
    const restOnlyProgram: Program = {
      id: 'rest-only',
      milestones: [
        {
          name: 'Rest Phase',
          days: [
            { dayType: 'rest', restNotes: 'Rest day 1' },
            { dayType: 'rest', restNotes: 'Rest day 2' },
          ],
        },
      ],
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const restSummary = generateProgramDurationSummary(restOnlyProgram)
    console.log(
      `Rest-only program: ${restSummary.totalDays} total days, ${restSummary.workoutDays} workout days`,
    )

    console.log('\n🎉 All duration utility tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDurationUtilities()
}
