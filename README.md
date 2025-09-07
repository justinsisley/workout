# Personal Workout App

A mobile-first workout tracking application built with Next.js, PayloadCMS, and MongoDB. Designed for gym use with one-handed operation and seamless video integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

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

4. **Start MongoDB with Docker**

   ```bash
   docker-compose up -d
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - PayloadCMS Admin: http://localhost:3000/admin

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run all tests
- `npm run test:int` - Run integration tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

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

# SMS Service (for future stories)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

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
- **Product Users**: SMS OTP authentication via Twilio
- **JWT Tokens**: Secure session management
- **Rate Limiting**: Protection against abuse

## 📊 Features

### Admin Interface (PayloadCMS)

- Program creation and management
- Exercise library management
- User progress monitoring
- Content publishing controls

### Product User Interface

- SMS-based authentication
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
