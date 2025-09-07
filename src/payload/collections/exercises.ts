import type { CollectionConfig } from 'payload'

export const Exercises: CollectionConfig = {
  slug: 'exercises',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', 'videoUrl', 'isPublished'],
    group: 'Admin',
    description:
      'Exercise definitions with progressive validation. Save as draft first, then publish when complete.',
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

          if (!data.title || data.title.trim() === '') {
            errors.push('Title is required for publishing')
          }

          if (!data.description || data.description.trim() === '') {
            errors.push('Description is required for publishing')
          }

          if (!data.videoUrl || data.videoUrl.trim() === '') {
            errors.push('Video URL is required for publishing')
          }

          if (errors.length > 0) {
            throw new Error(`Cannot publish exercise: ${errors.join(', ')}`)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Exercise Title',
      admin: {
        description:
          'The name of the exercise. Can be saved as draft without this field, but required for publishing.',
        placeholder: 'e.g., "Push-ups"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Exercise Description',
      admin: {
        description:
          'Detailed description of how to perform the exercise. Can be saved as draft without this field, but required for publishing.',
        placeholder: 'Describe proper form, technique, and any important safety considerations...',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      admin: {
        description:
          'YouTube URL or video ID for exercise demonstration. Can be saved as draft without this field, but required for publishing. Use YouTube URLs or video IDs.',
        placeholder: 'https://www.youtube.com/watch?v=... or video ID',
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
          'Check this box to make the exercise visible to product users. Only published exercises will be visible to product users. ⚠️ All required fields (title, description, video URL) must be filled before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
