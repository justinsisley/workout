import React from 'react'
import { redirect } from 'next/navigation'
import { ProgramSelector } from '@/components/program/program-selector'
import { Alert } from '@/components/ui/alert'
import { getCurrentProductUser } from '@/lib/auth-server'
import { getPrograms } from '@/actions/programs'
import { generateProgramPreview } from '@/lib/program-utils'
import type { ProgramPreview } from '@/types/program'

export default async function ProgramsPage() {
  // Check authentication
  const currentUser = await getCurrentProductUser()
  if (!currentUser) {
    redirect('/login')
  }

  // Fetch programs
  const result = await getPrograms()

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto border-red-200 bg-red-50">
          <div className="text-red-800">
            <div className="font-medium">Unable to load programs</div>
            <div className="text-sm mt-1">{result.error || 'Please try again later'}</div>
          </div>
        </Alert>
      </div>
    )
  }

  // Generate program previews with enhanced structure information
  const programPreviews: ProgramPreview[] =
    result.programs?.map((program) => generateProgramPreview(program)) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgramSelector programs={programPreviews} />
      </div>
    </div>
  )
}

// Static metadata for the page
export const metadata = {
  title: 'Choose Your Program - Workout App',
  description: 'Select from our available fitness programs to start your workout journey',
}
