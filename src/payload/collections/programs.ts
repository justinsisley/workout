import type { CollectionConfig } from 'payload'

export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPublished', 'createdAt'],
    group: 'Admin',
    description:
      'Fitness programs with embedded milestones, days, and exercises. Save as draft first, then publish when complete.',
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

          // Validate embedded milestones structure
          if (!data.milestones || data.milestones.length === 0) {
            errors.push('At least one milestone is required for publishing')
          } else {
            // Validate each milestone
            data.milestones.forEach((milestone: any, milestoneIndex: number) => {
              if (!milestone.name || milestone.name.trim() === '') {
                errors.push(`Milestone ${milestoneIndex + 1}: name is required for publishing`)
              }
              if (!milestone.theme || milestone.theme.trim() === '') {
                errors.push(`Milestone ${milestoneIndex + 1}: theme is required for publishing`)
              }
              if (!milestone.objective || milestone.objective.trim() === '') {
                errors.push(`Milestone ${milestoneIndex + 1}: objective is required for publishing`)
              }
              if (!milestone.days || milestone.days.length === 0) {
                errors.push(
                  `Milestone ${milestoneIndex + 1}: at least one day is required for publishing`,
                )
              } else {
                // Validate each day
                milestone.days.forEach((day: any, dayIndex: number) => {
                  if (!day.dayType) {
                    errors.push(
                      `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}: day type is required for publishing`,
                    )
                  }
                  if (day.dayType === 'workout' && (!day.exercises || day.exercises.length === 0)) {
                    errors.push(
                      `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}: at least one exercise is required for workout days`,
                    )
                  }
                  if (day.dayType === 'workout' && day.exercises) {
                    // Validate each exercise in workout days
                    day.exercises.forEach((exercise: any, exerciseIndex: number) => {
                      if (!exercise.exercise) {
                        errors.push(
                          `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: exercise reference is required`,
                        )
                      }
                      if (!exercise.sets || exercise.sets < 1) {
                        errors.push(
                          `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: sets must be at least 1`,
                        )
                      }
                      if (!exercise.reps || exercise.reps < 1) {
                        errors.push(
                          `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: reps must be at least 1`,
                        )
                      }
                    })
                  }
                })
              }
            })
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
          name: 'name',
          type: 'text',
          label: 'Milestone Name',
          admin: {
            description:
              'The name of this milestone (e.g., "Foundation Phase", "Strength Building")',
            placeholder: 'e.g., "Foundation Phase"',
          },
        },
        {
          name: 'theme',
          type: 'text',
          label: 'Milestone Theme',
          admin: {
            description:
              'The theme or focus of this milestone (e.g., "Strength", "Endurance", "Technique")',
            placeholder: 'e.g., "Strength Building"',
          },
        },
        {
          name: 'objective',
          type: 'text',
          label: 'Milestone Objective',
          admin: {
            description: 'The specific goal or outcome for this milestone',
            placeholder: 'e.g., "Build foundational strength and proper form"',
          },
        },
        {
          name: 'days',
          type: 'array',
          label: 'Milestone Days',
          admin: {
            description:
              'The days that make up this milestone, in order. Drag and drop to reorder days. Mix workout and rest days as needed.',
            initCollapsed: false,
          },
          fields: [
            {
              name: 'dayType',
              type: 'select',
              label: 'Day Type',
              required: true,
              options: [
                { label: 'Workout Day', value: 'workout' },
                { label: 'Rest Day', value: 'rest' },
              ],
              admin: {
                description: 'Choose whether this is a workout day or rest day',
              },
            },
            {
              name: 'exercises',
              type: 'array',
              label: 'Exercises',
              admin: {
                description: 'Exercises for this workout day. Only shown for workout days.',
                condition: (_, siblingData) => siblingData?.dayType === 'workout',
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'exercise',
                  type: 'relationship',
                  relationTo: 'exercises',
                  required: true,
                  label: 'Exercise',
                  admin: {
                    description: 'Select the exercise to perform',
                    allowCreate: false,
                  },
                },
                {
                  name: 'sets',
                  type: 'number',
                  label: 'Sets',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Number of sets to perform',
                    placeholder: 'e.g., 3',
                  },
                },
                {
                  name: 'reps',
                  type: 'number',
                  label: 'Reps',
                  required: true,
                  min: 1,
                  admin: {
                    description: 'Number of repetitions per set',
                    placeholder: 'e.g., 10',
                  },
                },
                {
                  name: 'restPeriod',
                  type: 'number',
                  label: 'Rest Period (seconds)',
                  admin: {
                    description: 'Rest time between sets in seconds',
                    placeholder: 'e.g., 60',
                  },
                },
                {
                  name: 'weight',
                  type: 'number',
                  label: 'Weight (lbs)',
                  admin: {
                    description: 'Weight to use for this exercise (optional)',
                    placeholder: 'e.g., 25',
                  },
                },
                {
                  name: 'notes',
                  type: 'textarea',
                  label: 'Exercise Notes',
                  admin: {
                    description: 'Additional instructions or notes for this exercise',
                    placeholder: 'e.g., "Focus on slow, controlled movement"',
                  },
                },
              ],
            },
            {
              name: 'restNotes',
              type: 'textarea',
              label: 'Rest Day Notes',
              admin: {
                description: 'Notes or instructions for this rest day. Only shown for rest days.',
                condition: (_, siblingData) => siblingData?.dayType === 'rest',
                placeholder: 'e.g., "Active recovery - light walking or stretching recommended"',
              },
            },
          ],
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
          'Check this box to make the program visible to product users. ⚠️ All required fields must be filled before publishing.',
        position: 'sidebar',
      },
    },
  ],
}
