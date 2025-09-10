'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  checkUsernameAvailability,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from '@/actions/auth'

// Form validation schema
const registrationFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens',
    ),
})

type RegistrationFormData = z.infer<typeof registrationFormSchema>

interface PasskeyRegistrationProps {
  onRegistrationComplete?: (productUserId: string) => void
}

export function PasskeyRegistration({ onRegistrationComplete }: PasskeyRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [registrationStep, setRegistrationStep] = useState<'username' | 'passkey' | 'complete'>(
    'username',
  )
  const [, setProductUserId] = useState<string>('')

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      username: '',
    },
  })

  const handleUsernameSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Check username availability
      const availabilityResult = await checkUsernameAvailability(data.username)

      if (!availabilityResult.available) {
        setError(availabilityResult.error || 'Username is not available')
        return
      }

      // Generate passkey registration options
      const registrationResult = await generatePasskeyRegistrationOptions(data.username)

      if (
        !registrationResult.success ||
        !registrationResult.registrationOptions ||
        !registrationResult.productUserId
      ) {
        setError(registrationResult.error || 'Failed to generate registration options')
        return
      }

      // Store product user ID for next step
      setProductUserId(registrationResult.productUserId)

      // Start WebAuthN registration with browser
      try {
        const registrationResponse = await startRegistration({
          optionsJSON: registrationResult.registrationOptions,
        })

        // Verify the registration response with the server
        const verificationResult = await verifyPasskeyRegistration(
          registrationResult.productUserId,
          registrationResponse,
        )

        if (!verificationResult.success) {
          setError(verificationResult.error || 'Registration verification failed')
          return
        }

        setSuccess('Passkey registration successful!')
        setRegistrationStep('complete')

        // Notify parent component
        onRegistrationComplete?.(registrationResult.productUserId)
      } catch (webauthnError) {
        console.error('WebAuthN registration error:', webauthnError)
        setError('Passkey registration failed. Please ensure your device supports passkeys.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetRegistration = () => {
    setRegistrationStep('username')
    setError(null)
    setSuccess(null)
    setProductUserId('')
    form.reset()
  }

  if (registrationStep === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Registration Complete</CardTitle>
          <CardDescription>Your passkey has been successfully registered</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <Button onClick={resetRegistration} variant="outline" className="w-full">
            Register Another Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Your Account</CardTitle>
        <CardDescription>Register with a username and passkey for secure access</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUsernameSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      {...field}
                      disabled={isLoading}
                      className="text-base" // Better for mobile
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating Account...' : 'Create Account with Passkey'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-sm text-muted-foreground">
          <p className="text-center">
            Your device will prompt you to create a passkey using your fingerprint, face, or PIN.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
