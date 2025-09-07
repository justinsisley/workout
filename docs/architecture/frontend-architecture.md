# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── components/
│   ├── ui/                 # ShadCN base components
│   ├── auth/              # Authentication components
│   ├── workout/           # Workout-specific components
│   ├── program/           # Program management components (embedded schema)
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
│   ├── collections/       # PayloadCMS collection definitions (embedded schema)
│   │   ├── users.ts       # PayloadCMS admin users
│   │   ├── product-users.ts # Product users (app users)
│   │   ├── programs.ts    # Programs with embedded milestones/sessions
│   │   ├── exercises.ts   # Exercise definitions
│   │   └── exercise-completions.ts # Workout completion tracking
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
import { Program, EmbeddedDay, Exercise } from '@/types'

interface WorkoutState {
  currentProgram: Program | null
  currentMilestoneIndex: number
  currentDayIndex: number
  currentExerciseIndex: number
  completedExercises: string[]
  sessionStartTime: Date | null
  setCurrentProgram: (program: Program | null) => void
  setCurrentMilestone: (milestoneIndex: number) => void
  setCurrentDay: (dayIndex: number) => void
  setCurrentExercise: (exerciseIndex: number) => void
  completeExercise: (exerciseId: string) => void
  startSession: () => void
  getCurrentDay: () => EmbeddedDay | null
  getCurrentExercise: () => Exercise | null
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentProgram: null,
  currentMilestoneIndex: 0,
  currentDayIndex: 0,
  currentExerciseIndex: 0,
  completedExercises: [],
  sessionStartTime: null,
  setCurrentProgram: (currentProgram) =>
    set({
      currentProgram,
      currentMilestoneIndex: 0,
      currentDayIndex: 0,
      currentExerciseIndex: 0,
      completedExercises: [],
    }),
  setCurrentMilestone: (currentMilestoneIndex) =>
    set({
      currentMilestoneIndex,
      currentDayIndex: 0,
      currentExerciseIndex: 0,
      completedExercises: [],
    }),
  setCurrentDay: (currentDayIndex) =>
    set({
      currentDayIndex,
      currentExerciseIndex: 0,
      completedExercises: [],
    }),
  setCurrentExercise: (currentExerciseIndex) => set({ currentExerciseIndex }),
  completeExercise: (exerciseId) =>
    set((state) => ({
      completedExercises: [...state.completedExercises, exerciseId],
      currentExerciseIndex: state.currentExerciseIndex + 1,
    })),
  startSession: () => set({ sessionStartTime: new Date() }),
  getCurrentDay: () => {
    const state = get()
    if (
      !state.currentProgram ||
      !state.currentProgram.milestones[state.currentMilestoneIndex] ||
      !state.currentProgram.milestones[state.currentMilestoneIndex].days[state.currentDayIndex]
    ) {
      return null
    }
    return (
      state.currentProgram.milestones[state.currentMilestoneIndex].days[state.currentDayIndex] ||
      null
    )
  },
  getCurrentExercise: () => {
    const day = get().getCurrentDay()
    if (!day || !day.exercises || !day.exercises[get().currentExerciseIndex]) {
      return null
    }
    return day.exercises[get().currentExerciseIndex] || null
  },
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
│   ├── login/             # Passkey authentication
│   │   └── page.tsx
│   ├── register/          # Username registration & passkey setup
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
export { registerPasskey, authenticateWithPasskey } from '@/actions/auth'
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

  // With embedded schema, we get complete program structure in one query
  const programs = await payload.find({
    collection: 'programs',
    where: {
      isPublished: { equals: true }
    },
    // No need for depth/population - all data is embedded
  })

  return (
    <div>
      <h1>Workout Dashboard</h1>
      <ProgramSelector programs={programs.docs} productUserId={productUser.id} />
    </div>
  )
}

// src/app/(app)/workout/day/[id]/page.tsx
import { getPayload } from 'payload'
import { getCurrentProductUser } from '@/lib/auth'
import { WorkoutDay } from '@/components/WorkoutDay'

export default async function WorkoutDayPage({ params }: { params: { id: string } }) {
  const productUser = await getCurrentProductUser()
  const payload = await getPayload()

  // Get complete program with embedded structure
  const program = await payload.findByID({
    collection: 'programs',
    id: productUser.currentProgram,
  })

  // Extract current day from embedded structure
  const currentMilestone = program.milestones[productUser.currentMilestone]
  const currentDay = currentMilestone.days[productUser.currentDay]

  return (
    <div>
      <h1>Workout Day</h1>
      <WorkoutDay
        program={program}
        day={currentDay}
        productUserId={productUser.id}
      />
    </div>
  )
}
```
