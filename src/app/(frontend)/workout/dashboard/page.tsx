import React from 'react'
import { WorkoutDashboardServer } from '@/components/workout/workout-dashboard-server'

export default async function WorkoutDashboardPage() {
  return <WorkoutDashboardServer />
}

// Static metadata for the page
export const metadata = {
  title: 'Workout Dashboard - Workout App',
  description: 'View your current workout day overview and track your progress',
}
