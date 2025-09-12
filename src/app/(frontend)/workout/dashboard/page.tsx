import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentProductUser } from '@/lib/auth-server'
import { WorkoutDashboardClient } from '@/components/workout/workout-dashboard-client'

export default async function WorkoutDashboardPage() {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  return <WorkoutDashboardClient />
}

// Static metadata for the page
export const metadata = {
  title: 'Workout Dashboard - Workout App',
  description: 'View your current workout day overview and track your progress',
}
