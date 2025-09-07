# Migration Plan: Embedded Schema Architecture

## Overview

This document outlines the comprehensive migration plan to transform the current normalized collection structure (Programs → Milestones → Sessions) into an embedded document architecture where all program structure lives within the Programs collection.

## Migration Goals

**Primary Objectives:**

- Consolidate program structure into single documents
- Eliminate separate milestone and session collections
- Maintain data integrity throughout migration
- Preserve all existing program data and relationships
- Minimize downtime and user impact

**Success Criteria:**

- All existing programs successfully migrated to embedded structure
- No data loss during migration
- Admin interface works seamlessly with new structure
- Product user experience remains unchanged

## Current vs. Target Architecture

### Current Structure

```
Programs Collection
├── milestones[] (relationship to Milestones collection)
    └── milestone (reference to Milestone ID)

Milestones Collection
├── name, theme, objective
├── days[] (array of day objects)
    ├── dayType (workout/rest)
    ├── sessions[] (relationship to Sessions collection)
        └── session (reference to Session ID)
    └── restNotes

Sessions Collection
├── name
└── exercises[] (array of exercise objects)
    ├── exercise (reference to Exercise ID)
    ├── sets, reps, restPeriod, weight, notes
```

### Target Structure

```
Programs Collection
├── name, description, objective
├── milestones[] (embedded array)
    ├── name, theme, objective
    ├── days[] (embedded array)
        ├── dayType (workout/rest)
        ├── exercises[] (embedded array)
            ├── exercise (reference to Exercise ID)
            ├── sets, reps, restPeriod, weight, notes
        └── restNotes
└── isPublished
```

## Migration Strategy

### Phase 1: Preparation and Backup

**Duration:** 1-2 hours
**Risk Level:** Low

**Tasks:**

1. **Create Full Database Backup**

   ```bash
   # MongoDB backup command
   mongodump --db workout-app --out ./backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Export Current Data**
   - Export all programs with populated relationships
   - Export all milestones with populated relationships
   - Export all sessions with populated relationships
   - Create JSON dumps for rollback purposes

3. **Create Migration Scripts**
   - Data transformation scripts
   - Validation scripts
   - Rollback scripts

### Phase 2: Data Transformation

**Duration:** 2-3 hours
**Risk Level:** Medium

**Migration Algorithm:**

```typescript
interface MigrationData {
  programs: Program[]
  milestones: Milestone[]
  sessions: Session[]
}

