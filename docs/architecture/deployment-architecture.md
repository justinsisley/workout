# Deployment Architecture

## Deployment Strategy

**Unified Deployment:**

- **Platform:** Railway
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Database:** Railway MongoDB (co-located)
- **Deployment Method:** Long-running server with automatic scaling
- **Configuration Management:** Railway Config as Code with `railway.toml`

**Railway Configuration as Code:**
Railway supports infrastructure as code through configuration files, allowing deployment settings to be version-controlled alongside the application code. This approach provides several benefits:

- **Version Control:** All deployment configuration is tracked in Git
- **Environment Consistency:** Same configuration across development, staging, and production
- **Automated Deployments:** Configuration changes trigger automatic deployments
- **Team Collaboration:** Configuration changes are reviewed through pull requests
- **Rollback Capability:** Easy rollback to previous configuration versions

**Configuration File Structure:**

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "on_failure"

[environments.production]
variables = { NODE_ENV = "production" }

[environments.staging]
variables = { NODE_ENV = "staging" }
```

**Benefits for Personal Workout App:**

- **Simplified Management:** Single file controls all deployment settings
- **Cost Optimization:** Configuration ensures optimal resource allocation
- **Reliability:** Consistent deployment configuration reduces deployment failures
- **Scalability:** Easy adjustment of scaling parameters as usage grows

## CI/CD Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URI: mongodb://localhost:27017/workout-app-test
          PAYLOAD_SECRET: test-payload-secret
          JWT_SECRET: test-jwt-secret

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URI: mongodb://localhost:27017/workout-app-e2e
          PAYLOAD_SECRET: test-payload-secret
          JWT_SECRET: test-jwt-secret
```

## Environments

| Environment | Application URL                               | Database        | Purpose                |
| ----------- | --------------------------------------------- | --------------- | ---------------------- |
| Development | http://localhost:3000                         | Local MongoDB   | Local development      |
| Staging     | https://workout-app-staging.up.railway.app    | Railway MongoDB | Pre-production testing |
| Production  | https://workout-app-production.up.railway.app | Railway MongoDB | Live environment       |
