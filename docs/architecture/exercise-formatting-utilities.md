# Exercise Formatting Utilities Architecture

## Overview

This document specifies the display formatting utilities for exercise configuration data, ensuring consistent presentation across all interfaces.

## Distance Formatting Utility

### Implementation

**File:** `src/utils/distance-formatter.ts`

```typescript
export function formatDistance(value?: number, unit?: string): string {
  if (!value || !unit) return ''

  // Handle singular vs plural
  if (value === 1 && unit === 'miles') {
    return `${value} mile`
  }
  if (value === 1 && unit === 'meters') {
    return `${value} meter`
  }
  return `${value} ${unit}`
}
```

### Usage Examples

```typescript
formatDistance(20, 'meters') // → "20 meters"
formatDistance(1, 'miles') // → "1 mile"
formatDistance(5, 'miles') // → "5 miles"
formatDistance(1, 'meters') // → "1 meter"
formatDistance(undefined, 'miles') // → ""
formatDistance(5, undefined) // → ""
```

### Display Contexts

1. **Admin Interface:** Show as entered (preserve user's intent)
2. **Workout Execution:** Show in most appropriate unit for context
3. **Progress Tracking:** Maintain original units for consistency
4. **Export/Reporting:** Include both value and unit for clarity

## Duration Formatting Utility (Existing Pattern)

### Implementation

**File:** `src/utils/duration-formatter.ts`

```typescript
export function formatDuration(value?: number, unit?: string): string {
  if (!value || !unit) return ''

  const unitLabels = {
    seconds: value === 1 ? 'second' : 'seconds',
    minutes: value === 1 ? 'minute' : 'minutes',
    hours: value === 1 ? 'hour' : 'hours',
  }

  return `${value} ${unitLabels[unit as keyof typeof unitLabels]}`
}
```

### Usage Examples

```typescript
formatDuration(30, 'seconds') // → "30 seconds"
formatDuration(1, 'minute') // → "1 minute"
formatDuration(2, 'hours') // → "2 hours"
```

## Combined Utility Export

### Master Export File

**File:** `src/utils/formatters.ts`

```typescript
export { formatDistance } from './distance-formatter'
export { formatDuration } from './duration-formatter'

// Convenience function for complete exercise display
export function formatExerciseSpecs(exercise: ExerciseConfig): {
  core: string
  distance?: string
  duration?: string
  weight?: string
} {
  const core = `${exercise.sets} sets × ${exercise.reps} reps`

  return {
    core,
    distance: formatDistance(exercise.distanceValue, exercise.distanceUnit),
    duration: formatDuration(exercise.durationValue, exercise.durationUnit),
    weight: exercise.weight ? `${exercise.weight} lbs` : undefined,
  }
}
```

## Component Integration Patterns

### Exercise Display Component

```typescript
import { formatExerciseSpecs } from '@/utils/formatters'

export function ExerciseCard({ exercise }: { exercise: ExerciseConfig }) {
  const specs = formatExerciseSpecs(exercise)

  return (
    <div className="exercise-card">
      <h3>{exercise.name}</h3>
      <div className="exercise-specs">
        <span className="sets-reps">{specs.core}</span>
        {specs.distance && <span className="distance">📏 {specs.distance}</span>}
        {specs.duration && <span className="duration">⏱️ {specs.duration}</span>}
        {specs.weight && <span className="weight">🏋️ {specs.weight}</span>}
      </div>
      {exercise.notes && <p className="notes">{exercise.notes}</p>}
    </div>
  )
}
```

### Admin Interface Integration

```typescript
// src/components/admin/exercise-row-label.tsx
import { formatDistance, formatDuration } from '@/utils/formatters'

export const ExerciseRowLabel: React.FC<{ data: ExerciseConfig }> = ({ data }) => {
  const parts = [
    `${data.sets}×${data.reps}`,
    data.weight && `${data.weight}lbs`,
    formatDistance(data.distanceValue, data.distanceUnit),
    formatDuration(data.durationValue, data.durationUnit),
    data.restPeriod && `${data.restPeriod}s rest`
  ].filter(Boolean)

  return <span>{parts.join(' • ')}</span>
}
```

## Testing Requirements

### Unit Tests

**File:** `src/utils/__tests__/formatters.test.ts`

```typescript
import { formatDistance, formatDuration } from '../formatters'

describe('formatDistance', () => {
  it('handles singular units correctly', () => {
    expect(formatDistance(1, 'miles')).toBe('1 mile')
    expect(formatDistance(1, 'meters')).toBe('1 meter')
  })

  it('handles plural units correctly', () => {
    expect(formatDistance(5, 'miles')).toBe('5 miles')
    expect(formatDistance(20, 'meters')).toBe('20 meters')
  })

  it('handles empty values', () => {
    expect(formatDistance(undefined, 'miles')).toBe('')
    expect(formatDistance(5, undefined)).toBe('')
    expect(formatDistance(undefined, undefined)).toBe('')
  })

  it('handles decimal values', () => {
    expect(formatDistance(2.5, 'miles')).toBe('2.5 miles')
    expect(formatDistance(0.5, 'miles')).toBe('0.5 miles')
  })
})
```

## Type Safety Integration

### Type Guards

```typescript
// src/types/exercise-guards.ts
export function hasDistance(
  exercise: ExerciseConfig,
): exercise is ExerciseConfig & { distanceValue: number; distanceUnit: 'meters' | 'miles' } {
  return Boolean(exercise.distanceValue && exercise.distanceUnit)
}

export function hasDuration(exercise: ExerciseConfig): exercise is ExerciseConfig & {
  durationValue: number
  durationUnit: 'seconds' | 'minutes' | 'hours'
} {
  return Boolean(exercise.durationValue && exercise.durationUnit)
}
```

### Usage with Type Safety

```typescript
import { hasDistance, hasDuration } from '@/types/exercise-guards'
import { formatDistance, formatDuration } from '@/utils/formatters'

function ExerciseSpecDisplay({ exercise }: { exercise: ExerciseConfig }) {
  return (
    <div>
      {hasDistance(exercise) && (
        <span>Distance: {formatDistance(exercise.distanceValue, exercise.distanceUnit)}</span>
      )}
      {hasDuration(exercise) && (
        <span>Duration: {formatDuration(exercise.durationValue, exercise.durationUnit)}</span>
      )}
    </div>
  )
}
```

## Architecture Benefits

1. **Consistency:** Unified formatting across all interfaces
2. **Type Safety:** Full TypeScript support with proper type guards
3. **Reusability:** Single implementation used throughout the application
4. **Testability:** Pure functions with comprehensive test coverage
5. **Maintainability:** Centralized logic for easy updates and extensions

## Future Extensions

The utility architecture supports future enhancements:

- Additional distance units (kilometers, yards, feet)
- Metric/Imperial unit conversion utilities
- Localization support for international units
- Advanced formatting options (precision control, range display)
