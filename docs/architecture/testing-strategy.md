# Testing Strategy

## Testing Pyramid

```
E2E Tests (Playwright)
/        \
Integration Tests (Vitest + PayloadCMS)
/            \
Frontend Unit (Vitest + Testing Library)  Backend Unit (Vitest + Server Actions)
```

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
