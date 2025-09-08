# PayloadCMS Collections

## PayloadCMS-First Architecture

This architecture is designed around **PayloadCMS's collection and field abstractions** rather than raw MongoDB concepts. This approach provides several key advantages:

**Abstraction Benefits:**

- **No Raw MongoDB:** We don't directly interact with MongoDB collections or schemas
- **Field-Based Definition:** All data structures are defined using PayloadCMS field types
- **Automatic Generation:** Database schema and admin interfaces are automatically generated
- **Full Type Safety:** PayloadCMS Local API provides complete TypeScript type safety
- **Relationship Management:** Complex relationships are handled through PayloadCMS relationship fields
- **Server-Side Operations:** All data operations use PayloadCMS Local API in server actions

**Admin Interface Benefits:**

- **Automatic UI:** Complete admin interface is generated from collection definitions
- **Drag-and-Drop Ordering:** Junction collections provide intuitive reordering interfaces
- **Progressive Validation:** Flexible validation that supports iterative content creation
- **Relationship Management:** Easy management of complex many-to-many relationships

## Progressive Validation Strategy

**Problem:** Traditional required field validation blocks iterative content creation workflows where admins need to bounce between programs, milestones, days, and sessions.

**Solution:** Implement a progressive validation system that allows saving incomplete content while providing clear visibility into completion status.

**Key Principles:**

- **Save Early, Save Often:** Allow saving content at any stage of completion
- **Visual Completion Indicators:** Clear UI indicators showing what's missing
- **Contextual Warnings:** Show warnings when content won't be visible to product users
- **Flexible Publishing:** Separate draft state from publishable state

**Implementation Details:**

**1. No Required Fields at Save Time:**

- All content can be saved in draft state without any required fields
- Admin users can bounce between programs, milestones, days, and sessions freely
- Progress is never lost due to validation constraints

**2. Publishing Controls:**

- `isPublished` checkbox controls product user visibility
- Only published content appears in product user-facing interfaces
- Draft and in-progress content remains hidden from product users

**3. Admin Interface Enhancements:**

- Field descriptions indicate publishing requirements
- Warning messages when trying to publish incomplete content
- Bulk actions for publishing multiple items

**4. Admin User Experience Benefits:**

- No more "cannot save" errors blocking workflow
- Clear visibility into what needs completion
- Ability to work on multiple items simultaneously
- Natural progression from draft to published content

## Admin User vs Product User Separation Strategy

**Problem:** Conflating PayloadCMS admin users with product users creates security risks, data management complexity, and unclear system boundaries.

**Solution:** Implement strict separation between PayloadCMS admin users and product users with distinct collections, authentication systems, and access controls.

**Key Principles:**

- **Clear Separation:** PayloadCMS admin users vs. product users are completely separate entities
- **Security Isolation:** Admin user access and product user access use different authentication systems
- **Data Integrity:** Product user data is isolated from admin user system data
- **Simplified Admin Access:** Use PayloadCMS default user system for admin users

**Implementation Details:**

**1. PayloadCMS Admin Users (`users` collection):**

- Standard PayloadCMS authentication (email/password)
- Default PayloadCMS user setup (no custom roles)
- Access to PayloadCMS admin interface only
- Manage all content and product users
- No access to product user workout data

**2. Product Users (`productUsers` collection):**

- Custom WebAuthN passkey authentication only
- No access to PayloadCMS admin interface
- Access to workout app features only
- Tracked by admin users for management purposes
- Isolated workout progress and completion data

**3. Security Benefits:**

- Admin user credentials never exposed to product users
- Product user data never accessible through admin interface
- Clear audit trail for admin user vs. product user actions
- Simplified admin user system reduces complexity and potential vulnerabilities

**4. Data Management Benefits:**

- Clean separation of concerns between admin users and product users
- Easier backup and recovery strategies
- Clear data ownership and responsibility
- Simplified compliance and privacy management

## Users Collection (PayloadCMS Admin Users)

**Purpose:** Standard PayloadCMS admin users for CMS access and management. This collection uses PayloadCMS's default user setup with no custom modifications.

