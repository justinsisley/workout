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

**Problem:** Traditional required field validation blocks iterative content creation workflows where admins need to bounce between programs, milestones, weeks, days, and sessions.

**Solution:** Implement a progressive validation system that allows saving incomplete content while providing clear visibility into completion status.

**Key Principles:**

- **Save Early, Save Often:** Allow saving content at any stage of completion
- **Visual Completion Indicators:** Clear UI indicators showing what's missing
- **Contextual Warnings:** Show warnings when content won't be visible to product users
- **Flexible Publishing:** Separate draft state from publishable state

**Implementation Details:**

**1. No Required Fields at Save Time:**

- All content can be saved in draft state without any required fields
- Admin users can bounce between programs, milestones, weeks, days, and sessions freely
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

- Custom SMS OTP authentication only
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

**Purpose:** Represents product users (Justin and wife) with phone-based authentication and program progress tracking. This is completely separate from PayloadCMS admin users.

**PayloadCMS Collection Definition:**

```typescript
export const ProductUsers: CollectionConfig = {
  slug: 'productUsers',
  auth: false, // Custom SMS authentication only
  fields: [
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Phone number for SMS authentication',
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
  phoneNumber: string
  displayName?: string
  currentProgram?: string
  currentMilestone?: string
  currentDay: number
  lastWorkoutDate?: Date
  totalWorkoutsCompleted: number
  createdAt: Date
  updatedAt: Date
}
```

## Programs Collection

**Purpose:** Represents complete workout programs with hierarchical structure and metadata.

**PayloadCMS Collection Definition:**

```typescript
export const Programs: CollectionConfig = {
  slug: 'programs',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false, // Allow saving without name initially
      admin: {
        description: 'Program name - required for publishing',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false, // Allow saving without description initially
      admin: {
        description: 'Program description - required for publishing',
      },
    },
    {
      name: 'objective',
      type: 'text',
      required: false, // Allow saving without objective initially
      admin: {
        description: 'Program objective - required for publishing',
      },
    },
    {
      name: 'culminatingEvent',
      type: 'relationship',
      relationTo: 'sessions',
      required: false, // Allow saving without culminating event initially
      admin: {
        description: 'Culminating event session - required for publishing',
      },
    },
    {
      name: 'milestones',
      type: 'array',
      fields: [
        {
          name: 'milestone',
          type: 'relationship',
          relationTo: 'milestones',
          required: true,
        },
      ],
      admin: {
        description: 'Ordered list of milestones in this program - drag to reorder',
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Only published programs are visible to product users',
      },
    },
  ],
}
```

**TypeScript Interface:**

```typescript
interface Program {
  id: string
  name?: string // Optional - can be saved without name initially
  description?: string // Optional - can be saved without description initially
  objective?: string // Optional - can be saved without objective initially
  culminatingEvent?: string // Optional - can be saved without culminating event initially
  milestones: {
    milestone: string // Reference to Milestone ID
  }[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}
```

## Milestones Collection

**Purpose:** Represents major phases within a program with specific themes and objectives.

**PayloadCMS Collection Definition:**

```typescript
export const Milestones: CollectionConfig = {
  slug: 'milestones',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false, // Allow saving without name initially
      admin: {
        description: 'Milestone name - required for publishing',
      },
    },
    {
      name: 'theme',
      type: 'text',
      required: false, // Allow saving without theme initially
      admin: {
        description: 'Milestone theme - required for publishing',
      },
    },
    {
      name: 'objective',
      type: 'text',
      required: false, // Allow saving without objective initially
      admin: {
        description: 'Milestone objective - required for publishing',
      },
    },
    {
      name: 'culminatingEvent',
      type: 'relationship',
      relationTo: 'sessions',
      required: false, // Allow saving without culminating event initially
      admin: {
        description: 'Culminating event session - required for publishing',
      },
    },
    {
      name: 'days',
      type: 'array',
      fields: [
        {
          name: 'dayType',
          type: 'select',
          options: [
            { label: 'Workout Day', value: 'workout' },
            { label: 'Rest Day', value: 'rest' },
          ],
          required: true,
          defaultValue: 'workout',
        },
        {
          name: 'sessions',
          type: 'array',
          admin: {
            condition: (data) => data.dayType === 'workout',
            description: 'Add workout sessions for this day',
          },
          fields: [
            {
              name: 'session',
              type: 'relationship',
              relationTo: 'sessions',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
```

**TypeScript Interface:**

```typescript
interface Milestone {
  id: string
  name?: string // Optional - can be saved without name initially
  theme?: string // Optional - can be saved without theme initially
  objective?: string // Optional - can be saved without objective initially
  culminatingEvent?: string // Optional - can be saved without culminating event initially
  days: {
    dayType: 'workout' | 'rest'
    sessions?: {
      session: string // Reference to Session ID
    }[]
  }[]
  createdAt: Date
  updatedAt: Date
}
```

## Sessions Collection

**Purpose:** Represents reusable workout sessions with exercises, sets, reps, and rest periods. Sessions are now standalone entities that can be reused across different milestones and days.

**PayloadCMS Collection Definition:**

```typescript
export const Sessions: CollectionConfig = {
  slug: 'sessions',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false, // Allow saving without name initially
      admin: {
        description: 'Session name for admin organization - not shown to product users',
      },
    },
    {
      name: 'exercises',
      type: 'array',
      fields: [
        {
          name: 'exercise',
          type: 'relationship',
          relationTo: 'exercises',
          required: true,
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
          name: 'restPeriod',
          type: 'number',
          required: true,
          admin: {
            description: 'Rest period in seconds between sets',
          },
        },
        {
          name: 'weight',
          type: 'number',
          required: false,
          admin: {
            description: 'Recommended weight in pounds (optional)',
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Additional notes for this exercise in this session',
          },
        },
      ],
      admin: {
        description: 'Ordered list of exercises in this session - drag to reorder',
      },
    },
  ],
}
```

**TypeScript Interface:**

```typescript
interface Session {
  id: string
  name?: string // Optional - for admin organization only
  exercises: {
    exercise: string // Reference to Exercise ID
    sets: number
    reps: number
    restPeriod: number // in seconds
    weight?: number // in pounds
    notes?: string
  }[]
  createdAt: Date
  updatedAt: Date
}
```

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
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
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
  exercise: string
  session: string
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
