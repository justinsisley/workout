'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsernameRegistration } from '@/components/auth/username-registration'
import { PasskeyRegistration } from '@/components/auth/passkey-registration'
import { useAuthStore } from '@/stores/auth-store'

type RegistrationStep = 'username' | 'passkey' | 'complete'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [step, setStep] = useState<RegistrationStep>('username')
  const [username, setUsername] = useState<string>('')

  // Redirect to app if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/app')
    }
  }, [isAuthenticated, router])

  const handleUsernameSuccess = (confirmedUsername: string) => {
    setUsername(confirmedUsername)
    setStep('passkey')
  }

  const handlePasskeySuccess = () => {
    setStep('complete')
    // Redirect to app after a brief success message
    setTimeout(() => {
      router.push('/app')
    }, 2000)
  }

  if (isAuthenticated) {
    return null // Prevent flash of content while redirecting
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏋️‍♂️</div>
          <h1 className="text-3xl font-bold text-gray-900">Get Started</h1>
          <p className="text-gray-600 mt-2">Create your account in just two simple steps</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${step === 'username' ? 'text-blue-600' : step === 'passkey' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'username' ? 'bg-blue-100' : step === 'passkey' || step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              {step === 'passkey' || step === 'complete' ? '✓' : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Username</span>
          </div>
          <div
            className={`w-8 h-px ${step === 'passkey' || step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}
          ></div>
          <div
            className={`flex items-center ${step === 'passkey' ? 'text-blue-600' : step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'passkey' ? 'bg-blue-100' : step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              {step === 'complete' ? '✓' : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Passkey</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'username' && 'Choose Your Username'}
              {step === 'passkey' && 'Create Your Passkey'}
              {step === 'complete' && 'Account Created!'}
            </CardTitle>
            <CardDescription>
              {step === 'username' && 'Pick a unique username for your account'}
              {step === 'passkey' && 'Secure your account with a passkey'}
              {step === 'complete' && 'Welcome to Workout App! Redirecting you now...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'username' && (
              <UsernameRegistration onUsernameConfirmed={handleUsernameSuccess} />
            )}
            {step === 'passkey' && (
              <PasskeyRegistration
                username={username}
                onRegistrationComplete={handlePasskeySuccess}
              />
            )}
            {step === 'complete' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-lg font-medium text-green-600 mb-2">Success!</p>
                <p className="text-gray-600">
                  Your account has been created successfully. You&apos;ll be redirected to your
                  dashboard momentarily.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 'username' && (
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Button variant="link" asChild className="p-0 h-auto font-semibold">
                <Link href="/login">Sign in here</Link>
              </Button>
            </p>
          </div>
        )}

        <div className="text-center">
          <Button variant="ghost" asChild className="text-gray-500">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
