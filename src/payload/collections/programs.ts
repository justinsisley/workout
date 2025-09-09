import type { CollectionConfig } from 'payload'
import { ExerciseRowLabel } from '../../components/admin/exercise-row-label'

export const Programs: CollectionConfig = {
  slug: 'programs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isPublished', 'createdAt'],
    group: 'Admin',
    description:
      'Fitness programs with embedded milestones, days, and exercises. Save as draft first, then publish when complete.',
    pagination: {
      defaultLimit: 10,
    },
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
            data.milestones.forEach(
              (milestone: Record<string, unknown>, milestoneIndex: number) => {
                if (
                  !milestone.name ||
                  (typeof milestone.name === 'string' && milestone.name.trim() === '')
                ) {
                  errors.push(`Milestone ${milestoneIndex + 1}: name is required for publishing`)
                }
                if (
                  !milestone.theme ||
                  (typeof milestone.theme === 'string' && milestone.theme.trim() === '')
                ) {
                  errors.push(`Milestone ${milestoneIndex + 1}: theme is required for publishing`)
                }
                if (
                  !milestone.objective ||
                  (typeof milestone.objective === 'string' && milestone.objective.trim() === '')
                ) {
                  errors.push(
                    `Milestone ${milestoneIndex + 1}: objective is required for publishing`,
                  )
                }
                if (
                  !milestone.days ||
                  !Array.isArray(milestone.days) ||
                  milestone.days.length === 0
                ) {
                  errors.push(
                    `Milestone ${milestoneIndex + 1}: at least one day is required for publishing`,
                  )
                } else {
                  // Validate each day
                  ;(milestone.days as Record<string, unknown>[]).forEach(
                    (day: Record<string, unknown>, dayIndex: number) => {
                      if (!day.dayType) {
                        errors.push(
                          `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}: day type is required for publishing`,
                        )
                      }
                      if (
                        day.dayType === 'workout' &&
                        (!day.exercises ||
                          !Array.isArray(day.exercises) ||
                          day.exercises.length === 0)
                      ) {
                        errors.push(
                          `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}: at least one exercise is required for workout days`,
                        )
                      }
                      if (day.dayType === 'workout' && day.exercises) {
                        // Validate each exercise in workout days
                        ;(day.exercises as Record<string, unknown>[]).forEach(
                          (exercise: Record<string, unknown>, exerciseIndex: number) => {
                            if (!exercise.exercise) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: exercise reference is required`,
                              )
                            }
                            if (
                              !exercise.sets ||
                              (typeof exercise.sets === 'number' && exercise.sets < 1)
                            ) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: sets must be at least 1`,
                              )
                            }
                            if (
                              !exercise.reps ||
                              (typeof exercise.reps === 'number' && exercise.reps < 1)
                            ) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: reps must be at least 1`,
                              )
                            }
                            // Validate duration fields - both or neither required
                            const hasDurationValue =
                              exercise.durationValue &&
                              typeof exercise.durationValue === 'number' &&
                              exercise.durationValue > 0
                            const hasDurationUnit = exercise.durationUnit
                            if (hasDurationValue && !hasDurationUnit) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: duration unit is required when duration value is specified`,
                              )
                            }
                            if (hasDurationUnit && !hasDurationValue) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: duration value is required when duration unit is specified`,
                              )
                            }
                            // Validate reasonable duration ranges per unit
                            if (
                              hasDurationValue &&
                              hasDurationUnit &&
                              typeof exercise.durationValue === 'number'
                            ) {
                              const durationValue = exercise.durationValue
                              if (exercise.durationUnit === 'hours' && durationValue > 99) {
                                errors.push(
                                  `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: duration cannot exceed 99 hours`,
                                )
                              }
                              if (exercise.durationUnit === 'minutes' && durationValue > 999) {
                                errors.push(
                                  `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: duration cannot exceed 999 minutes`,
                                )
                              }
                              if (exercise.durationUnit === 'seconds' && durationValue > 999) {
                                errors.push(
                                  `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: duration cannot exceed 999 seconds`,
                                )
                              }
                            }
                            // Validate distance fields - both or neither required
                            const hasDistanceValue =
                              exercise.distanceValue &&
                              typeof exercise.distanceValue === 'number' &&
                              exercise.distanceValue > 0
                            const hasDistanceUnit = exercise.distanceUnit
                            if (hasDistanceValue && !hasDistanceUnit) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: distance unit is required when distance value is specified`,
                              )
                            }
                            if (hasDistanceUnit && !hasDistanceValue) {
                              errors.push(
                                `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: distance value is required when distance unit is specified`,
                              )
                            }
                            // Validate reasonable distance ranges per unit
                            if (
                              hasDistanceValue &&
                              hasDistanceUnit &&
                              typeof exercise.distanceValue === 'number'
                            ) {
                              const distanceValue = exercise.distanceValue
                              if (exercise.distanceUnit === 'miles' && distanceValue > 100) {
                                errors.push(
                                  `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: distance cannot exceed 100 miles`,
                                )
                              }
                              if (exercise.distanceUnit === 'meters' && distanceValue > 50000) {
                                errors.push(
                                  `Milestone ${milestoneIndex + 1}, Day ${dayIndex + 1}, Exercise ${exerciseIndex + 1}: distance cannot exceed 50,000 meters`,
                                )
                              }
                            }
                          },
                        )
                      }
                    },
                  )
                }
              },
            )
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
      minRows: 1,
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
          minRows: 1,
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
              defaultValue: 'workout',
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
              minRows: 1,
              admin: {
                description:
                  'Exercises for this workout day. Only shown for workout days. Drag and drop to reorder exercises.',
                condition: (_, siblingData) => siblingData?.dayType === 'workout',
                initCollapsed: false,
                components: {
                  RowLabel: ExerciseRowLabel,
                } as Record<string, unknown>,
              },
              labels: {
                singular: 'Exercise',
                plural: 'Exercises',
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
                    sortOptions: 'title',
                  },
                },
                {
                  name: 'sets',
                  type: 'number',
                  label: 'Sets',
                  required: true,
                  min: 1,
                  max: 20,
                  admin: {
                    description: 'Number of sets to perform (1-20)',
                    placeholder: 'e.g., 3',
                    step: 1,
                  },
                },
                {
                  name: 'reps',
                  type: 'number',
                  label: 'Reps',
                  required: true,
                  min: 1,
                  max: 100,
                  admin: {
                    description: 'Number of repetitions per set (1-100)',
                    placeholder: 'e.g., 10',
                    step: 1,
                  },
                },
                {
                  name: 'restPeriod',
                  type: 'number',
                  label: 'Rest Period (seconds)',
                  min: 0,
                  max: 600,
                  admin: {
                    description: 'Rest time between sets in seconds (0-600)',
                    placeholder: 'e.g., 60',
                    step: 15,
                  },
                },
                {
                  name: 'weight',
                  type: 'number',
                  label: 'Weight (lbs)',
                  min: 0,
                  max: 1000,
                  admin: {
                    description: 'Weight to use for this exercise in pounds (0-1000)',
                    placeholder: 'e.g., 25',
                    step: 2.5,
                  },
                },
                {
                  name: 'durationValue',
                  type: 'number',
                  label: 'Duration Value',
                  min: 0,
                  max: 999,
                  admin: {
                    description:
                      'Duration amount for time-based exercises like planks, holds, or timed runs. Examples: 30 seconds for plank, 5 minutes for run, 1 hour for ruck march. Both value and unit must be specified together.',
                    placeholder: 'e.g., 30, 5, 1',
                    step: 1,
                    width: '50%',
                  },
                },
                {
                  name: 'durationUnit',
                  type: 'select',
                  label: 'Duration Unit',
                  options: [
                    { label: 'Seconds', value: 'seconds' },
                    { label: 'Minutes', value: 'minutes' },
                    { label: 'Hours', value: 'hours' },
                  ],
                  admin: {
                    description:
                      'Time unit for the duration value. Choose Seconds for short holds (planks, wall sits), Minutes for moderate activities (runs, bike rides), or Hours for long activities (ruck marches, hikes). Both value and unit must be specified together.',
                    width: '50%',
                  },
                },
                {
                  name: 'distanceValue',
                  type: 'number',
                  label: 'Distance Value',
                  min: 0,
                  max: 999,
                  admin: {
                    description:
                      'Distance amount for distance-based exercises like runs, walks, or bike rides. Examples: 1.5 miles for run, 500 meters for sprint, 3 miles for bike ride. Both value and unit must be specified together.',
                    placeholder: 'e.g., 1.5, 500, 3',
                    step: 0.1,
                    width: '50%',
                  },
                },
                {
                  name: 'distanceUnit',
                  type: 'select',
                  label: 'Distance Unit',
                  options: [
                    { label: 'Meters', value: 'meters' },
                    { label: 'Miles', value: 'miles' },
                  ],
                  admin: {
                    description:
                      'Distance unit for the distance value. Choose Meters for shorter distances (sprints, short runs), or Miles for longer distances (runs, bike rides, walks). Both value and unit must be specified together.',
                    width: '50%',
                  },
                },
                {
                  name: 'notes',
                  type: 'textarea',
                  label: 'Exercise Notes',
                  maxLength: 500,
                  admin: {
                    description:
                      'Additional instructions or notes for this exercise (Max 500 characters)',
                    placeholder: 'e.g., "Focus on slow, controlled movement"',
                    rows: 3,
                  },
                },
              ],
            },
            {
              name: 'restNotes',
              type: 'textarea',
              label: 'Rest Day Notes',
              maxLength: 500,
              admin: {
                description:
                  'Notes or instructions for this rest day. Only shown for rest days. (Max 500 characters)',
                condition: (_, siblingData) => siblingData?.dayType === 'rest',
                placeholder: 'e.g., "Active recovery - light walking or stretching recommended"',
                rows: 3,
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
