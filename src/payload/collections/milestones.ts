import type { CollectionConfig } from 'payload'

export const Milestones: CollectionConfig = {
  slug: 'milestones',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'theme', 'objective'],
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
      label: 'Milestone Name',
      admin: {
        description: 'The name of the milestone. Required for publishing.',
      },
    },
    {
      name: 'theme',
      type: 'text',
      label: 'Theme',
      admin: {
        description: 'The theme or focus of this milestone. Required for publishing.',
      },
    },
    {
      name: 'objective',
      type: 'textarea',
      label: 'Objective',
      admin: {
        description: 'The objective or goal of this milestone. Required for publishing.',
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
          'Add days to this milestone. Drag and drop to reorder. Day number is automatically derived from position.',
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
          'Check this box to make the milestone visible to product users. Only published milestones will be visible to product users. Ensure all required fields are filled before publishing.',
      },
    },
  ],
}
