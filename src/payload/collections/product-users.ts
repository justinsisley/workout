import type { CollectionConfig } from 'payload'

export const ProductUsers: CollectionConfig = {
  slug: 'productUsers',
  admin: {
    useAsTitle: 'username',
    defaultColumns: ['username', 'currentProgram', 'currentMilestone', 'currentDay'],
    description:
      'Product users are app users who authenticate via WebAuthN passkeys. They are completely separate from admin users.',
    group: 'Application Data',
  },
  access: {
    // Only authenticated admin users can manage product users
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Globally unique username for passkey authentication. Must be unique across all product users.',
      },
      validate: (value: string | null | undefined) => {
        if (!value || typeof value !== 'string') {
          return 'Username is required'
        }

        // Username validation: 3-20 characters, alphanumeric and underscores only
        if (value.length < 3 || value.length > 20) {
          return 'Username must be between 3 and 20 characters'
        }

        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return 'Username can only contain letters, numbers, and underscores'
        }

        return true
      },
    },
    {
      name: 'passkeyCredentials',
      type: 'array',
      fields: [
        {
          name: 'credentialID',
          type: 'text',
          required: true,
        },
        {
          name: 'publicKey',
          type: 'text',
          required: true,
        },
        {
          name: 'counter',
          type: 'number',
          required: true,
        },
        {
          name: 'deviceType',
          type: 'text',
        },
        {
          name: 'backedUp',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'transports',
          type: 'array',
          fields: [
            {
              name: 'transport',
              type: 'text',
            },
          ],
        },
      ],
      admin: {
        description: 'WebAuthN passkey credentials for this user.',
      },
    },
    {
      name: 'currentProgram',
      type: 'relationship',
      relationTo: 'programs',
      admin: {
        description: 'The program the user is currently enrolled in.',
      },
    },
    {
      name: 'currentMilestone',
      type: 'relationship',
      relationTo: 'programs',
      admin: {
        description: 'The current milestone within the program.',
      },
    },
    {
      name: 'currentDay',
      type: 'number',
      defaultValue: 1,
      min: 1,
      admin: {
        description: 'The current day index within the milestone (1-based).',
      },
    },
    {
      name: 'lastWorkoutDate',
      type: 'date',
      admin: {
        description: 'Date of the last completed workout.',
      },
    },
    {
      name: 'totalWorkoutsCompleted',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total number of workouts completed by this user.',
      },
    },
  ],
}
