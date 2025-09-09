# Epic 1: Foundation & Core Infrastructure + Data Population

**Epic Goal:** Establish the complete technical foundation for the Personal Workout App, including PayloadCMS integration, data structure implementation, and population with the first complete workout program. This epic delivers a fully functional admin interface for program creation and management, along with realistic data that enables effective development of user-facing features in subsequent epics.

## Story 1.1: Project Setup and Development Environment

As a **developer**,
I want **a complete development environment with Next.js, PayloadCMS, MongoDB, and comprehensive development tooling**,
so that **I can begin building the workout app with all necessary tools, quality assurance, and infrastructure**.

### Acceptance Criteria

1. **Next.js application is initialized** with TypeScript, Tailwind CSS, and ShadCN components configured
2. **PayloadCMS is integrated** and running locally with MongoDB connection and TypeScript support
3. **Docker Compose setup** provides local MongoDB instance for development
4. **Git repository is initialized** with proper .gitignore and initial commit
5. **TypeScript configuration** is properly set up with strict type checking and path aliases
6. **Code quality tools are configured** including ESLint, Prettier, and/or Biome for consistent code formatting
7. **Testing framework is set up** with Vitest for unit/integration tests and Playwright for E2E testing
8. **Pre-commit hooks are configured** using Husky to run type checks, linting, and tests before commits
9. **Development scripts are configured** for easy local development startup, testing, and building
10. **Basic project structure** follows monorepo pattern with clear separation of concerns
11. **Environment variables** are properly configured for local development with type safety
12. **Health check endpoint** is available to verify all services are running
13. **CI/CD pipeline foundation** is established for automated testing and deployment (GitHub Actions or similar)
14. **Code coverage reporting** is configured to track test coverage across the project

## Story 1.2: PayloadCMS Collections and Embedded Data Structure

As a **developer**,
I want **all PayloadCMS collections defined with embedded program structure**,
so that **the data structure supports efficient admin workflows and eliminates context switching between collections**.

### Story 1.2 Acceptance Criteria

1. **Exercises collection** includes title, description, video URL, and alternatives (unchanged)
2. **Programs collection** includes embedded milestones, days, and exercise references in single document
3. **Milestones are embedded in programs** with name, theme, objective, and embedded days array
4. **Days are embedded in milestones** with dayType ('workout'|'rest') and embedded exercises array for workout days
5. **Exercises are referenced by ID** within embedded day structures with complete workout details (sets, reps, rest periods, weight, notes, optional time duration using durationValue + durationUnit fields, and optional distance using distanceValue + distanceUnit fields)
6. **Product users collection** includes username, current program, milestone, and day tracking
7. **Exercise completions collection** includes user, exercise, program, milestone index, and day index
8. **All relationships are properly configured** between collections
9. **Collection validation rules** ensure data integrity with progressive validation
10. **Admin interface supports single-page editing** of complete program structure

## Story 1.3: Admin Interface and Program Creation

As an **admin user**,
I want **a functional PayloadCMS admin interface with embedded program editing**,
so that **I can create and manage complete workout programs from a single interface without context switching**.

### Story 1.3 Acceptance Criteria

1. **Admin authentication** works with PayloadCMS built-in user system
2. **Single-page program creation** allows creating complete programs with embedded milestones, days, and exercises
3. **Exercise library management** enables adding, editing, and organizing exercises
4. **Embedded milestone editing** allows defining themes, objectives within the program interface
5. **Embedded day management** enables creating workout and rest days with exercises directly in the program
6. **Embedded exercise configuration** allows adding exercises with sets, reps, rest periods, weight, and notes within days
7. **Time duration input with unit selector** enables intuitive specification of time-based exercise durations using paired durationValue (numeric) and durationUnit (seconds/minutes/hours) fields with conditional validation requiring both fields together
8. **Distance input with unit selector** enables intuitive specification of distance-based exercise distances using paired distanceValue (numeric) and distanceUnit (meters/miles) fields with conditional validation requiring both fields together
9. **Conditional field visibility** shows exercises array only for workout days and rest notes only for rest days
10. **Progressive validation** allows saving incomplete programs as drafts while preventing publishing incomplete content
11. **Drag-and-drop ordering** enables reordering milestones, days, and exercises within the program interface
12. **Collapsible sections** manage complexity with expandable/collapsible milestone and day sections
13. **Admin interface is responsive** and works on desktop for program creation
14. **All CRUD operations** work correctly for all collection types

## Story 1.4: Complete Program Data Population

As a **developer**,
I want **the first complete workout program populated with real data using the embedded structure**,
so that **I have realistic data for testing and development of user-facing features**.

### Story 1.4 Acceptance Criteria

1. **Exercise library is populated** with at least 20 diverse exercises covering various movement patterns
2. **Complete embedded program structure** is created with realistic milestones, days, and exercises
3. **All workout days include exercises** with appropriate sets, reps, rest periods, weight, and notes
4. **Embedded program hierarchy is validated** - all embedded relationships work correctly from program to individual exercises
5. **Realistic program content** reflects actual workout programming principles
6. **Video URLs are included** for exercise demonstrations (can be placeholder URLs initially)
7. **Alternative exercises are defined** for key exercises where substitutions make sense
8. **Program duration estimates** are realistic and based on actual embedded session content
9. **Data export/import** functionality works for backup and future program creation
10. **Admin can view complete embedded program** structure and make modifications as needed
11. **Embedded structure performance** is validated with realistic program sizes
12. **Single-page editing workflow** is tested with the populated program data
