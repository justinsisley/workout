'use client'

import { useState, useEffect, useRef } from 'react'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Loader2, AlertTriangle, Smartphone } from 'lucide-react'

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
import { useAuthStore } from '@/stores/auth-store'
import { storeToken } from '@/lib/auth'

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
  username?: string // Optional username to pre-fill or skip username entry
  onRegistrationComplete?: (productUserId: string) => void
}

export function PasskeyRegistration({
  username,
  onRegistrationComplete,
}: PasskeyRegistrationProps) {
  const { setProductUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [registrationStep, setRegistrationStep] = useState<'username' | 'passkey' | 'complete'>(
    username ? 'passkey' : 'username',
  )
  const [, setProductUserId] = useState<string>('')
  const [browserSupportsPasskeys, setBrowserSupportsPasskeys] = useState<boolean>(true)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)
  const autoRegistrationAttempted = useRef(false)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      username: username || '',
    },
  })

  // Check browser WebAuthN support on component mount
  useEffect(() => {
    const checkBrowserSupport = async () => {
      try {
        const supportsWebAuthn = browserSupportsWebAuthn()

        // Additional checks for passkey-specific features
        const hasCredentialsCreate = typeof navigator?.credentials?.create === 'function'
        const hasCredentialsGet = typeof navigator?.credentials?.get === 'function'
        const isSecureContext = window.isSecureContext

        const fullSupport =
          supportsWebAuthn && hasCredentialsCreate && hasCredentialsGet && isSecureContext
        setBrowserSupportsPasskeys(fullSupport)

        if (!fullSupport) {
          console.warn('Browser passkey support check failed:', {
            supportsWebAuthn,
            hasCredentialsCreate,
            hasCredentialsGet,
            isSecureContext,
          })
        }
      } catch (error) {
        console.error('Error checking browser support:', error)
        setBrowserSupportsPasskeys(false)
      } finally {
        setIsCheckingSupport(false)
      }
    }

    checkBrowserSupport()
  }, [])

  // Auto-trigger passkey registration if username is provided
  useEffect(() => {
    if (
      username &&
      registrationStep === 'passkey' &&
      !isCheckingSupport &&
      browserSupportsPasskeys &&
      !isLoading &&
      !error && // Don't auto-trigger if there's an error
      !success && // Don't auto-trigger if already successful
      !autoRegistrationAttempted.current // Only attempt once
    ) {
      autoRegistrationAttempted.current = true
      handleUsernameSubmit({ username })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    username,
    registrationStep,
    isCheckingSupport,
    browserSupportsPasskeys,
    isLoading,
    error,
    success,
  ])

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

        // Handle successful registration with JWT token
        if (verificationResult.token && verificationResult.productUser) {
          // Store JWT token
          storeToken(verificationResult.token)

          // Update auth store
          setProductUser(verificationResult.productUser)

          setSuccess('Passkey registration successful!')
          setRegistrationStep('complete')

          // Notify parent component
          onRegistrationComplete?.(verificationResult.productUser.id)
        } else {
          setError('Registration successful but authentication setup failed')
        }
      } catch (webauthnError) {
        console.error('WebAuthN registration error:', webauthnError)

        // Provide specific error messages based on WebAuthN error types
        let errorMessage = 'Passkey registration failed.'

        if (webauthnError instanceof Error) {
          switch (webauthnError.name) {
            case 'NotSupportedError':
              errorMessage = 'Passkeys are not supported on this device or browser.'
              break
            case 'SecurityError':
              errorMessage =
                'Security error: Please ensure you are using a secure connection (HTTPS).'
              break
            case 'NotAllowedError':
              errorMessage = 'Passkey registration was cancelled or timed out. Please try again.'
              break
            case 'InvalidStateError':
              errorMessage = 'A passkey for this account may already exist on this device.'
              break
            case 'ConstraintError':
              errorMessage = 'Device constraints prevent passkey creation. Try a different device.'
              break
            default:
              errorMessage = `Passkey registration failed: ${webauthnError.message}`
          }
        }

        setError(errorMessage)
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
    autoRegistrationAttempted.current = false
    form.reset()
  }

  // Show loading while checking browser support
  if (isCheckingSupport) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking device compatibility...</span>
        </CardContent>
      </Card>
    )
  }

  // Show browser compatibility warning if passkeys are not supported
  if (!browserSupportsPasskeys) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Passkeys Not Supported
          </CardTitle>
          <CardDescription>
            Your browser or device doesn&apos;t support passkey authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">To use this app, you&apos;ll need:</p>
              <ul className="list-disc ml-4 space-y-1 text-sm">
                <li>A modern browser (Chrome 67+, Safari 14+, Firefox 60+, Edge 18+)</li>
                <li>A secure connection (HTTPS)</li>
                <li>A device with biometric authentication (fingerprint, face, or PIN)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">Recommended browsers:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>
                <strong>Mobile:</strong> Chrome, Safari, Samsung Internet
              </li>
              <li>
                <strong>Desktop:</strong> Chrome, Safari, Edge, Firefox
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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

        <div className="mt-6 space-y-3">
          <div className="text-sm text-muted-foreground">
            <p className="text-center">
              Your device will prompt you to create a passkey using your fingerprint, face, or PIN.
            </p>
          </div>

          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Secure & Private:</strong> Passkeys are stored locally on your device and
              never shared. They work with Touch ID, Face ID, Windows Hello, or your device PIN.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
