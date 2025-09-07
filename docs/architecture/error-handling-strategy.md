# Error Handling Strategy

## Server Action Error Response Format

```typescript
interface ServerActionError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

interface ServerActionSuccess<T = any> {
  success: true;
  data: T;
}

type ServerActionResult<T = any> = ServerActionSuccess<T> | ServerActionError;

// Example error responses
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": {
      "field": "phoneNumber",
      "value": "invalid-phone"
    },
    "timestamp": "2024-12-19T10:30:00Z"
  }
}

// Example success responses
{
  "success": true,
  "data": {
    "id": "user-123",
    "phoneNumber": "+1234567890"
  }
}
```

## Frontend Error Handling

```typescript
import { toast } from 'sonner';
import { ServerActionResult } from '@/types/server-actions';

export const handleServerActionError = (result: ServerActionResult) => {
  if (!result.success) {
    const { code, message, details } = result.error;

    switch (code) {
      case 'VALIDATION_ERROR':
        toast.error(`Validation Error: ${message}`);
        if (details?.field) {
          // Focus on the problematic field
          const field = document.querySelector(`[name="${details.field}"]`);
          field?.focus();
        }
        break;
      case 'AUTHENTICATION_FAILED':
        toast.error('Authentication failed. Please try again.');
        // Redirect to login
        window.location.href = '/login';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        toast.error('Too many requests. Please wait a moment.');
        break;
      case 'PAYLOAD_ERROR':
        toast.error('Database error. Please try again.');
        break;
      default:
        toast.error('An unexpected error occurred.');
    }
  }
};

// Usage in components
export function ExerciseForm({ exerciseId }: { exerciseId: string }) {
  async function handleSubmit(formData: FormData) {
    'use server'

    const result = await completeExercise(exerciseId, formData);

    if (!result.success) {
      handleServerActionError(result);
      return;
    }

    // Handle success
    toast.success('Exercise completed!');
    router.push('/workout/next-exercise');
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## Backend Error Handling

```typescript
import { ZodError } from 'zod'
import { ServerActionResult } from '@/types/server-actions'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const createServerActionError = (
  code: string,
  message: string,
  details?: Record<string, any>,
): ServerActionResult => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  }
}

export const createServerActionSuccess = <T>(data: T): ServerActionResult<T> => {
  return {
    success: true,
    data,
  }
}

export const handleServerActionError = (error: any): ServerActionResult => {
  console.error('Server Action Error:', error)

  if (error instanceof AppError) {
    return createServerActionError(error.code, error.message, error.details)
  }

  if (error instanceof ZodError) {
    return createServerActionError('VALIDATION_ERROR', 'Invalid input data', {
      validationErrors: error.errors,
    })
  }

  // PayloadCMS errors
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return createServerActionError('PAYLOAD_ERROR', 'Database validation error', {
      originalError: error.message,
    })
  }

  // Default error response
  return createServerActionError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
}

// Example server action with error handling
export async function completeExercise(
  exerciseId: string,
  completionData: unknown,
  productUserId: string,
): Promise<ServerActionResult> {
  try {
    // Validate input with Zod
    const validatedData = ExerciseCompletionSchema.parse(completionData)

    // Get current user
    const productUser = await getCurrentProductUser()
    if (!productUser) {
      return createServerActionError('AUTHENTICATION_FAILED', 'User not authenticated')
    }

    // Create completion record
    const payload = await getPayload()
    const completion = await payload.create({
      collection: 'exerciseCompletions',
      data: {
        exercise: exerciseId,
        productUser: productUserId,
        ...validatedData,
        completedAt: new Date(),
      },
    })

    return createServerActionSuccess(completion)
  } catch (error) {
    return handleServerActionError(error)
  }
}
```
