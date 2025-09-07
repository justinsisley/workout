# Unified Project Structure

```
workout-app/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── src/                        # Source code
│   ├── components/             # React components
│   │   ├── ui/                 # ShadCN base components
│   │   ├── auth/               # Authentication components
│   │   ├── workout/            # Workout-specific components
│   │   ├── program/            # Program management components
│   │   └── common/             # Shared components
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/         # Product user-facing pages (PayloadCMS convention)
│   │   │   ├── login/          # SMS authentication
│   │   │   ├── verify/         # OTP verification
│   │   │   ├── programs/       # Program selection
│   │   │   ├── workout/        # Workout execution
│   │   │   │   ├── dashboard/  # Workout overview
│   │   │   │   ├── session/    # Current session
│   │   │   │   └── exercise/   # Exercise detail
│   │   │   └── progress/       # Progress tracking
│   │   │       └── history/    # Workout history
│   │   ├── (payload)/          # PayloadCMS route group (PayloadCMS convention)
│   │   │   ├── admin/          # PayloadCMS admin UI
│   │   │   └── api/            # PayloadCMS API routes
│   │   ├── api/                # Custom API routes
│   │   │   └── health/         # Health check endpoint
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── payload/                # PayloadCMS configuration
│   │   ├── collections/        # PayloadCMS collection definitions
│   │   │   ├── users.ts        # PayloadCMS admin users
│   │   │   ├── product-users.ts # Product users (app users)
│   │   │   ├── programs.ts
│   │   │   ├── milestones.ts
│   │   │   ├── sessions.ts
│   │   │   ├── exercises.ts
│   │   │   └── exercise-completions.ts
│   │   ├── payload.config.ts   # PayloadCMS configuration
│   │   └── payload-client.ts   # PayloadCMS client setup
│   ├── actions/                # Server actions
│   │   ├── auth.ts             # Authentication actions
│   │   ├── programs.ts         # Program management
│   │   ├── workouts.ts         # Workout execution
│   │   └── exercises.ts        # Exercise management
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-workout.ts
│   │   └── use-program.ts
│   ├── stores/                 # Zustand state stores
│   │   ├── auth-store.ts
│   │   ├── workout-store.ts
│   │   └── program-store.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── workout.ts
│   │   ├── program.ts
│   │   └── common.ts
│   └── utils/                  # Utility functions
│       ├── validation.ts
│       ├── formatting.ts
│       └── constants.ts
├── public/                     # Static assets
│   ├── images/
│   └── icons/
├── tests/                      # Test files
│   ├── __mocks__/
│   ├── components/
│   ├── services/
│   ├── api/
│   └── e2e/
├── docs/                       # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example                # Environment template
├── .env.local                  # Local environment variables
├── .gitignore
├── middleware.ts               # Next.js middleware
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── railway.toml                # Railway configuration as code
└── README.md
```
