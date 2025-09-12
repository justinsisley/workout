import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentProductUser } from '@/lib/auth-server'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { WorkoutDashboardClient } from './workout-dashboard-client'
import type { Program } from '@/types/program'

interface WorkoutDashboardServerProps {
  className?: string
}

export async function WorkoutDashboardServer({ className }: WorkoutDashboardServerProps) {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  // Initialize variables
  let program: Program | null = null
  let milestoneIndex = 0
  let dayIndex = 0
  let error: string | null = null
  let errorType: string | null = null

  // Fetch program data if user has one assigned
  if (currentUser.currentProgram) {
    try {
      const payload = await getPayload({ config: configPromise })

      const programId =
        typeof currentUser.currentProgram === 'string'
          ? currentUser.currentProgram
          : currentUser.currentProgram.id

      const fetchedProgram = await payload.findByID({
        collection: 'programs',
        id: programId,
        depth: 3, // Populate nested relationships including exercises
      })

      if (fetchedProgram) {
        program = fetchedProgram as Program
        milestoneIndex = currentUser.currentMilestone || 0
        dayIndex = currentUser.currentDay || 0
      } else {
        error = 'Your assigned program could not be found.'
        errorType = 'not_found'
      }
    } catch (err) {
      console.error('Error fetching program:', err)
      error = 'An error occurred while loading your program.'
      errorType = 'system_error'
    }
  } else {
    error = 'No workout program assigned. Please contact your trainer.'
    errorType = 'no_program'
  }

  return (
    <WorkoutDashboardClient
      initialProgram={program}
      initialMilestoneIndex={milestoneIndex}
      initialDayIndex={dayIndex}
      initialError={error}
      initialErrorType={errorType}
      className={className || ''}
    />
  )
}
