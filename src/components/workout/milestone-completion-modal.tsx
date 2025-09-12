'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  CheckCircle,
  Calendar,
  Target,
  ArrowRight,
  Star,
  Award,
  Zap,
  Activity,
  TrendingUp,
} from 'lucide-react'
import { formatDuration } from '@/utils/formatting'
import type { ProgramMilestone } from '@/types/program'

export interface MilestoneCompletionModalProps {
  completedMilestone: ProgramMilestone
  nextMilestone?: {
    milestone: ProgramMilestone
    milestoneIndex: number
  } | null
  milestoneStats: {
    totalDays: number
    completedDays: number
    completionPercentage: number
    isLastMilestone: boolean
  }
  programStats?: {
    totalWorkoutsCompleted: number
    totalTimeSpent: number // in milliseconds
    programName: string
  }
  onAdvanceToNextMilestone: () => void
  onFinishProgram: () => void
  onViewProgress: () => void
  isLoading?: boolean
  isProgramComplete: boolean
}

export function MilestoneCompletionModal({
  completedMilestone,
  nextMilestone,
  milestoneStats,
  programStats,
  onAdvanceToNextMilestone,
  onFinishProgram,
  onViewProgress,
  isLoading = false,
  isProgramComplete,
}: MilestoneCompletionModalProps) {
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Celebration Header */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Trophy className="h-16 w-16 text-amber-500 animate-bounce" />
              <Star className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-amber-900 leading-tight">
              {isProgramComplete ? 'Program Complete!' : 'Milestone Achieved!'}
            </h2>
            <p className="text-amber-700 text-sm font-medium">
              {isProgramComplete
                ? 'Congratulations on finishing your entire program!'
                : `You&apos;ve completed &ldquo;${completedMilestone.name}&rdquo;`}
            </p>
          </div>

          {/* Achievement Badge */}
          <Badge
            variant="secondary"
            className="bg-amber-200 text-amber-800 border-amber-300 font-semibold px-4 py-2"
          >
            <Award className="h-4 w-4 mr-2" />
            {isProgramComplete ? 'Program Master' : 'Milestone Champion'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Milestone Stats */}
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                Milestone Progress
              </h3>
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                100% Complete
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {milestoneStats.completedDays}
                </div>
                <div className="text-sm text-gray-600">Days Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{milestoneStats.totalDays}</div>
                <div className="text-sm text-gray-600">Total Days</div>
              </div>
            </div>
          </div>

          {/* Program Stats (if provided) */}
          {programStats && (
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Overall Progress
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="text-amber-600 hover:text-amber-700"
                >
                  {showStats ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {showStats && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Workouts Completed
                    </span>
                    <span className="font-semibold text-gray-900">
                      {programStats.totalWorkoutsCompleted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Time Invested
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(Math.floor(programStats.totalTimeSpent / 1000))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          {!isProgramComplete && nextMilestone && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Next Challenge
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Ready to tackle &ldquo;{nextMilestone.milestone.name}&rdquo;?
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CheckCircle className="h-4 w-4" />
                <span>New exercises and challenges await!</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isProgramComplete ? (
              <>
                <Button
                  onClick={onFinishProgram}
                  disabled={isLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  {isLoading ? 'Finishing...' : 'Finish Program'}
                </Button>
                <Button
                  onClick={onViewProgress}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 py-4"
                >
                  View Full Progress
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onAdvanceToNextMilestone}
                  disabled={isLoading || !nextMilestone}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  {isLoading ? 'Advancing...' : 'Continue to Next Milestone'}
                </Button>
                <Button
                  onClick={onViewProgress}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-4"
                >
                  View Progress
                </Button>
              </>
            )}
          </div>

          {/* Motivational Message */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600 italic">
              {isProgramComplete
                ? 'You&apos;ve accomplished something amazing! 🎉'
                : 'Every milestone brings you closer to your goals! 💪'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
