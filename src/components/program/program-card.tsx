'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProgramPreview } from '@/types/program'

interface ProgramCardProps {
  program: ProgramPreview
  onSelect: (programId: string) => void
  className?: string
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onSelect, className }) => {
  return (
    <Card className={cn('p-6 space-y-4 hover:shadow-md transition-shadow', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{program.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{program.description}</p>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Objective</h4>
        <p className="text-gray-700 text-sm">{program.objective}</p>
      </div>

      {/* Program Statistics */}
      <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{program.totalMilestones}</div>
          <div className="text-xs text-gray-500">Milestones</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{program.totalWorkoutDays}</div>
          <div className="text-xs text-gray-500">Workout Days</div>
        </div>
      </div>

      {/* Duration */}
      <div className="text-center py-2">
        <div className="text-sm font-medium text-gray-900">Estimated Duration</div>
        <div className="text-lg font-semibold text-purple-600">{program.estimatedDuration}</div>
      </div>

      {/* Milestone Preview */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-900">Program Structure</h4>
        <div className="space-y-2">
          {program.milestonePreview.map((milestone, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="space-y-1">
                <div className="font-medium text-gray-700">{milestone.name}</div>
                <div className="text-xs text-gray-500">{milestone.theme}</div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{milestone.dayCount} days</div>
                <div>{milestone.workoutDayCount} workouts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Select Button */}
      <div className="pt-4 border-t border-gray-100">
        <Button onClick={() => onSelect(program.id)} className="w-full" size="lg">
          Select This Program
        </Button>
      </div>
    </Card>
  )
}
