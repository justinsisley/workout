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

## Import/Export Data Management

The application leverages **PayloadCMS Import/Export Plugin** (`@payloadcms/plugin-import-export`) for comprehensive data backup, migration, and seeding capabilities.

### Enabled Collections

All core collections support import/export functionality:

- ✅ **programs** - Complete workout programs with embedded milestones and exercises
- ✅ **exercises** - Exercise library with descriptions, videos, and alternatives  
- ✅ **users** - Admin users
- ✅ **media** - Uploaded files and images
- ✅ **productUsers** - App users (product users)
- ✅ **exerciseCompletions** - User progress tracking data

### Plugin Configuration

```typescript
// src/payload/payload.config.ts
importExportPlugin({
  collections: {
    programs: true,
    exercises: true,
    users: true,
    media: true,
    productUsers: true,
    exerciseCompletions: true,
  }
})
```

### Data Migration Strategy

**Collection Dependency Order:**
1. **exercises** (no dependencies)
2. **media** (no dependencies)  
3. **users** (no dependencies)
4. **programs** (depends on exercises)
5. **productUsers** (no dependencies)
6. **exerciseCompletions** (depends on exercises, programs, productUsers)

**Export/Import Process:**
- **JSON Format**: Preserves all relationships and nested data structure
- **CSV Format**: Flattened data suitable for spreadsheet editing
- **Admin Interface**: Available at `/admin` with dedicated import/export pages
- **Relationship Integrity**: All exercise references and embedded structures maintained

## Component Path Resolution

**Critical Learning from Story 1.4:**

PayloadCMS requires **string-based component paths** instead of direct React component imports to prevent build-time CSS extension errors during `generate:types` and `generate:importmap` commands.

### ❌ Incorrect Pattern (Causes Build Errors)

```typescript
import { ExerciseRowLabel } from '../../components/admin/exercise-row-label'

// In collection config:
components: {
  RowLabel: ExerciseRowLabel, // Direct import causes CSS errors
}
```

### ✅ Correct Pattern (Build-Safe)

```typescript
// No direct import needed

// In collection config:
components: {
  RowLabel: 'src/components/admin/exercise-row-label#ExerciseRowLabel',
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //         Absolute path from project root + export name
}
```

**Path Resolution Rules:**
- Use absolute paths from project root (not relative paths)
- Format: `'src/path/to/component#ComponentName'`
- No direct React component imports in PayloadCMS configuration files
- Run `npm run generate:importmap` after path changes
- Run `npm run generate:types` to update TypeScript definitions

## PayloadCMS Benefits

**Automatic Features:**

- Database indexes are automatically created based on field configurations
- Relationship queries are optimized automatically
- Admin interface provides drag-and-drop reordering for junction collections
- Data validation and constraints are enforced at the field level
- Local API provides direct database access with full type safety
- **Import/Export Plugin**: Automated data backup and migration capabilities
- **Component Resolution**: String-based component path system prevents build errors

**Developer Experience:**

- No need to manually define MongoDB schemas
- PayloadCMS Local API provides complete TypeScript type safety
- Server actions use PayloadCMS Local API for type-safe database operations
- Admin interface is automatically generated and customizable
- No need for REST/GraphQL APIs - Local API handles all data operations
- **Production Data Migration**: Seamless development-to-production data transfer
- **Backup Strategy**: Built-in export capabilities for data protection
