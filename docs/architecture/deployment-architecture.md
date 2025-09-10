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

## Production Data Migration Strategy

### Development to Production Migration

**Data Export from Development:**
```bash
# Access development admin panel
# Navigate to http://localhost:3001/admin
# Export collections in dependency order:
# 1. exercises (no dependencies)
# 2. media (no dependencies)  
# 3. users (no dependencies)
# 4. programs (depends on exercises)
# 5. productUsers (no dependencies)
# 6. exerciseCompletions (depends on exercises, programs, productUsers)
```

**Data Import to Production:**
```bash
# Access production admin panel
# Navigate to production admin URL
# Import collections in same dependency order
# Verify relationship integrity after import
```

### Backup Strategy Integration

**Automated Backup Workflow:**
```yaml
# .github/workflows/backup.yml
name: Production Data Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Export Critical Collections
        run: |
          # Use PayloadCMS admin API or CLI for automated exports
          # Store exports in secure cloud storage with timestamps
          # programs-backup-$(date +%Y-%m-%d).json
          # exercises-backup-$(date +%Y-%m-%d).json
```

**Collection Priority for Backups:**
1. **High Priority**: programs, exercises (core business logic)
2. **Medium Priority**: productUsers, exerciseCompletions (user data)  
3. **Low Priority**: media, users (can be recreated)

### Data Migration Testing

**Pre-Deployment Validation:**
```bash
# Test data migration process
npm run dev
# 1. Export development data via admin interface
# 2. Import to staging environment
# 3. Verify data integrity and relationships
# 4. Test application functionality with migrated data
# 5. Approve for production migration
```

## Environments

| Environment | Application URL                               | Database        | Purpose                | Data Migration Method |
| ----------- | --------------------------------------------- | --------------- | ---------------------- | -------------------- |
| Development | http://localhost:3000                         | Local MongoDB   | Local development      | Source for exports    |
| Staging     | https://workout-app-staging.up.railway.app    | Railway MongoDB | Pre-production testing | Import testing target |
| Production  | https://workout-app-production.up.railway.app | Railway MongoDB | Live environment       | Final import target   |