**PayloadCMS Collection Definition:**

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true, // Standard PayloadCMS authentication
  // No custom fields - use PayloadCMS defaults
}
```

**TypeScript Interface:**

```typescript
interface AdminUser {
  id: string
  email: string
  password: string // Hashed by PayloadCMS
  createdAt: Date
  updatedAt: Date
}
```

## ProductUsers Collection (App Users)

**Purpose:** Represents product users (Justin and wife) with WebAuthN passkey authentication and program progress tracking. This is completely separate from PayloadCMS admin users.

**PayloadCMS Collection Definition:**

```typescript
export const ProductUsers: CollectionConfig = {
  slug: 'productUsers',
  auth: false, // Custom WebAuthN authentication only
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Username for WebAuthN passkey authentication',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional display name for the product user',
      },
    },
    {
      name: 'currentProgram',
      type: 'relationship',
      relationTo: 'programs',
      admin: {
        description: 'Currently assigned workout program',
      },
    },
    {
      name: 'currentMilestone',
      type: 'relationship',
      relationTo: 'milestones',
      admin: {
        description: 'Current milestone within the program',
      },
    },
    {
      name: 'currentDay',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Current day within the program',
      },
    },
    {
      name: 'lastWorkoutDate',
      type: 'date',
      admin: {
        description: 'Date of last completed workout',
      },
    },
    {
      name: 'totalWorkoutsCompleted',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total number of workouts completed',
      },
    },
  ],
  access: {
    // Only authenticated admin users can manage product users
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
}
```

**TypeScript Interface:**

```typescript
interface ProductUser {
  id: string
  username: string
  displayName?: string
  passkeyCredentials: PasskeyCredential[]
  currentProgram?: string
  currentMilestone?: string
  currentDay: number
  lastWorkoutDate?: Date
  totalWorkoutsCompleted: number
  createdAt: Date
  updatedAt: Date
}

