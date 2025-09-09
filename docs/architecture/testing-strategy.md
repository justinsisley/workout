# Testing Strategy

## Core Testing Philosophy

**Fundamental Principle**: We do not test well-established, comprehensively tested open-source frameworks.

### Framework Testing Policy

**We DO NOT test:**

- PayloadCMS collection configurations, admin UI, or CRUD operations
- Next.js routing, React component lifecycle, or framework internals
- Well-tested third-party library functionality

**We DO test:**

- Custom business logic and validation functions
- API endpoints and custom route handlers
- Custom React components and user interfaces
- Data transformation and business process logic
- Integration points between our code and external services
- End-to-end user journeys through custom features

**Rationale:**

- Framework configurations are strongly-typed and validated by TypeScript
- Framework teams maintain comprehensive test coverage
- Testing framework functionality provides zero business value
- Resources are better spent on business logic validation

## Testing Pyramid

```
E2E Tests (Playwright) - User Journeys
/        \
Integration Tests (Vitest) - Business Process Integration
/            \
Frontend Unit (Vitest + Testing Library)  Backend Unit (Vitest + Server Actions)
Custom Components & Business Logic        Custom Validation & API Logic
```

## Implementation Guidelines

### Trust the Framework Strategy

1. **TypeScript as Configuration Validation** - Leverage compile-time checks for framework configurations
2. **Focus on Integration Boundaries** - Test how our code integrates with frameworks, not framework internals
3. **User-Centric Testing** - Test what users experience through our custom implementations
4. **Business Value Prioritization** - Direct testing resources to unique business functionality

### PayloadCMS Specific Approach

- **Skip Collection Config Tests** - PayloadCMS collections are configuration objects with built-in validation
- **Test Custom Hooks/Transformations** - Any custom data processing or validation logic we add
- **Test API Integration Points** - How our server actions interact with PayloadCMS data
- **Test Custom Admin UI** - Any custom admin interface components we build

## Test Organization

### Frontend Tests

```
tests/
├── components/
│   ├── auth/
│   │   ├── login-form.test.tsx
│   │   └── passkey-authentication.test.tsx
│   ├── workout/
│   │   ├── exercise-card.test.tsx
│   │   └── workout-dashboard.test.tsx
│   └── program/
│       └── program-selection.test.tsx
├── hooks/
│   ├── use-auth.test.ts
│   └── use-workout.test.ts
└── utils/
    └── formatting.test.ts
```

### Backend Tests

```
tests/
├── actions/
│   ├── auth.test.ts
│   ├── programs.test.ts
│   └── workouts.test.ts
├── payload/
│   ├── collections.test.ts
│   └── payload-client.test.ts
└── utils/
    └── validation.test.ts
```

### E2E Tests

```
tests/
├── e2e/
│   ├── auth-flow.spec.ts
│   ├── workout-execution.spec.ts
│   └── program-selection.spec.ts
└── fixtures/
    └── test-data.json
```
