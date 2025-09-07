# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── components/
│   ├── ui/                 # ShadCN base components
│   ├── auth/              # Authentication components
│   ├── workout/           # Workout-specific components
│   ├── program/           # Program management components
│   └── common/            # Shared components
├── app/                   # Next.js App Router
│   ├── (auth)/            # Authentication route group
│   ├── (app)/             # Product user-facing pages
│   ├── (payload)/         # PayloadCMS route group
│   │   ├── admin/         # PayloadCMS admin UI
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── api/           # PayloadCMS API routes
│   │       └── payload/
│   │           └── route.ts
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── payload/               # PayloadCMS configuration
│   ├── collections/       # PayloadCMS collection definitions
│   │   ├── users.ts       # PayloadCMS admin users
│   │   ├── product-users.ts # Product users (app users)
│   │   ├── programs.ts
│   │   ├── milestones.ts
│   │   ├── sessions.ts
│   │   ├── exercises.ts
│   │   └── exercise-completions.ts
│   ├── payload.config.ts  # PayloadCMS configuration
│   └── payload-client.ts  # PayloadCMS client setup
├── hooks/                 # Custom React hooks
├── services/              # API client services
├── stores/                # State management
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Component Template

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({
  className,
  children
}) => {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
};
```

## State Management Architecture

### Zustand Store Structure

```typescript
// stores/auth-store.ts
import { create } from 'zustand'
import { ProductUser } from '@/types'

interface AuthState {
  productUser: ProductUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setProductUser: (productUser: ProductUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  productUser: null,
  isAuthenticated: false,
  isLoading: false,
  setProductUser: (productUser) => set({ productUser, isAuthenticated: !!productUser }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ productUser: null, isAuthenticated: false }),
}))

// stores/workout-store.ts
import { create } from 'zustand'
import { Session, Exercise } from '@/types'

interface WorkoutState {
  currentSession: Session | null
  currentExercise: Exercise | null
  completedExercises: string[]
  currentExerciseIndex: number
  sessionStartTime: Date | null
  setCurrentSession: (session: Session | null) => void
  setCurrentExercise: (exercise: Exercise | null) => void
  completeExercise: (exerciseId: string) => void
  startSession: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  currentSession: null,
  currentExercise: null,
  completedExercises: [],
  currentExerciseIndex: 0,
  sessionStartTime: null,
  setCurrentSession: (currentSession) => set({ currentSession }),
  setCurrentExercise: (currentExercise) => set({ currentExercise }),
  completeExercise: (exerciseId) =>
    set((state) => ({
      completedExercises: [...state.completedExercises, exerciseId],
      currentExerciseIndex: state.currentExerciseIndex + 1,
    })),
  startSession: () => set({ sessionStartTime: new Date() }),
}))
```

### State Management Patterns

- **Zustand Stores:** For global state management with minimal boilerplate
- **Local State:** For component-specific state
- **Server State:** Direct server component data fetching
- **Form State:** React Hook Form for form management

## Routing Architecture

### Route Organization

```
src/app/
├── (frontend)/            # Product user-facing pages (PayloadCMS convention)
│   ├── login/             # SMS authentication
│   │   └── page.tsx
│   ├── verify/            # OTP verification
│   │   └── page.tsx
│   ├── programs/          # Program selection
│   │   ├── page.tsx       # Program list
│   │   └── [id]/          # Program details
│   │       └── page.tsx
│   ├── workout/           # Workout execution
│   │   ├── dashboard/     # Workout overview
│   │   │   └── page.tsx
│   │   ├── session/[id]/  # Current session
│   │   │   └── page.tsx
│   │   └── exercise/[id]/ # Exercise detail
│   │       └── page.tsx
│   └── progress/          # Progress tracking
│       ├── page.tsx       # Progress overview
│       └── history/       # Workout history
│           └── page.tsx
├── (payload)/             # PayloadCMS route group (PayloadCMS convention)
│   ├── admin/             # PayloadCMS admin interface
│   │   ├── page.tsx       # Admin UI page
│   │   └── layout.tsx     # Admin layout
│   └── api/               # PayloadCMS API routes
│       └── payload/
│           └── route.ts   # PayloadCMS API handler
├── globals.css            # Global styles
└── layout.tsx             # Root layout
```

### Protected Route Pattern

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
```

## Frontend Data Access Layer

### Server Actions Integration

```typescript
// src/lib/actions.ts - Re-export server actions for client components
export { sendOTP, verifyOTP } from '@/actions/auth'
export { getPrograms, assignProgramToUser } from '@/actions/programs'
export { getCurrentSession, completeExercise } from '@/actions/workouts'
```

### Client Component Data Access

```typescript
// src/components/program-selector.tsx
'use client'

import { useState, useTransition } from 'react'
import { assignProgramToUser } from '@/lib/actions'
import { Program } from '@/types'

interface ProgramSelectorProps {
  programs: Program[]
  productUserId: string
}

export function ProgramSelector({ programs, productUserId }: ProgramSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedProgram, setSelectedProgram] = useState<string>('')

  async function handleProgramSelect(programId: string) {
    startTransition(async () => {
      const result = await assignProgramToUser(programId, productUserId)
      if (result.success) {
        // Handle success
        router.push('/workout/dashboard')
      } else {
        // Handle error
        console.error(result.error)
      }
    })
  }

  return (
    <div>
      {programs.map(program => (
        <button
          key={program.id}
          onClick={() => handleProgramSelect(program.id)}
          disabled={isPending}
        >
          {program.name}
        </button>
      ))}
    </div>
  )
}
```

### Server Component Data Fetching

```typescript
// src/app/(app)/workout/dashboard/page.tsx
import { getPayload } from 'payload'
import { getCurrentProductUser } from '@/lib/auth'
import { ProgramSelector } from '@/components/ProgramSelector'

export default async function WorkoutDashboard() {
  const productUser = await getCurrentProductUser()
  const payload = await getPayload()

  const programs = await payload.find({
    collection: 'programs',
    where: {
      isPublished: { equals: true }
    }
  })

  return (
    <div>
      <h1>Workout Dashboard</h1>
      <ProgramSelector programs={programs.docs} productUserId={productUser.id} />
    </div>
  )
}
```
