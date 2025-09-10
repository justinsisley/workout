'use client'

import { useState, useEffect } from 'react'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Loader2, AlertTriangle, Smartphone, LogIn } from 'lucide-react'

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

import { generatePasskeyAuthenticationOptions, verifyPasskeyAuthentication } from '@/actions/auth'
import { useAuthStore } from '@/stores/auth-store'
import { storeToken } from '@/lib/auth'

// Form validation schema
const authenticationFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens',
    ),
})

type AuthenticationFormData = z.infer<typeof authenticationFormSchema>

interface PasskeyAuthenticationProps {
  onAuthenticationComplete?: (productUserId: string) => void
}

export function PasskeyAuthentication({ onAuthenticationComplete }: PasskeyAuthenticationProps) {
  const { setProductUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [authenticationStep, setAuthenticationStep] = useState<'username' | 'passkey' | 'complete'>(
    'username',
  )
  const [_productUserId, setProductUserId] = useState<string>('')
  const [browserSupportsPasskeys, setBrowserSupportsPasskeys] = useState<boolean>(true)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)

  const form = useForm<AuthenticationFormData>({
    resolver: zodResolver(authenticationFormSchema),
    defaultValues: {
      username: '',
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

  const handleUsernameSubmit = async (data: AuthenticationFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Generate passkey authentication options
      const authenticationResult = await generatePasskeyAuthenticationOptions(data.username)

      if (
        !authenticationResult.success ||
        !authenticationResult.authenticationOptions ||
        !authenticationResult.productUser
      ) {
        setError(authenticationResult.error || 'Failed to generate authentication options')
        return
      }

      // Store product user ID for verification
      setProductUserId(authenticationResult.productUser.id)

      // Start WebAuthN authentication with browser using navigator.credentials.get()
      try {
        const authenticationResponse = await startAuthentication({
          optionsJSON: authenticationResult.authenticationOptions,
        })

        // Verify the authentication response with the server
        const verificationResult = await verifyPasskeyAuthentication(
          data.username,
          authenticationResponse,
        )

        if (!verificationResult.success) {
          setError(verificationResult.error || 'Authentication verification failed')
          return
        }

        // Handle successful authentication with JWT token
        if (verificationResult.token && verificationResult.productUser) {
          // Store JWT token
          storeToken(verificationResult.token)

          // Update auth store
          setProductUser(verificationResult.productUser)

          setSuccess('Authentication successful!')
          setAuthenticationStep('complete')

          // Notify parent component
          onAuthenticationComplete?.(verificationResult.productUser.id)
        } else {
          setError('Authentication successful but session setup failed')
        }
      } catch (webauthnError) {
        console.error('WebAuthN authentication error:', webauthnError)

        // Provide specific error messages based on WebAuthN error types
        let errorMessage = 'Passkey authentication failed.'

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
              errorMessage = 'Passkey authentication was cancelled or timed out. Please try again.'
              break
            case 'InvalidStateError':
              errorMessage = 'No passkey found for this account on this device.'
              break
            case 'ConstraintError':
              errorMessage =
                'Device constraints prevent passkey authentication. Try a different device.'
              break
            case 'UnknownError':
              errorMessage = 'An unknown error occurred. Please try again.'
              break
            default:
              errorMessage = `Passkey authentication failed: ${webauthnError.message}`
          }
        }

        setError(errorMessage)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetAuthentication = () => {
    setAuthenticationStep('username')
    setError(null)
    setSuccess(null)
    setProductUserId('')
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

  if (authenticationStep === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Login Successful</CardTitle>
          <CardDescription>You have been successfully authenticated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <Button onClick={resetAuthentication} variant="outline" className="w-full">
            Login with Different Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <LogIn className="h-6 w-6" />
          Login to Your Account
        </CardTitle>
        <CardDescription>Sign in with your username and passkey</CardDescription>
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
              {isLoading ? 'Authenticating...' : 'Login with Passkey'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 space-y-3">
          <div className="text-sm text-muted-foreground">
            <p className="text-center">
              Your device will prompt you to authenticate using your fingerprint, face, or PIN.
            </p>
          </div>

          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Secure & Private:</strong> Your passkey is stored locally on your device and
              never shared. Use Touch ID, Face ID, Windows Hello, or your device PIN.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