interface TransformedProgram {
  id: string
  name?: string
  description?: string
  objective?: string
  milestones: EmbeddedMilestone[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

interface EmbeddedMilestone {
  name?: string
  theme?: string
  objective?: string
  days: EmbeddedDay[]
}

interface EmbeddedDay {
  dayType: 'workout' | 'rest'
  exercises?: EmbeddedExercise[]
  restNotes?: string
}

interface EmbeddedExercise {
  exercise: string // Exercise ID reference
  sets: number
  reps: number
  restPeriod?: number
  weight?: number
  notes?: string
}

async function migratePrograms() {
  // 1. Fetch all programs with populated relationships
  const programs = await payload.find({
    collection: 'programs',
    depth: 3, // Deep populate to get all nested data
    limit: 1000,
  })

  // 2. Transform each program
  const transformedPrograms = programs.docs.map((program) => {
    const embeddedMilestones = program.milestones.map((programMilestone) => {
      const milestone = programMilestone.milestone // Populated milestone data

      const embeddedDays = milestone.days.map((day) => {
        const embeddedExercises =
          day.sessions?.flatMap((daySession) => {
            const session = daySession.session // Populated session data
            return session.exercises.map((exerciseData) => ({
              exercise: exerciseData.exercise, // Exercise ID
              sets: exerciseData.sets,
              reps: exerciseData.reps,
              restPeriod: exerciseData.restPeriod,
              weight: exerciseData.weight,
              notes: exerciseData.notes,
            }))
          }) || []

        return {
          dayType: day.dayType,
          exercises: embeddedExercises,
          restNotes: day.restNotes,
        }
      })

      return {
        name: milestone.name,
        theme: milestone.theme,
        objective: milestone.objective,
        days: embeddedDays,
      }
    })

    return {
      id: program.id,
      name: program.name,
      description: program.description,
      objective: program.objective,
      milestones: embeddedMilestones,
      isPublished: program.isPublished,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    }
  })

  // 3. Update programs with embedded data
  for (const transformedProgram of transformedPrograms) {
    await payload.update({
      collection: 'programs',
      id: transformedProgram.id,
      data: transformedProgram,
    })
  }
}
```

### Phase 3: Collection Schema Updates

**Duration:** 1 hour
**Risk Level:** Medium

**Tasks:**

1. **Update Programs Collection Schema**
   - Replace current programs.ts with new embedded schema
   - Remove milestone relationship fields
   - Add embedded milestone, day, and session fields

2. **Remove Milestones and Sessions Collections**
   - Comment out collection imports in payload.config.ts
   - Remove collection files (keep as backup)

3. **Update TypeScript Types**
   - Update payload-types.ts
   - Update custom type definitions

### Phase 4: Admin Interface Updates

**Duration:** 2-3 hours
**Risk Level:** Low

**Tasks:**

1. **Test Admin Interface**
   - Verify nested editing works correctly
   - Test drag-and-drop functionality
   - Validate progressive validation
   - Test publishing workflow

2. **Update Admin UI Components** (if needed)
   - Custom components for nested editing
   - Improved UX for deep nesting

### Phase 5: Validation and Testing

**Duration:** 1-2 hours
**Risk Level:** Low

**Tasks:**

1. **Data Integrity Validation**

   ```typescript
   async function validateMigration() {
     const programs = await payload.find({
       collection: 'programs',
       limit: 1000,
     })

     for (const program of programs.docs) {
       // Validate program structure
       assert(program.milestones, 'Program must have milestones')

       for (const milestone of program.milestones) {
         assert(milestone.days, 'Milestone must have days')

         for (const day of milestone.days) {
           if (day.dayType === 'workout') {
             assert(day.exercises, 'Workout day must have exercises')

             for (const exercise of day.exercises) {
               assert(exercise.exercise, 'Exercise must have exercise reference')
               assert(exercise.sets > 0, 'Exercise must have positive sets')
               assert(exercise.reps > 0, 'Exercise must have positive reps')
             }
           }
         }
       }
     }
   }
   ```

2. **Functional Testing**
   - Test program creation workflow
   - Test program editing workflow
   - Test program publishing
   - Test product user experience

## Rollback Plan

### Immediate Rollback (if migration fails)

**Duration:** 30 minutes

1. **Restore Database Backup**

   ```bash
   mongorestore --db workout-app ./backup-YYYYMMDD-HHMMSS/workout-app
   ```

2. **Revert Code Changes**
   - Restore original collection files
   - Restore original payload.config.ts
   - Deploy previous version

### Partial Rollback (if data issues discovered)

**Duration:** 1-2 hours

1. **Restore Original Collections**
   - Re-enable milestones and sessions collections
   - Restore original programs collection schema

2. **Data Recovery**
   - Use exported JSON data to restore relationships
   - Rebuild normalized structure from backup

## Risk Assessment and Mitigation

### High-Risk Areas

**1. Data Loss During Transformation**

- **Risk:** Complex nested data transformation could lose information
- **Mitigation:**
  - Comprehensive backup before migration
  - Step-by-step validation during transformation
  - Rollback plan ready

**2. Admin Interface Breaking**

- **Risk:** Nested editing might not work as expected
- **Mitigation:**
  - Thorough testing in development environment
  - Gradual rollout with feature flags
  - Fallback to simple editing if needed

**3. Performance Impact**

- **Risk:** Large embedded documents might impact performance
- **Mitigation:**
  - Monitor document sizes
  - Implement pagination for large programs
  - Consider splitting very large programs

### Medium-Risk Areas

**1. TypeScript Type Errors**

- **Risk:** Type mismatches during migration
- **Mitigation:**
  - Update types incrementally
  - Use type assertions during transition
  - Comprehensive type checking

**2. Product User Impact**

- **Risk:** Changes might affect product user experience
- **Mitigation:**
  - Maintain API compatibility
  - Test product user workflows
  - Gradual feature rollout

## Timeline

**Total Estimated Duration:** 6-10 hours

**Day 1 (4-5 hours):**

- Phase 1: Preparation and Backup (1-2 hours)
- Phase 2: Data Transformation (2-3 hours)

**Day 2 (2-3 hours):**

- Phase 3: Collection Schema Updates (1 hour)
- Phase 4: Admin Interface Updates (1-2 hours)

**Day 3 (1-2 hours):**

- Phase 5: Validation and Testing (1-2 hours)

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Monitor system performance
- [ ] Verify all programs are accessible
- [ ] Test admin workflows
- [ ] Check product user experience

### Short-term (Week 1)

- [ ] Monitor for any data inconsistencies
- [ ] Gather admin user feedback
- [ ] Optimize performance if needed
- [ ] Update documentation

### Long-term (Month 1)

- [ ] Remove old collection files
- [ ] Clean up unused code
- [ ] Update training materials
- [ ] Plan future optimizations

## Success Metrics

**Technical Metrics:**

- 100% of programs successfully migrated
- 0% data loss
- Admin interface response time < 2 seconds
- Product user experience unchanged

**User Experience Metrics:**

- Admin user satisfaction with new workflow
- Reduced time to create/edit programs
- Fewer support requests related to program management

## Conclusion

This migration plan provides a comprehensive approach to transforming the workout app's data architecture from a normalized structure to an embedded document model. The phased approach minimizes risk while ensuring data integrity and user experience continuity.

The embedded architecture will significantly improve the admin user experience by eliminating the need to manage separate milestone and session entities, while maintaining all the functionality and data relationships of the current system.
