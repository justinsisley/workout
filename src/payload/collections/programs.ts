import type { CollectionConfig } from 'payload'

export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPublished', 'createdAt'],
    group: 'Admin',
    description:
      'Fitness programs with progressive validation. Save as draft first, then publish when complete.',
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
          'The milestones that make up this program, in order. Drag and drop to reorder milestones in the program sequence. At least one milestone is required for publishing.',
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
        description:
          'Check this box to make the program visible to product users. ⚠️ All required fields (name, description, objective, milestones) must be filled before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
