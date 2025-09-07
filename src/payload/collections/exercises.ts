import type { CollectionConfig } from 'payload'

export const Exercises: CollectionConfig = {
  slug: 'exercises',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', 'videoUrl'],
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
      name: 'title',
      type: 'text',
      label: 'Exercise Title',
      admin: {
        description: 'The name of the exercise. Required for publishing.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Exercise Description',
      admin: {
        description:
          'Detailed description of how to perform the exercise. Required for publishing.',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      admin: {
        description:
          'YouTube URL or video ID for exercise demonstration. Required for publishing. Use YouTube URLs or video IDs.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true // Allow empty for drafts

        // Basic YouTube URL validation
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/

        if (youtubeRegex.test(value) || videoIdRegex.test(value)) {
          return true
        }

        return 'Please provide a valid YouTube URL or video ID'
      },
    },
    {
      name: 'alternatives',
      type: 'relationship',
      relationTo: 'exercises',
      hasMany: true,
      label: 'Alternative Exercises',
      admin: {
        description: 'Select exercises that can be used as alternatives to this exercise.',
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
      admin: {
        description:
          'Check this box to make the exercise visible to product users. Only published exercises will be visible to product users. Ensure all required fields are filled before publishing.',
      },
    },
  ],
}
