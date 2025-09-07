# Technical Assumptions

## Repository Structure: Single Repository

The project will use a **single repository** with a unified Next.js application that includes PayloadCMS integrated directly into the app. This approach provides:

- **Maximum simplicity** - one codebase, one deployment, one set of dependencies
- **Unified development** - frontend and backend code in the same project
- **Simpler deployment** - single application deployment to Vercel or similar
- **Easier maintenance** - no need to manage multiple repositories or complex build processes
- **Perfect for single developer** - minimal complexity and overhead

## Service Architecture

**Unified Next.js Application with Integrated PayloadCMS:** The architecture will be a **single Next.js application** with PayloadCMS integrated as a plugin or embedded CMS. This approach provides:

- **Single application** - Next.js handles both frontend and backend functionality
- **PayloadCMS integration** - CMS functionality embedded within the Next.js app
- **Unified data management** - all data operations through PayloadCMS collections
- **Simplified deployment** - one application to build, test, and deploy
- **Shared types and utilities** - everything in one codebase with shared TypeScript types

The architecture will include:

- Next.js application with integrated PayloadCMS
- PayloadCMS collections for data management
- Next.js API routes for custom business logic (SMS authentication, progression logic)
- MongoDB for data storage
- Single deployment pipeline

## Testing Requirements

**Unit + Integration Testing:** The project will implement **unit testing for business logic** and **integration testing for API endpoints and data persistence**. Given the personal project scope and single developer constraint, the focus will be on:

- **Unit tests** for progression logic, regression rules, and data validation
- **Integration tests** for PayloadCMS collections and API endpoints
- **Manual testing** for mobile UI and user workflows
- **No E2E testing** initially due to complexity and maintenance overhead

Testing will prioritize critical business logic (progression algorithms) and data integrity over comprehensive UI testing, allowing for rapid iteration and validation of core functionality.

## Additional Technical Assumptions and Requests

- **Frontend Framework:** Next.js with Tailwind CSS and ShadCN components for consistent, mobile-optimized UI
- **Database:** MongoDB with Docker Compose for local development, MongoDB Atlas for future cloud deployment
- **Authentication:** SMS OTP service (Twilio, AWS SNS, or similar) with phone number as user identifier
- **Video Hosting:** External video hosting service for exercise demonstrations (YouTube, Vimeo, or dedicated hosting)
- **Deployment:** Local development first, with future cloud deployment on Vercel, Netlify, or similar
- **Development Environment:** Docker Compose for MongoDB, local PayloadCMS development
- **Data Structure:** Flexible document structure supporting Programs → Milestones → Days → Sessions hierarchy
- **Mobile Optimization:** Progressive Web App (PWA) capabilities for mobile gym use
- **Cost Constraints:** Aim to stay within free/low-cost service limits for SMS, hosting, and video services
- **Single Developer:** Architecture must be maintainable by one person with existing technical skills
- **Future Extensibility:** Design for potential AI integration and advanced analytics without over-engineering
