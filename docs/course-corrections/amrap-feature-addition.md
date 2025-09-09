# Course Correction: AMRAP Feature Addition to Story 1.3

**Date:** September 9, 2025  
**Agent:** Sarah (Product Owner)  
**Change Type:** Additive Enhancement  
**Status:** Approved - Ready for Architecture & UX Review

## Change Trigger & Context

### Issue Discovery

During real-world testing of the workout application with an actual fitness program, discovered that AMRAP (As Many Rounds As Possible) workouts are a common and essential format that requires specific system support for optimal user experience.

### Key Insights

- **Real-world validation:** AMRAP days represent entire workout sessions, not partial components
- **User experience impact:** AMRAP workouts need different presentation than standard set/rep exercises
- **Admin workflow:** Current exercise setup process works perfectly - enhancement needed for day-level designation
- **Format definition:** AMRAP = complete rounds of specified exercises within a time duration (typically minutes)

### Example AMRAP Workout

- **Day Type:** Workout (with AMRAP designation)
- **Duration:** 12 minutes
- **Exercises:**
  - Exercise 1: Push-ups (10 reps)
  - Exercise 2: Sit-ups (15 reps)
  - Exercise 3: Bodyweight squats (20 reps)
- **User Experience:** Complete all exercises in sequence, then repeat the cycle for the full 12 minutes

## Impact Analysis Summary

### Epic Impact Assessment

- **Current Epic (Epic 1):** ✅ Enhanced admin capabilities, no disruption
- **Future Epics:** ✅ Epic 3 gains AMRAP-aware user experience capabilities
- **Epic Structure:** ✅ All epics remain valid, no reordering needed

### Artifact Impact Assessment

- **PRD Requirements:** ✅ Optional new functional requirement for AMRAP support
- **Architecture:** ✅ Minor schema additions to Programs collection days array
- **Frontend Specs:** ✅ Future Epic 3 components will inherit AMRAP capabilities
- **Technology Stack:** ✅ No new technologies required

### Technical Feasibility

- **Database Schema:** ✅ Simple field additions to embedded structure
- **Admin Interface:** ✅ Builds on existing conditional field patterns
- **User Interface:** ✅ Future enhancement using established patterns
- **Data Migration:** ✅ Additive fields with sensible defaults

## Approved Solution

### Path Forward: Direct Integration

**Selected Approach:** Add AMRAP functionality as additive enhancement to Story 1.3

**Rationale:**

- Zero rework - all completed work remains valuable
- Natural architectural fit with embedded schema
- Low complexity with high user value
- Real-world validated requirement

### Core Requirements

1. **Admin Interface Enhancement**
   - Add AMRAP day designation checkbox for workout days
   - Add AMRAP duration field (minutes) with conditional visibility
   - Implement validation requiring duration when AMRAP selected

2. **User Experience Future Enhancement** (Epic 3)
   - AMRAP day detection and specialized display
   - Round-based exercise presentation instead of set-based tracking
   - AMRAP-specific progress tracking (rounds completed)

## Specific Implementation Changes

### 1. Story 1.3 Updates

**File:** `docs/stories/1.3.admin-interface-and-program-creation.md`

**Add Acceptance Criterion:**

```markdown
15. **AMRAP day designation** enables marking days as AMRAP (As Many Rounds As Possible) workouts with duration specification in minutes
```

**Add Task:**

```markdown
- [ ] **AMRAP day designation support** (AC: 15)
  - [ ] Add `isAmrap` checkbox field to day configuration within embedded milestones
  - [ ] Add `amrapDuration` number field (1-120 minutes) with conditional visibility
  - [ ] Implement validation requiring duration when AMRAP is selected
  - [ ] Verify conditional field logic shows AMRAP fields only for workout days with AMRAP checked
  - [Source: course-corrections/amrap-feature-addition.md]
```

### 2. Programs Collection Schema Enhancement

**File:** `src/payload/collections/programs.ts` (when implemented)

**Add to days array fields after `dayType`:**

```typescript
{
  name: 'isAmrap',
  type: 'checkbox',
  label: 'AMRAP Day',
  defaultValue: false,
  admin: {
    description: 'Check if this is an AMRAP (As Many Rounds As Possible) day',
    condition: (_, siblingData) => siblingData?.dayType === 'workout',
  },
},
{
  name: 'amrapDuration',
  type: 'number',
  label: 'AMRAP Duration (minutes)',
  min: 1,
  max: 120,
  admin: {
    description: 'Duration for AMRAP workout in minutes (e.g., 12 for 12-minute AMRAP)',
    condition: (_, siblingData) => siblingData?.dayType === 'workout' && siblingData?.isAmrap,
  },
  validate: (value, { siblingData }) => {
    if (siblingData?.isAmrap && !value) {
      return 'AMRAP duration is required when AMRAP day is selected'
    }
    return true
  },
},
```

