# Development Workflow

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

# SMS Service
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Video Service (YouTube - No API keys required for embedding)
# YouTube video embedding requires no authentication

# Shared
NODE_ENV=development
```
