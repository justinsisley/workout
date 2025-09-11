'use client'

import Link from 'next/link'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export default function HomePage() {
  const { productUser, isAuthenticated, logout } = useAuthStore()

  return (
    <div className="flex flex-col justify-between items-center h-screen p-11 max-w-4xl mx-auto overflow-hidden max-[400px]:p-6">
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="text-6xl mb-8">🏋️‍♂️</div>

        {!isAuthenticated && (
          <>
            <h1 className="text-center my-10 text-6xl leading-[70px] font-bold max-lg:my-6 max-lg:text-[42px] max-lg:leading-[42px] max-md:text-[38px] max-md:leading-[38px] max-[400px]:text-[32px] max-[400px]:leading-[32px]">
              Welcome to Workout App
            </h1>
            <p className="text-center text-gray-600 mb-8 max-w-2xl">
              Track your fitness journey with our comprehensive workout program. Get started by
              creating an account with just a username and passkey.
            </p>
            <div className="flex items-center gap-4">
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </>
        )}

        {isAuthenticated && productUser && (
          <>
            <h1 className="text-center my-10 text-6xl leading-[70px] font-bold max-lg:my-6 max-lg:text-[42px] max-lg:leading-[42px] max-md:text-[38px] max-md:leading-[38px] max-[400px]:text-[32px] max-[400px]:leading-[32px]">
              Welcome back, {productUser.username}!
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Ready to continue your fitness journey?
            </p>
            <div className="flex items-center gap-4">
              <Button asChild>
                <Link href="/app">Go to Workouts</Link>
              </Button>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 max-lg:flex-col max-lg:gap-1.5">
        <p className="m-0 text-gray-500">Secure authentication with WebAuthN passkeys</p>
      </div>
    </div>
  )
}
