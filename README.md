# Personal Workout App

A mobile-first workout tracking application built with Next.js, PayloadCMS, and MongoDB. Designed for gym use with one-handed operation and seamless video integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

> **Note**: Docker is required for local MongoDB development. The `npm run dev` command will automatically start MongoDB using Docker Compose.

### macOS Setup (Recommended)

For the best development experience on macOS, we recommend using Homebrew to manage your development tools:

1. **Install Homebrew** (if not already installed)

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install nvm for Node.js version management**

   ```bash
   brew install nvm
   ```

   Then add nvm to your shell profile:

   ```bash
   echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
   echo '[ -s "/opt/homebrew/share/nvm/nvm.sh" ] && \. "/opt/homebrew/share/nvm/nvm.sh"' >> ~/.zshrc
   echo '[ -s "/opt/homebrew/share/nvm/bash_completion" ] && \. "/opt/homebrew/share/nvm/bash_completion"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Install and use Node.js 20**

   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20
   ```

4. **Install OrbStack (Docker alternative)**

   ```bash
   brew install orbstack
   ```

   OrbStack provides a faster, more efficient Docker experience on macOS compared to Docker Desktop.

5. **Verify your setup**
   ```bash
   node --version  # Should show v20.x.x
   npm --version   # Should show 10.x.x
   docker --version # Should show Docker version
   ```

### Alternative Setup

If you prefer Docker Desktop over OrbStack:

- [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Troubleshooting

**Docker not found error:**

```bash
sh: docker-compose: command not found
npm run db:up exited with code 127
```

- Make sure Docker (OrbStack or Docker Desktop) is installed and running
- For OrbStack: Open the OrbStack app and ensure it's running
- For Docker Desktop: Start Docker Desktop from Applications
- Verify Docker is working: `docker --version` and `docker-compose --version`

**Node.js version issues:**

- Use `nvm list` to see installed Node.js versions
- Use `nvm use 20` to switch to Node.js 20
- Use `nvm alias default 20` to set Node.js 20 as default

**Permission issues with Homebrew:**

- Run `sudo chown -R $(whoami) /opt/homebrew` if you get permission errors
- For Intel Macs, use `/usr/local` instead of `/opt/homebrew`

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd workout-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development (MongoDB + Next.js)**

   ```bash
   npm run dev
   ```

   This single command will:
   - Start MongoDB using Docker Compose
   - Start the Next.js development server
   - Handle cleanup when you stop the process (Ctrl+C)

5. **Access the application**
   - Frontend: http://localhost:3000
   - PayloadCMS Admin: http://localhost:3000/admin

## 📋 Available Scripts

### Development

- `npm run dev` - Start MongoDB + Next.js development server (recommended)
- `npm run dev:next` - Start only Next.js development server
- `npm run devsafe` - Clean build cache and start development

### Database Management

- `npm run db:up` - Start MongoDB with Docker Compose
- `npm run db:down` - Stop MongoDB
- `npm run db:clean` - Reset database (removes all data)

### Utilities

- `npm run clean` - Clean build cache and stop database
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🛠️ Development

- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run all tests
- `npm run test:int` - Run integration tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Dependency Management

- `npm run update-deps:check` - Check available updates (grouped by type)
- `npm run update-deps` - Interactive dependency updates
- `npm run update-deps:patch` - Interactive patch updates only
- `npm run update-deps:minor` - Interactive minor updates only
- `npm run update-deps:major` - Interactive major updates only

### Project Structure

```
workout-app/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # ShadCN base components
│   │   ├── auth/           # Authentication components
│   │   ├── workout/        # Workout-specific components
│   │   ├── program/        # Program management components
│   │   └── common/         # Shared components
│   ├── app/                # Next.js App Router
│   │   ├── (frontend)/     # Product user-facing pages (PayloadCMS convention)
│   │   └── (payload)/      # PayloadCMS route group (PayloadCMS convention)
│   ├── payload/            # PayloadCMS configuration
│   │   ├── collections/    # PayloadCMS collection definitions
│   │   ├── payload.config.ts
│   │   └── payload-types.ts
│   ├── actions/            # Server actions
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── tests/                  # Test files
├── docs/                   # Documentation
└── .env.example            # Environment template
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend
DATABASE_URI=mongodb://localhost:27017/workout-app
JWT_SECRET=your-super-secret-jwt-key
PAYLOAD_SECRET=your-payload-secret-key

# WebAuthN Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Personal Workout App

# Shared
NODE_ENV=development
```

### Database Setup

The application uses MongoDB with Docker Compose for local development:

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down
```

## 📦 Dependency Management

The project uses **npm-check-updates (ncu)** for systematic dependency management with clear grouping by update type.

### Available Commands

- **`npm run update-deps:check`** - View available updates grouped by type (patch, minor, major)
- **`npm run update-deps`** - Interactive updates for all dependencies
- **`npm run update-deps:patch`** - Interactive patch updates only (safest)
- **`npm run update-deps:minor`** - Interactive minor updates only (usually safe)
- **`npm run update-deps:major`** - Interactive major updates only (requires testing)

### Update Strategy

- **Patch Updates**: Backwards-compatible bug fixes - safe to apply automatically
- **Minor Updates**: Backwards-compatible features - usually safe, test after applying
- **Major Updates**: Potentially breaking changes - requires thorough testing

### Workflow

1. **Check Updates**: `npm run update-deps:check` to see what's available
2. **Select Updates**: Use interactive mode to choose specific packages
3. **Test Changes**: Run tests after applying updates
4. **Commit Changes**: Use conventional commit format for dependency updates

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:int

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: `tests/components/` - Component testing
- **Integration Tests**: `tests/int/` - API and business logic testing
- **E2E Tests**: `tests/e2e/` - End-to-end user flow testing

## 🚀 Deployment

### Railway Deployment

The application is configured for deployment on Railway:

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment-Specific Configuration

- **Development**: Local MongoDB, development environment variables
- **Staging**: Railway MongoDB, staging environment variables
- **Production**: Railway MongoDB, production environment variables

## 📱 Mobile-First Design

The application is optimized for mobile gym use:

- **One-handed operation** during workouts
- **Large touch targets** for easy interaction
- **Offline capability** for gym environments
- **Video integration** with YouTube for exercise demonstrations
- **Real-time progress tracking** with immediate feedback

## 🔐 Authentication

- **Admin Users**: Email/password authentication via PayloadCMS
- **Product Users**: Passkey-based authentication via WebAuthN
- **JWT Tokens**: Secure session management
- **Rate Limiting**: Protection against abuse

## 📊 Features

### Admin Interface (PayloadCMS)

- Program creation and management
- Exercise library management
- User progress monitoring
- Content publishing controls

### Product User Interface

- Passkey-based authentication
- Program selection and assignment
- Workout session execution
- Progress tracking and history
- Video-guided exercises

## 🛡️ Code Quality

### Pre-commit Hooks (Lefthook)

- ESLint code linting
- Prettier code formatting
- TypeScript type checking
- Integration test validation

### Code Standards

- **File Naming**: kebab-case (non-negotiable)
- **TypeScript**: Strict type checking enabled
- **Error Handling**: Comprehensive error handling with Zod validation
- **State Management**: Zustand for global state
- **Testing**: Comprehensive test coverage with Vitest and Playwright

## 📚 Documentation

- [Architecture Document](docs/architecture.md) - Complete system architecture
- [Product Requirements](docs/prd.md) - Product requirements and specifications
- [Frontend Specification](docs/front-end-spec.md) - Frontend implementation details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Commit your changes
6. Push to your fork
7. Create a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please refer to the documentation or create an issue in the repository.
