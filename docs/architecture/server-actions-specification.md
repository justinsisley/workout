# Server Actions Specification

## PayloadCMS Local API Integration

The application uses Next.js Server Actions with **PayloadCMS Local API** for all data operations. This approach provides:

- **Full Type Safety:** PayloadCMS Local API is fully typed based on collection definitions
- **Direct Database Access:** No HTTP overhead - direct database operations
- **Automatic Validation:** Field-level validation is automatically enforced
- **Relationship Handling:** Complex relationships are handled automatically
- **No API Endpoints:** All data operations happen in server actions
- **Future Flexibility:** REST/GraphQL APIs can be enabled later if needed

**Key Benefits:**

- **Performance:** Direct database access without HTTP overhead
- **Type Safety:** Complete TypeScript support with automatic type generation
- **Simplicity:** No need to define API endpoints or handle HTTP requests
- **Consistency:** Same data operations work in server actions and admin interface
- **Validation:** Field-level validation is automatically enforced
- **Relationships:** Complex many-to-many relationships with ordering are handled seamlessly

### Authentication Server Actions

```typescript
// src/actions/auth.ts
'use server'

import { getPayload } from 'payload'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { signJWT } from '@/lib/auth'

export async function checkUsernameAvailability(username: string) {
  const payload = await getPayload()

  const result = await payload.find({
    collection: 'productUsers',
    where: { username: { equals: username } },
    limit: 1,
  })

  return { available: result.docs.length === 0 }
}

export async function registerPasskey(username: string, credential: any) {
  const payload = await getPayload()

  // Create product user with username and passkey credential
  const productUser = await payload.create({
    collection: 'productUsers',
    data: {
      username,
      passkeyCredentials: [credential],
    },
  })

  // Generate JWT token
  const token = signJWT({ productUserId: productUser.id })

  return { success: true, productUser, token }
}

export async function authenticateWithPasskey(username: string, credential: any) {
  const payload = await getPayload()

  // Find user by username
  const result = await payload.find({
    collection: 'productUsers',
    where: { username: { equals: username } },
    limit: 1,
  })

  const productUser = result.docs[0]
  if (!productUser) {
    throw new Error('User not found')
  }

  // Verify passkey credential
  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: expectedChallenge,
    expectedOrigin: process.env.NEXT_PUBLIC_APP_URL,
    expectedRPID: process.env.WEBAUTHN_RP_ID,
    authenticator: productUser.passkeyCredentials[0],
  })

  if (verification.verified) {
    const token = signJWT({ productUserId: productUser.id })
    return { success: true, productUser, token }
  }

  throw new Error('Authentication failed')
}
```

### Program Management Server Actions

```typescript
// src/actions/programs.ts
'use server'

import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'

export async function getPrograms() {
  const payload = await getPayload()
  return await payload.find({
    collection: 'programs',
    where: {
      isPublished: { equals: true },
    },
  })
}

export async function getProgramsForAdmin() {
  const payload = await getPayload()
  return await payload.find({
    collection: 'programs',
    // Return all programs for admin interface, regardless of status
  })
}

export async function assignProgramToUser(programId: string, productUserId: string) {
  const payload = await getPayload()

  // Update product user with new program using PayloadCMS Local API
  await payload.update({
    collection: 'productUsers',
    id: productUserId,
    data: {
      currentProgram: programId,
      currentDay: 1,
    },
  })

  revalidatePath('/workout/dashboard')
}

export async function publishProgram(programId: string) {
  const payload = await getPayload()

  // Publish the program
  await payload.update({
    collection: 'programs',
    id: programId,
    data: {
      isPublished: true,
    },
  })

  revalidatePath('/admin/programs')
  revalidatePath('/workout/dashboard')
}
```

### Workout Execution Server Actions

```typescript
// src/actions/workouts.ts
'use server'

import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'

export async function getCurrentSession(productUserId: string) {
  const payload = await getPayload()

  // Get product user with current program progress using PayloadCMS Local API
  const productUser = await payload.findByID({
    collection: 'productUsers',
    id: productUserId,
    depth: 2, // Populate relationships
  })

  // Get current session based on product user progress
  // Return session with exercises populated
}

export async function completeExercise(
  exerciseId: string,
  completionData: ExerciseCompletionData,
  productUserId: string,
) {
  const payload = await getPayload()

  // Create exercise completion record using PayloadCMS Local API
  await payload.create({
    collection: 'exerciseCompletions',
    data: {
      productUser: productUserId,
      exercise: exerciseId,
      ...completionData,
    },
  })

  // Update product user progress
  // Move to next exercise or complete session
  revalidatePath('/workout/session')
}
```

### Data Access Patterns

**Server Components for Data Fetching:**

```typescript
// app/workout/dashboard/page.tsx
import { getPayload } from 'payload'
import { getCurrentProductUser } from '@/lib/auth'

export default async function WorkoutDashboard() {
  const productUser = await getCurrentProductUser()
  const payload = await getPayload()

  // Use PayloadCMS Local API for data fetching with full type safety
  const currentSession = await payload.find({
    collection: 'sessions',
    where: { /* current session logic */ },
    depth: 2 // Populate relationships automatically
  })

  return <WorkoutDashboardUI session={currentSession} />
}
```

**Server Actions for Mutations:**

```typescript
// src/components/exercise-form.tsx
import { completeExercise } from '@/actions/workouts'

export function ExerciseForm({ exerciseId }: { exerciseId: string }) {
  async function handleSubmit(formData: FormData) {
    'use server'

    const completionData = {
      sets: Number(formData.get('sets')),
      reps: JSON.parse(formData.get('reps') as string),
      weight: JSON.parse(formData.get('weight') as string),
      time: Number(formData.get('time'))
    }

    await completeExercise(exerciseId, completionData, productUserId)
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```
