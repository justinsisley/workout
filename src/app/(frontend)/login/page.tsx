'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasskeyAuthentication } from '@/components/auth/passkey-authentication'
import { useAuthStore } from '@/stores/auth-store'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/app'
  const { isAuthenticated } = useAuthStore()

  // Redirect to app if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath)
    }
  }, [isAuthenticated, router, redirectPath])

  const handleLoginSuccess = () => {
    router.push(redirectPath)
  }

  if (isAuthenticated) {
    return null // Prevent flash of content while redirecting
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🏋️‍♂️</div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your fitness journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Use your username and passkey to securely sign in</CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeyAuthentication onAuthenticationComplete={handleLoginSuccess} />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/register">Create one here</Link>
            </Button>
          </p>
        </div>

        <div className="text-center">
          <Button variant="ghost" asChild className="text-gray-500">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
    >
      <LoginContent />
    </Suspense>
  )
}