interface PasskeyCredential {
  credentialID: string
  publicKey: string
  counter: number
  deviceType?: string
  backedUp: boolean
  transports: string[]
}
```

## Programs Collection (Embedded Architecture)

**Purpose:** Represents complete workout programs with embedded milestones and days. This collection contains the entire program structure as nested documents, eliminating the need for separate milestone and session collections. Each day directly contains its exercises, simplifying the structure.

**Key Benefits:**

- **Single Source of Truth:** All program structure lives in one document
- **Simplified Admin UX:** No more bouncing between collections
- **Atomic Updates:** Entire program can be updated in one operation
- **Data Locality:** Related data lives together for better performance
- **Reduced Complexity:** Fewer collections to manage and maintain

**PayloadCMS Collection Definition:**

```typescript
export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPublished', 'createdAt'],
    group: 'Admin',
    description:
      'Complete workout programs with embedded milestones and days. All program structure is contained within this single document.',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Progressive validation: only enforce required fields when publishing
        if (data?.isPublished && operation === 'update') {
          const errors: string[] = []

          if (!data.name || data.name.trim() === '') {
            errors.push('Program name is required for publishing')
          }

          if (!data.description || data.description.trim() === '') {
            errors.push('Program description is required for publishing')
          }

          if (!data.objective || data.objective.trim() === '') {
            errors.push('Program objective is required for publishing')
          }

          if (!data.milestones || data.milestones.length === 0) {
            errors.push('At least one milestone is required for publishing')
          }

          if (errors.length > 0) {
            throw new Error(`Cannot publish program: ${errors.join(', ')}`)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Program Name',
      admin: {
        description:
          'The name of the fitness program. Can be saved as draft without this field, but required for publishing.',
        placeholder: 'e.g., "Beginner Strength Program"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Program Description',
      admin: {
        description:
          'A detailed description of what this program covers. Can be saved as draft without this field, but required for publishing.',
        placeholder: 'Describe the program goals, target audience, and what users will achieve...',
      },
    },
    {
      name: 'objective',
      type: 'text',
      label: 'Program Objective',
      admin: {
        description:
          'The main goal or outcome of this program. Can be saved as draft without this field, but required for publishing.',
        placeholder: 'e.g., "Build foundational strength and muscle mass"',
      },
    },
    {
      name: 'milestones',
      type: 'array',
      label: 'Program Milestones',
      admin: {
        description:
          'The milestones that make up this program, in order. Drag and drop to reorder milestones in the program sequence. At least one milestone is required for publishing.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Milestone Name',
          admin: {
            description:
              'The name of this milestone. Can be saved as draft without this field, but required for publishing.',
            placeholder: 'e.g., "Foundation Building"',
          },
        },
        {
          name: 'theme',
          type: 'text',
          label: 'Theme',
          admin: {
            description:
              'The theme or focus of this milestone. Can be saved as draft without this field, but required for publishing.',
            placeholder: 'e.g., "Strength Building"',
          },
        },
        {
          name: 'objective',
          type: 'textarea',
          label: 'Objective',
          admin: {
            description:
              'The objective or goal of this milestone. Can be saved as draft without this field, but required for publishing.',
            placeholder: 'Describe what users will achieve in this milestone...',
          },
        },
        {
          name: 'days',
          type: 'array',
          label: 'Days',
          minRows: 1,
          admin: {
            description:
              'Add days to this milestone. Drag and drop to reorder. Day number is automatically derived from position. At least one day is required for publishing.',
            initCollapsed: true,
          },
          fields: [
            {
              name: 'dayType',
              type: 'select',
              options: [
                { label: 'Workout', value: 'workout' },
                { label: 'Rest', value: 'rest' },
              ],
              required: true,
              defaultValue: 'workout',
              label: 'Day Type',
              admin: {
                description: 'Select whether this is a workout day or rest day.',
              },
            },
            {
              name: 'exercises',
              type: 'array',
              label: 'Exercises',
              admin: {
                description: 'Add exercises for this workout day. Only visible for workout days.',
                condition: (_, siblingData) => siblingData?.dayType === 'workout',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'exercise',
                  type: 'relationship',
                  relationTo: 'exercises',
                  required: true,
                  label: 'Exercise',
                  admin: {
                    description: 'Select the exercise to include in this day.',
                  },
                },
                {
                  name: 'sets',
                  type: 'number',
                  label: 'Sets',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Number of sets to perform for this exercise.',
                  },
                },
                {
                  name: 'reps',
                  type: 'number',
                  label: 'Reps',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Number of repetitions per set.',
                  },
                },
                {
                  name: 'restPeriod',
                  type: 'number',
                  label: 'Rest Period (seconds)',
                  admin: {
                    description: 'Rest time between sets in seconds. Optional.',
                  },
                },
                {
                  name: 'weight',
                  type: 'number',
                  label: 'Weight (lbs)',
                  min: 0,
                  admin: {
                    description: 'Weight to use for this exercise. Optional.',
                  },
                },
                {
                  name: 'duration',
                  type: 'number',
                  label: 'Duration (seconds)',
                  min: 0,
                  admin: {
                    description:
                      'Exercise duration in seconds for time-based exercises (e.g., planks, timed runs). Optional.',
                  },
                },
                {
                  name: 'notes',
                  type: 'textarea',
                  label: 'Notes',
                  admin: {
                    description: 'Additional notes or instructions for this exercise. Optional.',
                  },
                },
              ],
            },
            {
              name: 'restNotes',
              type: 'textarea',
              label: 'Rest Day Notes',
              admin: {
                description: 'Optional notes for rest days. Only visible for rest days.',
                condition: (_, siblingData) => siblingData?.dayType === 'rest',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
      admin: {
        description:
          'Check this box to make the program visible to product users. ⚠️ All required fields (name, description, objective, milestones) must be filled before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
```

**Time-Based Exercise Support Developer Notes:**

The `duration` field supports time-based exercises where duration is more important than repetitions:

- **Duration Field:** Optional `duration` field supports time-based exercises (planks, runs, endurance workouts)
- **Units:** Duration stored in seconds for consistency with `restPeriod` field
- **Admin Interface:** Time input with seconds/minutes conversion for user-friendly entry
- **Use Cases:**
  - Plank: 1 set, 1 rep, 30 seconds duration
  - Timed run: 1 set, 1 rep, 300 seconds duration (5 minutes)
  - Sprint intervals: 1 set, 1 rep, 30 seconds duration

**TypeScript Interface:**

```typescript
interface Program {
  id: string
  name?: string // Optional - can be saved without name initially
  description?: string // Optional - can be saved without description initially
  objective?: string // Optional - can be saved without objective initially
  milestones: {
    name?: string
    theme?: string
    objective?: string
    days: {
      dayType: 'workout' | 'rest'
      exercises?: {
        exercise: string // Reference to Exercise ID
        sets: number
        reps: number
        restPeriod?: number // Rest time between sets (seconds)
        weight?: number // Weight to use (lbs)
        duration?: number // Exercise duration in seconds (for time-based exercises)
        notes?: string // Additional instructions
      }[]
      restNotes?: string
    }[]
  }[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}
```

## Removed Collections

**Milestones and Sessions Collections:** These collections have been removed and their functionality is now embedded within the Programs collection. The session concept has been eliminated entirely - exercises are now directly embedded within days, further simplifying the structure. This change eliminates the need to manage separate milestone and session entities, providing a more streamlined admin experience where all program structure is contained within a single document.

**Benefits of Removal:**

- **Simplified Data Model:** Fewer collections to manage and maintain
- **Better Admin UX:** No more bouncing between collections to edit program structure
- **Atomic Operations:** Entire program can be updated in one operation
- **Data Consistency:** No risk of orphaned milestones or sessions
- **Reduced Complexity:** Fewer relationships and foreign keys to manage

## Exercises Collection

**Purpose:** Represents individual exercises with metadata, videos, and alternatives.

**PayloadCMS Collection Definition:**

```typescript
export const Exercises: CollectionConfig = {
  slug: 'exercises',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false, // Allow saving without title initially
      admin: {
        description: 'Exercise title - required for publishing',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false, // Allow saving without description initially
      admin: {
        description: 'Exercise description - required for publishing',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      required: false, // Allow saving without video initially
      admin: {
        description: 'YouTube video URL - required for publishing',
      },
    },
    {
      name: 'alternatives',
      type: 'relationship',
      relationTo: 'exercises',
      hasMany: true,
    },
  ],
}
```

**TypeScript Interface:**

```typescript
interface Exercise {
  id: string
  title?: string // Optional - can be saved without title initially
  description?: string // Optional - can be saved without description initially
  videoUrl?: string // Optional - can be saved without video initially
  alternatives: string[]
  createdAt: Date
  updatedAt: Date
}
```

## ExerciseCompletions Collection

**Purpose:** Tracks individual exercise completions with performance data.

**PayloadCMS Collection Definition:**

```typescript
export const ExerciseCompletions: CollectionConfig = {
  slug: 'exerciseCompletions',
  fields: [
    {
      name: 'productUser',
      type: 'relationship',
      relationTo: 'productUsers',
      required: true,
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      required: true,
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      required: true,
      admin: {
        description: 'The program this exercise completion belongs to',
      },
    },
    {
      name: 'milestoneIndex',
      type: 'number',
      required: true,
      admin: {
        description: 'The milestone index within the program',
      },
    },
    {
      name: 'dayIndex',
      type: 'number',
      required: true,
      admin: {
        description: 'The day index within the milestone',
      },
    },
    {
      name: 'sets',
      type: 'number',
      required: true,
    },
    {
      name: 'reps',
      type: 'number',
      required: true,
    },
    {
      name: 'weight',
      type: 'number',
      required: false,
      admin: {
        description: 'Weight used (optional for bodyweight exercises)',
      },
    },
    {
      name: 'time',
      type: 'number',
      required: false,
      admin: {
        description: 'Time taken in seconds (optional)',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
    },
  ],
}
```

**TypeScript Interface:**

```typescript
interface ExerciseCompletion {
  id: string
  productUser: string // Reference to ProductUser ID
  exercise: string // Reference to Exercise ID
  program: string // Reference to Program ID
  milestoneIndex: number // Index of milestone within program
  dayIndex: number // Index of day within milestone
  sets: number
  reps: number
  weight?: number // Optional for bodyweight exercises
  time?: number // Optional - not relevant for all exercises
  completedAt: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```
