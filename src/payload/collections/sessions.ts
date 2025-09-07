import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'exercises'],
    group: 'Admin',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
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
        description: 'Add exercises to this session. Drag and drop to reorder.',
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
          'Check this box to make the session visible to product users. Only published sessions will be visible to product users. Ensure all required fields are filled before publishing.',
      },
    },
  ],
}
