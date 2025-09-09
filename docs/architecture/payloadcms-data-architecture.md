# PayloadCMS Data Architecture

## Collection Overview

The application uses **PayloadCMS Collections** as the primary data abstraction layer. PayloadCMS automatically handles:

- **Database Schema Generation:** Collections and fields automatically create the underlying MongoDB schema
- **API Generation:** REST and GraphQL APIs are automatically generated for each collection
- **Admin Interface:** Complete admin UI is automatically generated based on field definitions
- **Data Validation:** Field-level validation is automatically enforced
- **Relationships:** Relationship fields automatically handle foreign key constraints and queries

## Collection Relationships

The relationship-based ordering system is implemented through PayloadCMS relationship fields and junction collections:

**Core Collections:**

- `users` - PayloadCMS admin users with email/password authentication
- `productUsers` - Product users with WebAuthn passkey authentication
- `programs` - Complete workout programs with embedded milestones, days, and sessions
- `exercises` - Exercise definitions with videos and metadata
- `exerciseCompletions` - Product user workout completion tracking

**Removed Collections:**

- `milestones` - Now embedded within programs
- `sessions` - Now embedded within programs

## Programs Collection Schema

The Programs collection implements an **embedded document architecture** with the following structure:

### Day Configuration Fields

Each day within a program milestone contains these configuration options:

**Core Day Fields:**

- `dayType` (select) - Type of day: 'workout' | 'rest'
- `isAmrap` (checkbox) - Marks day as AMRAP (As Many Rounds As Possible) workout
- `amrapDuration` (number) - AMRAP workout duration in minutes (1-120)
- `restNotes` (textarea) - Rest day instructions (for rest days only)

**AMRAP Field Validation:**

- `isAmrap` field shows conditionally only for workout days
- `amrapDuration` field shows conditionally only when `isAmrap` is true
- `amrapDuration` is required when `isAmrap` is selected
- AMRAP fields follow existing conditional field patterns

### Exercise Configuration Fields

Each exercise within a program day contains these configuration options:

**Core Fields:**

- `exercise` (relationship) - Reference to exercise definition
- `sets` (number) - Number of sets to perform (1-20)
- `reps` (number) - Number of repetitions per set (1-100)
- `restPeriod` (number) - Rest time between sets in seconds (0-600)
- `weight` (number) - Weight in pounds (0-1000)

**Time-Based Exercise Fields:**

- `durationValue` (number) - Duration amount (0-999)
- `durationUnit` (select) - Time unit: seconds/minutes/hours
- **Validation:** Both fields required together for time-based exercises

**Distance-Based Exercise Fields:**

- `distanceValue` (number) - Distance amount (0-999, step: 0.1)
- `distanceUnit` (select) - Distance unit: meters/miles
- **Validation:** Both fields required together for distance-based exercises

**Additional Fields:**

- `notes` (textarea) - Exercise-specific instructions (max 500 chars)

### Field Validation Patterns

**Dual-Field Validation:**
PayloadCMS hooks enforce that paired fields (duration, distance) must be specified together:

```typescript
// Duration validation
if (hasDurationValue && !hasDurationUnit) {
  /* error */
}
if (hasDurationUnit && !hasDurationValue) {
  /* error */
}

// Distance validation
if (hasDistanceValue && !hasDistanceUnit) {
  /* error */
}
if (hasDistanceUnit && !hasDistanceValue) {
  /* error */
}
```

**Unit-Specific Ranges:**

- Duration: Hours ≤ 99, Minutes ≤ 999, Seconds ≤ 999
- Distance: Both meters and miles ≤ 999 with 0.1 precision

## PayloadCMS Benefits

**Automatic Features:**

- Database indexes are automatically created based on field configurations
- Relationship queries are optimized automatically
- Admin interface provides drag-and-drop reordering for junction collections
- Data validation and constraints are enforced at the field level
- Local API provides direct database access with full type safety

**Developer Experience:**

- No need to manually define MongoDB schemas
- PayloadCMS Local API provides complete TypeScript type safety
- Server actions use PayloadCMS Local API for type-safe database operations
- Admin interface is automatically generated and customizable
- No need for REST/GraphQL APIs - Local API handles all data operations
