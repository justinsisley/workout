'use client'

import React, { useState } from 'react'
import { ProgramCard } from './program-card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { ProgramPreview } from '@/types/program'
import { assignProgramToUser } from '@/actions/programs'

interface ProgramSelectorProps {
  programs: ProgramPreview[]
  className?: string
}

export const ProgramSelector: React.FC<ProgramSelectorProps> = ({ programs, className }) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const selectedProgram = programs.find((p) => p.id === selectedProgramId)

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId)
    setShowConfirmation(true)
    setError(null)
  }

  const handleConfirmSelection = async () => {
    if (!selectedProgramId) return

    setIsAssigning(true)
    setError(null)

    try {
      const result = await assignProgramToUser(selectedProgramId)

      if (result.success) {
        // Show success feedback briefly before redirecting
        setShowSuccess(true)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000) // Show success for 2 seconds then redirect
      } else {
        setError(result.error || 'Failed to assign program')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleCancelSelection = () => {
    setShowConfirmation(false)
    setSelectedProgramId(null)
    setError(null)
    setShowSuccess(false)
  }

  if (programs.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl">🏃‍♀️</div>
          <div className="space-y-2">
            <div className="text-gray-900 text-xl font-semibold">No Programs Available</div>
            <div className="text-gray-600">
              We&apos;re working on adding new workout programs. Check back soon for exciting
              fitness challenges!
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  // Show confirmation dialog
  if (showConfirmation && selectedProgram) {
    return (
      <div className={cn('max-w-md mx-auto', className)}>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          {showSuccess ? (
            <>
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold text-green-600">
                  Program Assigned Successfully!
                </h2>
                <p className="text-gray-600 mt-2">
                  You&apos;re all set! Redirecting you to your dashboard...
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Confirm Program Selection</h2>

              <div className="space-y-2">
                <p className="text-gray-700">You are about to start the program:</p>
                <div className="bg-gray-50 rounded p-3">
                  <div className="font-medium">{selectedProgram.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{selectedProgram.objective}</div>
                  <div className="text-sm text-purple-600 mt-2">
                    {selectedProgram.estimatedDuration} • {selectedProgram.totalWorkoutDays} workout
                    days
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <div className="text-red-800 text-sm">{error}</div>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCancelSelection}
                  variant="outline"
                  className="flex-1"
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmSelection} className="flex-1" disabled={isAssigning}>
                  {isAssigning ? 'Assigning...' : 'Start Program'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Show program selection list
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Program</h1>
        <p className="text-gray-600">
          Select a fitness program that matches your goals and experience level
        </p>
      </div>

      <div
        className={cn(
          'grid gap-6 justify-items-center',
          programs.length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : programs.length === 2
              ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
              : 'md:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            onSelect={handleProgramSelect}
            className={programs.length === 1 ? 'w-full' : ''}
          />
        ))}
      </div>
    </div>
  )
}
