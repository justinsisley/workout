# Admin UI Specifications: Embedded Schema

## Overview

This document outlines the admin interface specifications for the new embedded schema architecture. The goal is to provide an intuitive, efficient editing experience for managing complete workout programs within a single interface. The simplified structure eliminates the session concept, moving exercises directly into days for a cleaner, more straightforward editing experience.

## Design Principles

### 1. Progressive Disclosure

- **Collapsible Sections:** Use collapsible sections to manage visual complexity
- **Contextual Visibility:** Show relevant fields based on selections (e.g., workout vs. rest days)
- **Smart Defaults:** Pre-populate fields with sensible defaults

### 2. Visual Hierarchy

- **Clear Nesting:** Visual indicators show the relationship between milestones, days, and exercises
- **Consistent Styling:** Maintain consistent styling across all nested levels
- **Intuitive Icons:** Use meaningful icons to represent different entity types

### 3. Efficient Workflow

- **Single-Page Editing:** All program structure editable from one page
- **Drag-and-Drop:** Reorder milestones, days, and exercises with drag-and-drop
- **Bulk Actions:** Quick actions for common operations

## Interface Layout

### Main Program Edit Page

```
┌─────────────────────────────────────────────────────────────┐
│ Program: [Beginner Strength Program]                    [Save] │
├─────────────────────────────────────────────────────────────┤
│ Basic Information                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Name: [Beginner Strength Program________________]       │ │
│ │ Description: [A comprehensive program...]               │ │
│ │ Objective: [Build foundational strength...]             │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Program Milestones                                    [+ Add] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▼ Milestone 1: Foundation Building              [Edit] │ │
│ │   Theme: [Strength Building________________]            │ │
│ │   Objective: [Build basic strength...]                 │ │
│ │   Days: 3 days                                        │ │
│ │   ┌─────────────────────────────────────────────────┐ │ │
│ │   │ ▼ Day 1: Workout Day                    [Edit] │ │ │
│ │   │   Exercises: 4 exercises                       │ │ │
│ │   │   ┌─────────────────────────────────────────┐ │ │ │
│ │   │   │ ▼ Exercise 1: Push-ups          [Edit] │ │ │ │
│ │   │   │   Sets: [3] Reps: [10]                 │ │ │ │
│ │   │   │   Rest: [60s] Weight: [0lbs]           │ │ │ │
│ │   │   │   Notes: [Keep core tight...]          │ │ │ │
│ │   │   └─────────────────────────────────────────┘ │ │ │
│ │   │   ┌─────────────────────────────────────────┐ │ │ │
│ │   │   │ ▼ Exercise 2: Squats            [Edit] │ │ │ │
│ │   │   │   Sets: [3] Reps: [12]                 │ │ │ │
│ │   │   │   Rest: [60s] Weight: [0lbs]           │ │ │ │
│ │   │   │   Notes: [Full depth required...]      │ │ │ │
│ │   │   └─────────────────────────────────────────┘ │ │ │
│ │   │   ┌─────────────────────────────────────────┐ │ │ │
│ │   │   │ ▼ Exercise 3: Pull-ups          [Edit] │ │ │ │
│ │   │   │   Sets: [3] Reps: [8]                  │ │ │ │
│ │   │   │   Rest: [90s] Weight: [0lbs]           │ │ │ │
│ │   │   │   Notes: [Assisted if needed...]       │ │ │ │
│ │   │   └─────────────────────────────────────────┘ │ │ │
│ │   │   ┌─────────────────────────────────────────┐ │ │ │
│ │   │   │ ▼ Exercise 4: Planks            [Edit] │ │ │ │
│ │   │   │   Sets: [3] Reps: [1] Duration: [30s]   │ │ │ │
│ │   │   │   Rest: [60s] Weight: [0lbs]           │ │ │ │
│ │   │   │   Notes: [Hold straight line...]       │ │ │ │
│ │   │   └─────────────────────────────────────────┘ │ │ │
│ │   └─────────────────────────────────────────────────┘ │ │
│ │   ┌─────────────────────────────────────────────────┐ │ │
│ │   │ ▼ Day 2: Rest Day                      [Edit] │ │ │
│ │   │   Rest Notes: [Active recovery...]             │ │ │
│ │   └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▼ Milestone 2: Progressive Building            [Edit] │ │
│ │   Theme: [Advanced Strength________________]            │ │
│ │   Objective: [Increase intensity...]                   │ │
│ │   Days: 4 days                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Field Specifications

### Program Level Fields

**Basic Information Section:**

- **Name:** Text input with placeholder "e.g., Beginner Strength Program"
- **Description:** Textarea with placeholder for program description
- **Objective:** Text input with placeholder for program objective
- **Published:** Checkbox in sidebar with warning about required fields

### Milestone Level Fields

**Milestone Header:**

- **Collapse/Expand:** Chevron icon to toggle visibility
- **Name:** Text input with placeholder "e.g., Foundation Building"
- **Theme:** Text input with placeholder "e.g., Strength Building"
- **Objective:** Textarea with placeholder for milestone objective
- **Actions:** Edit, Delete, Duplicate buttons

**Visual Indicators:**

- **Day Count:** Badge showing number of days in milestone
- **Completion Status:** Visual indicator for publishing readiness

### Day Level Fields

**Day Header:**

- **Day Type:** Select dropdown (Workout/Rest)
- **Day Number:** Auto-generated based on position
- **Actions:** Edit, Delete, Duplicate buttons

**Conditional Fields:**

- **Workout Days:** Show exercises array
- **Rest Days:** Show rest notes textarea

### Exercise Level Fields

**Exercise Row:**

- **Exercise:** Relationship field to exercises collection
- **Sets:** Number input (min: 1)
- **Reps:** Number input (min: 1)
- **Rest Period:** Number input with "seconds" label
- **Weight:** Number input with "lbs" label (optional)
- **Duration Value:** Number input (1-999) paired with unit selector (optional, for time-based exercises)
- **Duration Unit:** Select dropdown (seconds/minutes/hours) paired with value field
- **Notes:** Textarea for additional instructions
- **Actions:** Delete, Duplicate buttons

## Interaction Patterns

### 1. Collapsible Sections

**Implementation:**

```typescript
// Milestone level - initCollapsed: false
{
  name: 'milestones',
  type: 'array',
  admin: {
    initCollapsed: false, // Milestones always visible
  }
}

