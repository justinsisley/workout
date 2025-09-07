# Components

## Frontend Components

**Responsibility:** Mobile-optimized product user interface for workout execution and program management.

**Key Interfaces:**

- SMS Authentication flow with OTP verification
- Program selection and assignment interface
- Workout dashboard with session overview
- Exercise detail screen with video integration
- Progress tracking and completion interface

**Dependencies:** Next.js, Tailwind CSS, ShadCN components, Zustand for state management

**Technology Stack:** TypeScript, React 19+, Next.js 15.5+, Tailwind CSS 4.1+

## Backend Components

**Responsibility:** Data management, authentication, and business logic through PayloadCMS and server actions.

**Key Interfaces:**

- PayloadCMS admin interface for program creation
- Server actions for data mutations and business logic
- SMS OTP authentication service integration
- Data validation and business logic enforcement

**Dependencies:** PayloadCMS, MongoDB, Twilio SMS service, Next.js server actions

**Technology Stack:** TypeScript, PayloadCMS 3.53+, MongoDB 7.0+, Twilio SDK, Next.js server actions

## Data Layer Components

**Responsibility:** Data persistence, relationships, and query optimization.

**Key Interfaces:**

- MongoDB collections for all data models
- PayloadCMS collection definitions and relationships
- Data validation and constraint enforcement
- Query optimization for mobile performance

**Dependencies:** Railway MongoDB, PayloadCMS collections, data validation schemas

**Technology Stack:** MongoDB 7.0+, PayloadCMS 3.53+ collections, PayloadCMS SDK

## Authentication Components

**Responsibility:** Product user authentication and session management.

**Key Interfaces:**

- SMS OTP generation and verification
- JWT token management
- Product user session persistence
- Rate limiting and security enforcement

**Dependencies:** Twilio SMS service, JWT library, rate limiting middleware

**Technology Stack:** Twilio SDK, jsonwebtoken, rate limiting middleware

## Video Integration Components

**Responsibility:** Exercise video delivery and playback optimization using YouTube.

**Key Interfaces:**

- YouTube video embedding and playback
- Mobile-optimized video player
- Video ID extraction from YouTube URLs
- Fallback handling for video failures

**Dependencies:** YouTube iframe API, responsive video player, video URL parsing

**Technology Stack:** YouTube iframe API, React YouTube component, responsive video player
