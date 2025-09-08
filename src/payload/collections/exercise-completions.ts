import type { CollectionConfig } from 'payload'

export const ExerciseCompletions: CollectionConfig = {
  slug: 'exerciseCompletions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'productUser',
      'exercise',
      'program',
      'milestoneIndex',
      'dayIndex',
      'completedAt',
    ],
    description:
      'Exercise completion records track when users complete exercises with their performance data.',
    group: 'Application Data',
  },
  access: {
    // Only authenticated admin users can manage exercise completions
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'productUser',
      type: 'relationship',
      relationTo: 'productUsers',
      required: true,
      admin: {
        description: 'The product user who completed this exercise.',
      },
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      required: true,
      admin: {
        description: 'The exercise that was completed.',
      },
    },
    {
      name: 'program',
      type: 'relationship',
      relationTo: 'programs',
      required: true,
      admin: {
        description: 'The program in which this exercise was completed.',
      },
    },
    {
      name: 'milestoneIndex',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Index of the milestone within the program (0-based).',
      },
    },
    {
      name: 'dayIndex',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Index of the day within the milestone (0-based).',
      },
    },
    {
      name: 'sets',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Number of sets completed for this exercise.',
      },
    },
    {
      name: 'reps',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Number of repetitions completed per set.',
      },
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      admin: {
        description: 'Weight used for this exercise (optional, for weighted exercises).',
      },
    },
    {
      name: 'time',
      type: 'number',
      min: 0,
      admin: {
        description:
          'Time taken to complete the exercise in seconds (optional, for timed exercises).',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'Date and time when the exercise was completed.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Optional notes about the exercise completion (form, difficulty, etc.).',
      },
    },
  ],
}
