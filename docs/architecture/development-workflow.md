# Development Workflow

## Git Commit Standards

### CRITICAL: Never Bypass Pre-commit Hooks

**🚨 NEVER use `git commit --no-verify`** - Pre-commit hooks exist to maintain code quality and should never be bypassed.

**Why this matters:**

- Pre-commit hooks enforce linting, formatting, and type checking
- They catch issues before they enter the codebase
- Bypassing them defeats the purpose of having quality gates
- It can introduce broken code that fails CI/CD pipelines

**Instead of bypassing hooks:**

1. Fix the linting/formatting issues: `npm run format`
2. Fix type errors: `npm run type-check`
3. Ensure tests pass: `npm test`
4. Only then commit your changes

**If hooks are consistently failing:**

- Review and fix the underlying code quality issues
- Update hook configuration if genuinely needed (rare)
- Never bypass as a "quick fix"

### Commit Process

```bash
# 1. Check what you're committing
git status
git diff

# 2. Stage your changes
git add <files>

# 3. Ensure quality gates pass
npm run format      # Fix formatting
npm run lint        # Check linting
npm run type-check  # Verify types
npm test           # Run tests

# 4. Commit (hooks will run automatically)
git commit -m "your commit message"
```

## Local Development Setup

### Prerequisites

```bash
# Node.js 18+ and npm
node --version
npm --version

# Docker and Docker Compose
docker --version
docker-compose --version

# Git
git --version
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd workout-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up Railway configuration (optional for local development)
# railway.toml is already configured for deployment

# Start MongoDB with Docker
docker-compose up -d

# Start development server
npm run dev
```

### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:watch         # Watch mode for development

# Dependency management
npm run update-deps         # Interactive dependency updates
npm run update-deps:check   # Check available updates (grouped by type)
npm run update-deps:patch   # Interactive patch updates only
npm run update-deps:minor   # Interactive minor updates only
npm run update-deps:major   # Interactive major updates only
```

## Dependency Management

The project uses **npm-check-updates (ncu)** for systematic dependency management with clear grouping by update type.

### Configuration

The dependency update system is configured via `.ncurc.json`:

```json
{
  "format": ["group"],
  "target": "latest",
  "upgrade": false,
  "dep": "prod,dev,optional",
  "loglevel": "info"
}
```

### Available Commands

- **`npm run update-deps:check`** - View available updates grouped by type (patch, minor, major)
- **`npm run update-deps`** - Interactive updates for all dependencies
- **`npm run update-deps:patch`** - Interactive patch updates only (safest)
- **`npm run update-deps:minor`** - Interactive minor updates only (usually safe)
- **`npm run update-deps:major`** - Interactive major updates only (requires testing)

### Update Strategy

**Patch Updates**: Backwards-compatible bug fixes - safe to apply automatically
**Minor Updates**: Backwards-compatible features - usually safe, test after applying
**Major Updates**: Potentially breaking changes - requires thorough testing

### Workflow

1. **Check Updates**: `npm run update-deps:check` to see what's available
2. **Select Updates**: Use interactive mode to choose specific packages
3. **Test Changes**: Run tests after applying updates
4. **Commit Changes**: Use conventional commit format for dependency updates

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env)
DATABASE_URI=mongodb://localhost:27017/workout-app
JWT_SECRET=your-super-secret-jwt-key
PAYLOAD_SECRET=your-payload-secret-key

# WebAuthN Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Personal Workout App
WEBAUTHN_ORIGIN=http://localhost:3000

# Video Service (YouTube - No API keys required for embedding)
# YouTube video embedding requires no authentication

# Shared
NODE_ENV=development
```
