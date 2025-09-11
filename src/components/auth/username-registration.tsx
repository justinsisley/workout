'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { checkUsernameAvailability } from '@/actions/auth'

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be no more than 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores',
    ),
})

type UsernameFormData = z.infer<typeof usernameSchema>

interface UsernameRegistrationProps {
  onUsernameConfirmed: (username: string) => void
}

export function UsernameRegistration({ onUsernameConfirmed }: UsernameRegistrationProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'taken' | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState('')

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: '',
    },
  })

  const handleUsernameChange = async (username: string) => {
    // Don't check if username doesn't meet basic validation
    const validation = usernameSchema.safeParse({ username })
    if (!validation.success) {
      // Only clear status if validation fails
      setAvailabilityStatus(null)
      setAvailabilityMessage('')
      return
    }

    // Show checking state while preserving alert visibility
    setIsCheckingAvailability(true)
    setAvailabilityMessage('Checking availability...')

    try {
      const result = await checkUsernameAvailability(username)

      if (result.available) {
        setAvailabilityStatus('available')
        setAvailabilityMessage('Username is available!')
      } else {
        setAvailabilityStatus('taken')
        setAvailabilityMessage(result.error || 'Username is not available')
      }
    } catch (_error) {
      setAvailabilityStatus('taken')
      setAvailabilityMessage('Error checking username availability')
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const onSubmit = (data: UsernameFormData) => {
    if (availabilityStatus === 'available') {
      onUsernameConfirmed(data.username)
    }
  }

  const isFormValid = form.formState.isValid && availabilityStatus === 'available'

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Choose Your Username</CardTitle>
        <CardDescription>Create a unique username for your workout account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Enter your username"
                        onChange={(e) => {
                          field.onChange(e)
                          const value = e.target.value
                          if (value.length >= 3) {
                            handleUsernameChange(value)
                          } else {
                            setAvailabilityStatus(null)
                            setAvailabilityMessage('')
                          }
                        }}
                        className="pr-10"
                      />
                      {isCheckingAvailability && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!isCheckingAvailability && availabilityStatus === 'available' && (
                        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                      {!isCheckingAvailability && availabilityStatus === 'taken' && (
                        <XCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {availabilityMessage && (
              <Alert
                className={
                  availabilityStatus === 'available'
                    ? 'border-green-200 bg-green-50'
                    : availabilityStatus === 'taken'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                }
              >
                <AlertDescription
                  className={
                    availabilityStatus === 'available'
                      ? 'text-green-700'
                      : availabilityStatus === 'taken'
                        ? 'text-red-700'
                        : 'text-blue-700'
                  }
                >
                  {availabilityMessage}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || isCheckingAvailability}
            >
              {isCheckingAvailability ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking availability...
                </>
              ) : (
                'Continue with Username'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
