import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'exercises', 'isPublished'],
    group: 'Admin',
    description:
      'Workout sessions with progressive validation. Save as draft first, then publish when complete.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Progressive validation: only enforce required fields when publishing
        if (data?.isPublished && operation === 'update') {
          const errors: string[] = []

          if (!data.exercises || data.exercises.length === 0) {
            errors.push('At least one exercise is required for publishing')
          }

          if (errors.length > 0) {
            throw new Error(`Cannot publish session: ${errors.join(', ')}`)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Session Name',
      admin: {
        description: 'Optional name for admin organization. Not visible to product users.',
      },
    },
    {
      name: 'exercises',
      type: 'array',
      label: 'Exercises',
      minRows: 1,
      admin: {
        description:
          'Add exercises to this session. Drag and drop to reorder. At least one exercise is required for publishing.',
      },
      fields: [
        {
          name: 'exercise',
          type: 'relationship',
          relationTo: 'exercises',
          required: true,
          label: 'Exercise',
          admin: {
            description: 'Select the exercise to include in this session.',
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
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
      admin: {
        description:
          'Check this box to make the session visible to product users. Only published sessions will be visible to product users. ⚠️ At least one exercise is required for publishing.',
        position: 'sidebar',
      },
    },
  ],
}
