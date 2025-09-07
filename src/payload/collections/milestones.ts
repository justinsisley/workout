import type { CollectionConfig } from 'payload'

export const Milestones: CollectionConfig = {
  slug: 'milestones',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'theme', 'objective', 'isPublished'],
    group: 'Admin',
    description:
      'Program milestones with progressive validation. Save as draft first, then publish when complete.',
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

          if (!data.name || data.name.trim() === '') {
            errors.push('Milestone name is required for publishing')
          }

          if (!data.theme || data.theme.trim() === '') {
            errors.push('Milestone theme is required for publishing')
          }

          if (!data.objective || data.objective.trim() === '') {
            errors.push('Milestone objective is required for publishing')
          }

          if (!data.days || data.days.length === 0) {
            errors.push('At least one day is required for publishing')
          }

          if (errors.length > 0) {
            throw new Error(`Cannot publish milestone: ${errors.join(', ')}`)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Milestone Name',
      admin: {
        description:
          'The name of the milestone. Can be saved as draft without this field, but required for publishing.',
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
      name: 'culminatingEvent',
      type: 'relationship',
      relationTo: 'sessions',
      label: 'Culminating Event',
      admin: {
        description:
          'The final session or event that concludes this milestone. Optional for drafts.',
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
      },
      fields: [
        {
          name: 'dayType',
          type: 'select',
          options: [
            {
              label: 'Workout',
              value: 'workout',
            },
            {
              label: 'Rest',
              value: 'rest',
            },
          ],
          required: true,
          defaultValue: 'workout',
          label: 'Day Type',
          admin: {
            description: 'Select whether this is a workout day or rest day.',
          },
        },
        {
          name: 'sessions',
          type: 'array',
          label: 'Sessions',
          admin: {
            description: 'Add workout sessions for this day. Only visible for workout days.',
            condition: (_, siblingData) => siblingData?.dayType === 'workout',
          },
          fields: [
            {
              name: 'session',
              type: 'relationship',
              relationTo: 'sessions',
              required: true,
              label: 'Session',
              admin: {
                description: 'Select the session to include in this day.',
              },
            },
            {
              name: 'order',
              type: 'number',
              label: 'Order',
              required: true,
              min: 1,
              admin: {
                description: 'The order in which this session should be performed (1, 2, 3, etc.).',
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
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
      admin: {
        description:
          'Check this box to make the milestone visible to product users. Only published milestones will be visible to product users. ⚠️ All required fields (name, theme, objective, days) must be filled before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