// Day level - initCollapsed: true
{
  name: 'days',
  type: 'array',
  admin: {
    initCollapsed: true, // Days collapsed by default
  }
}

// Exercise level - initCollapsed: true
{
  name: 'exercises',
  type: 'array',
  admin: {
    initCollapsed: true, // Exercises collapsed by default
  }
}
```

### 2. Conditional Field Visibility

**Day Type Conditional:**

```typescript
{
  name: 'exercises',
  type: 'array',
  admin: {
    condition: (_, siblingData) => siblingData?.dayType === 'workout',
    description: 'Add exercises for this workout day. Only visible for workout days.',
  }
}

{
  name: 'restNotes',
  type: 'textarea',
  admin: {
    condition: (_, siblingData) => siblingData?.dayType === 'rest',
    description: 'Optional notes for rest days. Only visible for rest days.',
  }
}
```

### 3. Drag-and-Drop Ordering

**Implementation:**

- All array fields support drag-and-drop reordering
- Visual feedback during drag operations
- Auto-save after reordering

### 4. Progressive Validation

**Visual Indicators:**

- **Required Field Indicators:** Red asterisk (\*) for required fields
- **Publishing Warnings:** Yellow warning icons for incomplete sections
- **Completion Status:** Green checkmarks for completed sections

## Time Duration Field Implementation

### Dual-Field Duration Specifications

**Admin Interface Requirements:**

- Duration fields appear as paired value+unit inputs in exercise configuration
- Visual grouping indicates the two fields work together as one logical unit
- Both fields optional, but if one is set, the other becomes required
- Contextual validation provides clear feedback for incomplete specifications
- Semantic storage preserves user's original intent (no conversion to seconds)

**Dual Field Design:**

- **Duration Value:** Number input (1-999) with placeholder "e.g., 30, 5, 1"
- **Duration Unit:** Select dropdown with options: Seconds, Minutes, Hours
- **Visual Grouping:** Container styling groups fields as single logical unit
- **Validation:** Both fields required together with contextual error messages
- **Storage:** Preserves semantic meaning (durationValue: 1, durationUnit: 'hours')

**Visual Integration:**

```
Exercise Configuration Row:
[Exercise Dropdown] [Sets: 3] [Reps: 10] [Rest: 60s] [Weight: 0lbs] │ Duration: [30] [Seconds ▼] │ [Notes...]
```

## User Experience Enhancements

### 1. Smart Defaults

**New Milestone:**

- Default name: "New Milestone"
- Default theme: "General"
- Default objective: ""

**New Day:**

- Default type: "workout"
- Auto-increment day number

**New Exercise:**

- Default sets: 3
- Default reps: 10
- Default rest period: 60 seconds
- Default weight: 0
- Default duration: 0 (hidden unless time-based exercise)

### 2. Bulk Actions

**Milestone Level:**

- **Duplicate Milestone:** Copy entire milestone with all days and exercises
- **Add Multiple Days:** Quick add 3, 5, or 7 days
- **Clear All:** Remove all days from milestone

**Day Level:**

- **Duplicate Day:** Copy day with all exercises
- **Convert to Rest:** Change workout day to rest day
- **Convert to Workout:** Change rest day to workout day

**Exercise Level:**

- **Duplicate Exercise:** Copy exercise with same parameters
- **Bulk Edit:** Edit sets/reps for multiple exercises

### 3. Quick Actions

**Keyboard Shortcuts:**

- **Ctrl/Cmd + D:** Duplicate selected item
- **Ctrl/Cmd + N:** Add new item at current level
- **Ctrl/Cmd + S:** Save program
- **Ctrl/Cmd + P:** Toggle publish status

**Context Menus:**

- Right-click on any item for quick actions
- Copy, paste, delete, duplicate options

### 4. Visual Feedback

**Loading States:**

- Skeleton loaders for large programs
- Progress indicators for save operations
- Success/error notifications

**Status Indicators:**

- **Draft:** Gray badge
- **Published:** Green badge
- **Incomplete:** Yellow warning badge
- **Error:** Red error badge

## Performance Considerations

### 1. Lazy Loading

**Implementation:**

- Load program structure progressively
- Load exercise details on demand
- Cache frequently accessed data

### 2. Optimistic Updates

**Implementation:**

- Update UI immediately on user actions
- Sync with server in background
- Handle conflicts gracefully

### 3. Debounced Saving

**Implementation:**

- Auto-save after 2 seconds of inactivity
- Manual save button for immediate saves
- Visual indicator for unsaved changes

## Accessibility

### 1. Keyboard Navigation

**Tab Order:**

- Logical tab order through all form fields
- Skip links for major sections
- Focus indicators for all interactive elements

### 2. Screen Reader Support

**ARIA Labels:**

- Descriptive labels for all form fields
- Status announcements for dynamic content
- Proper heading hierarchy

### 3. Visual Accessibility

**Color Contrast:**

- WCAG AA compliant color contrast
- Not relying solely on color for information
- High contrast mode support

## Mobile Responsiveness

### 1. Responsive Layout

**Breakpoints:**

- **Desktop:** Full nested layout
- **Tablet:** Collapsed sections with expand/collapse
- **Mobile:** Single-column layout with accordion-style navigation

### 2. Touch Interactions

**Mobile Optimizations:**

- Larger touch targets (44px minimum)
- Swipe gestures for navigation
- Pull-to-refresh for data updates

## Testing Strategy

### 1. Functional Testing

**Test Cases:**

- Create new program with multiple milestones
- Edit existing program structure
- Reorder milestones, days, and exercises
- Publish/unpublish programs
- Handle validation errors

### 2. Performance Testing

**Metrics:**

- Page load time < 3 seconds
- Save operation < 1 second
- Smooth drag-and-drop interactions
- Memory usage optimization

### 3. User Acceptance Testing

**Scenarios:**

- Admin user creates complete program
- Admin user edits existing program
- Admin user publishes program
- Product user accesses published program

## Implementation Timeline

### Phase 1: Core Functionality (Week 1)

- Basic nested form structure
- Collapsible sections
- Conditional field visibility
- Basic validation

### Phase 2: Enhanced UX (Week 2)

- Drag-and-drop ordering
- Bulk actions
- Smart defaults
- Visual feedback

### Phase 3: Polish and Optimization (Week 3)

- Performance optimization
- Accessibility improvements
- Mobile responsiveness
- Comprehensive testing

## Success Metrics

**User Experience:**

- Time to create new program < 10 minutes
- Time to edit existing program < 5 minutes
- User satisfaction score > 4.5/5
- Support requests related to program management < 5/month

**Technical Performance:**

- Page load time < 3 seconds
- Save operation < 1 second
- Zero data loss incidents
- 99.9% uptime during editing

## Conclusion

This admin UI specification provides a comprehensive guide for implementing an intuitive, efficient interface for managing embedded program structures. The design prioritizes user experience while maintaining the flexibility and power needed for complex program management.

The nested, collapsible interface will significantly improve the admin workflow by eliminating the need to navigate between multiple collections, while the progressive disclosure pattern keeps the interface manageable even for complex programs with many milestones and exercises.
