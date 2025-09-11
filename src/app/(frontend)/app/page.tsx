'use client'

import Link from 'next/link'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export default function AppPage() {
  const { productUser, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {productUser?.username}! 🏋️‍♂️
            </h1>
            <p className="text-gray-600 mt-1">Your fitness journey starts here</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📋 My Programs</CardTitle>
              <CardDescription>View and manage your workout programs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Browse through your assigned workout programs and track your progress.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📊 Progress Tracking</CardTitle>
              <CardDescription>Monitor your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Track your workouts, milestones, and overall progress over time.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">⚙️ Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Update your profile, notification preferences, and account settings.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Success message */}
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-green-800">Authentication Successful!</h3>
                <p className="text-green-700 text-sm">
                  You&apos;ve successfully signed in using WebAuthN passkey authentication. This
                  protected page demonstrates that the authentication flow is working correctly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium">{productUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account ID:</span>
                <span className="font-mono text-sm">{productUser?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Authentication Method:</span>
                <span className="font-medium">WebAuthN Passkey</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
