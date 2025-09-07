import type { CollectionConfig } from 'payload'

export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPublished', 'createdAt'],
    group: 'Admin',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Program Name',
      admin: {
        description: 'The name of the fitness program (required for publishing)',
        placeholder: 'e.g., "Beginner Strength Program"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Program Description',
      admin: {
        description: 'A detailed description of what this program covers (required for publishing)',
        placeholder: 'Describe the program goals, target audience, and what users will achieve...',
      },
    },
    {
      name: 'objective',
      type: 'text',
      label: 'Program Objective',
      admin: {
        description: 'The main goal or outcome of this program (required for publishing)',
        placeholder: 'e.g., "Build foundational strength and muscle mass"',
      },
    },
    {
      name: 'culminatingEvent',
      type: 'relationship',
      relationTo: 'sessions',
      label: 'Culminating Event',
      admin: {
        description: 'The final session or event that marks program completion (optional)',
        allowCreate: true,
      },
    },
    {
      name: 'milestones',
      type: 'array',
      label: 'Program Milestones',
      admin: {
        description:
          'The milestones that make up this program, in order. Drag and drop to reorder milestones in the program sequence',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'milestone',
          type: 'relationship',
          relationTo: 'milestones',
          required: true,
          label: 'Milestone',
          admin: {
            allowCreate: true,
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
        description: 'Check this box to make the program visible to product users',
        position: 'sidebar',
      },
    },
  ],
}
