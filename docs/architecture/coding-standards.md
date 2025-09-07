# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in `src/types/` and import from there - never duplicate type definitions
- **Server Actions:** Use server actions for all data mutations - never make direct HTTP calls
- **Environment Variables:** Access only through config objects in `src/lib/config.ts`, never `process.env` directly
- **Error Handling:** All server actions must use proper error handling with Zod validation
- **State Updates:** Never mutate state directly - use proper state management patterns with immutability
- **Authentication:** Always use the `requireAuth` middleware for protected routes
- **Data Validation:** Use Zod schemas for all API input validation
- **Component Props:** Always define TypeScript interfaces for component props
- **Database Queries:** Use PayloadCMS query methods, never raw MongoDB queries
- **Video URLs:** Always use YouTube URLs or video IDs for exercise videos, never direct file uploads

## Naming Conventions

**CRITICAL: All file names MUST use kebab-case. This is non-negotiable and will be strictly enforced.**

| Element               | Frontend             | Backend          | Example                                                     |
| --------------------- | -------------------- | ---------------- | ----------------------------------------------------------- |
| **File Names**        | **kebab-case**       | **kebab-case**   | `user-profile.tsx`, `complete-exercise.ts`, `auth-store.ts` |
| Components            | PascalCase           | -                | `UserProfile` (exported from `user-profile.tsx`)            |
| Hooks                 | camelCase with 'use' | -                | `useAuth` (exported from `use-auth.ts`)                     |
| Server Actions        | -                    | camelCase        | `completeExercise` (exported from `complete-exercise.ts`)   |
| Database Collections  | -                    | kebab-case       | `product-users` (PayloadCMS slug)                           |
| Services              | camelCase            | camelCase        | `authService` (exported from `auth-service.ts`)             |
| Types/Interfaces      | PascalCase           | PascalCase       | `UserProfile` (exported from `user-profile.ts`)             |
| Constants             | UPPER_SNAKE_CASE     | UPPER_SNAKE_CASE | `API_BASE_URL`                                              |
| Environment Variables | UPPER_SNAKE_CASE     | UPPER_SNAKE_CASE | `DATABASE_URI`                                              |

**File Naming Examples:**

- ✅ `user-profile.tsx` (correct)
- ✅ `exercise-form.tsx` (correct)
- ✅ `auth-store.ts` (correct)
- ✅ `use-workout.ts` (correct)
- ❌ `UserProfile.tsx` (incorrect - PascalCase)
- ❌ `ExerciseForm.tsx` (incorrect - PascalCase)
- ❌ `authStore.ts` (incorrect - camelCase)
