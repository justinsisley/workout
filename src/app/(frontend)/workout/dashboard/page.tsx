import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentProductUser } from '@/lib/auth-server'

export default async function WorkoutDashboardPage() {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  // TODO: Add day overview, exercise list, progress indicators, and navigation components
  // This will be implemented in subsequent tasks

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Workout Dashboard</h1>

          {/* Placeholder content - will be replaced with actual components */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-600">
              Welcome to your workout dashboard. Components will be added in subsequent tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Static metadata for the page
export const metadata = {
  title: 'Workout Dashboard - Workout App',
  description: 'View your current workout day overview and track your progress',
}
