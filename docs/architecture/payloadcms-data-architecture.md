# PayloadCMS Data Architecture

## Collection Overview

The application uses **PayloadCMS Collections** as the primary data abstraction layer. PayloadCMS automatically handles:

- **Database Schema Generation:** Collections and fields automatically create the underlying MongoDB schema
- **API Generation:** REST and GraphQL APIs are automatically generated for each collection
- **Admin Interface:** Complete admin UI is automatically generated based on field definitions
- **Data Validation:** Field-level validation is automatically enforced
- **Relationships:** Relationship fields automatically handle foreign key constraints and queries

## Collection Relationships

The relationship-based ordering system is implemented through PayloadCMS relationship fields and junction collections:

**Core Collections:**

- `users` - PayloadCMS admin users with email/password authentication
- `productUsers` - Product users with WebAuthn passkey authentication
- `programs` - Complete workout programs with embedded milestones, days, and sessions
- `exercises` - Exercise definitions with videos and metadata
- `exerciseCompletions` - Product user workout completion tracking

**Removed Collections:**

- `milestones` - Now embedded within programs
- `sessions` - Now embedded within programs

## PayloadCMS Benefits

**Automatic Features:**

- Database indexes are automatically created based on field configurations
- Relationship queries are optimized automatically
- Admin interface provides drag-and-drop reordering for junction collections
- Data validation and constraints are enforced at the field level
- Local API provides direct database access with full type safety

**Developer Experience:**

- No need to manually define MongoDB schemas
- PayloadCMS Local API provides complete TypeScript type safety
- Server actions use PayloadCMS Local API for type-safe database operations
- Admin interface is automatically generated and customizable
- No need for REST/GraphQL APIs - Local API handles all data operations