### 3. TypeScript Interface Update

**Update Program interface days structure:**

```typescript
days: {
  dayType: 'workout' | 'rest'
  isAmrap?: boolean // New field for AMRAP designation
  amrapDuration?: number // New field for AMRAP duration in minutes
  exercises?: {
    // existing exercise fields remain unchanged...
  }[]
  restNotes?: string
}[]
```

### 4. Future Epic 3 Enhancements

**Files to update when Epic 3 is developed:**

- **Story 3.1:** Add AMRAP day detection and specialized display format
- **Story 3.2:** Add round-based exercise presentation for AMRAP workouts
- **Story 3.3:** Add AMRAP-specific progress tracking (rounds completed vs individual sets)

## Architecture Review Needed

### Schema Design Validation

- [ ] **Field placement:** Confirm `isAmrap` and `amrapDuration` placement in days array
- [ ] **Validation logic:** Review conditional validation approach
- [ ] **Data types:** Validate field types and constraints (1-120 minutes reasonable?)
- [ ] **Index considerations:** Any performance implications for AMRAP field queries?

### PayloadCMS Integration

- [ ] **Conditional fields:** Confirm conditional visibility implementation pattern
- [ ] **Admin UI layout:** Review field grouping and visual presentation
- [ ] **Progressive validation:** Ensure AMRAP fields integrate with existing validation strategy
- [ ] **Migration path:** Consider approach for existing programs (default values)

## UX Review Needed

### Admin Interface Experience

- [ ] **Field positioning:** Optimal placement of AMRAP checkbox and duration field
- [ ] **Visual hierarchy:** How to present AMRAP designation clearly in admin interface
- [ ] **Field grouping:** Should AMRAP fields be visually grouped or inline?
- [ ] **Validation feedback:** User-friendly error messages for incomplete AMRAP configuration

### Future User Experience Considerations

- [ ] **AMRAP detection:** How to clearly indicate AMRAP days in workout interface
- [ ] **Progress display:** Round-based vs set-based progress indicators
- [ ] **Timer integration:** Consider AMRAP timer needs for user interface
- [ ] **Exercise flow:** How users navigate through AMRAP round completion

## PRD Updates Required

### New Functional Requirement (Suggested)

```markdown
**FR16:** The system shall support AMRAP (As Many Rounds As Possible) workout format designation with time duration specification for admin-created workout days.
```

### Epic 1 Requirements Update

```markdown
**FR3:** The system shall provide a PayloadCMS admin interface for creating and managing workout programs with embedded milestones, days, exercise references, and AMRAP day designation within a single Programs collection.
```

### Epic 3 Requirements Enhancement

Update existing functional requirements to include AMRAP-aware capabilities:

- **FR6:** Mobile-optimized workout interface with AMRAP day detection
- **FR7:** Workout completion tracking with AMRAP round-based progress

## Next Steps

### Immediate Actions

1. **Architecture Review:** Review schema changes and implementation approach
2. **UX Review:** Validate admin interface design and future user experience approach
3. **PRD Updates:** Implement approved functional requirement changes
4. **Story Documentation:** Update Story 1.3 with approved changes

### Implementation Sequence

1. **Story 1.3 Completion:** Implement AMRAP admin interface enhancements
2. **Data Population:** Test AMRAP functionality with real workout program data
3. **Epic 3 Preparation:** AMRAP-aware user experience components ready for development

### Success Criteria

- [ ] Admin can create AMRAP days with duration specification
- [ ] AMRAP fields show conditionally only for workout days
- [ ] Validation prevents publishing incomplete AMRAP configurations
- [ ] Existing functionality unaffected by AMRAP additions
- [ ] Future Epic 3 development can detect and handle AMRAP days appropriately

## Risk Assessment

**Risk Level:** LOW  
**Rationale:** Additive change with no breaking modifications to existing functionality

**Mitigation:**

- Comprehensive testing of existing functionality post-implementation
- Default values ensure backward compatibility
- Conditional fields prevent confusion in admin interface

---

**Course Correction Status:** Analysis Complete - Ready for Expert Review  
**Approval Status:** ✅ Product Owner Approved  
**Next Review:** Architecture & UX Expert Validation Required
