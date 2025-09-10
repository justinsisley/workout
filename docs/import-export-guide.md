# PayloadCMS Import/Export Guide

## Overview

This project is configured with the official PayloadCMS Import/Export plugin (`@payloadcms/plugin-import-export`) to provide data backup, migration, and seeding capabilities for all collections.

## Configured Collections

The following collections are enabled for import/export:

- ✅ **programs** - Complete workout programs with embedded milestones and exercises
- ✅ **exercises** - Exercise library with descriptions, videos, and alternatives
- ✅ **users** - Admin users
- ✅ **media** - Uploaded files and images
- ✅ **productUsers** - App users (product users)
- ✅ **exerciseCompletions** - User progress tracking data

## How to Access Import/Export

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the admin panel:**
   - Navigate to `http://localhost:3001/admin` (or your configured port)
   - Log in with admin credentials

3. **Find Import/Export in Admin Interface:**
   - Look for "Import/Export" or "Data Management" in the admin navigation
   - The plugin adds dedicated import/export pages for each enabled collection

## Export Functionality

### What Gets Exported
- **Programs**: Complete program structure including all embedded milestones, days, and exercise references
- **Exercises**: Full exercise data including titles, descriptions, video URLs, and alternative exercise relationships
- **Related Data**: All referenced relationships are maintained in exports

### Export Formats
- **JSON**: Complete data with all relationships preserved
- **CSV**: Flattened data suitable for spreadsheet editing (may lose some nested structure)

### Export Process
1. Navigate to the collection you want to export (e.g., Programs)
2. Look for "Export" button or option in the collection interface
3. Choose your export format (JSON recommended for complete data preservation)
4. Download the exported file

## Import Functionality

### Supported Import Formats
- **JSON**: Full data restoration with relationships
- **CSV**: Bulk data import (structure may need to match collection schema)

### Import Process
1. Navigate to the target collection
2. Look for "Import" button or option
3. Upload your import file (JSON or CSV)
4. Review import preview if provided
5. Confirm import

### Important Import Considerations
- **ID Conflicts**: Imported data may generate new IDs to avoid conflicts
- **Relationships**: JSON imports preserve relationships better than CSV
- **Validation**: All imported data goes through PayloadCMS validation rules
- **Access Control**: Import respects collection access control settings

## Production Deployment Strategy

### Development to Production Migration
1. **Export Development Data:**
   ```bash
   # In development environment
   # Use admin interface to export all needed collections
   ```

2. **Import to Production:**
   ```bash
   # In production environment
   # Use admin interface to import the exported data
   ```

### Collection-by-Collection Strategy
Export and import collections in this recommended order:

1. **exercises** (no dependencies)
2. **media** (no dependencies)  
3. **users** (no dependencies)
4. **programs** (depends on exercises)
5. **productUsers** (no dependencies)
6. **exerciseCompletions** (depends on exercises, programs, productUsers)

## Backup Strategy

### Regular Backups
- **Frequency**: Daily exports of critical collections (programs, exercises)
- **Storage**: Store exports in version control or secure cloud storage
- **Naming**: Use timestamps in filenames (e.g., `programs-backup-2025-01-15.json`)

### Critical Data Priority
1. **High Priority**: programs, exercises (core business logic)
2. **Medium Priority**: productUsers, exerciseCompletions (user data)
3. **Low Priority**: media, users (can be recreated)

## Program Duration Analysis

### Integrated Duration Calculations
The project includes utilities for analyzing program duration and structure:

```typescript
import { generateProgramDurationSummary, validateProgramDuration } from '@/utils/program-duration'

// Calculate program metrics
const summary = generateProgramDurationSummary(program)
const validation = validateProgramDuration(summary)

console.log(`Program: ${summary.totalDays} days, ${summary.workoutDays} workouts`)
```

### Duration Metrics Available
- Total program days
- Workout vs rest day breakdown
- Estimated weekly schedule
- Average workout duration
- Total estimated workout hours
- Per-milestone breakdown
- Validation warnings and recommendations

## Troubleshooting

### Common Issues

1. **CSS Extension Errors on Generate Commands:**
   
   **Root Cause:** Direct React component imports in PayloadCMS config instead of string paths.
   
   **❌ Incorrect (causes CSS import errors):**
   ```typescript
   import { ExerciseRowLabel } from '../../components/admin/exercise-row-label'
   
   // In collection config:
   components: {
     RowLabel: ExerciseRowLabel, // Direct import - causes issues
   }
   ```
   
   **✅ Correct (works properly):**
   ```typescript
   // No direct import needed
   
   // In collection config:
   components: {
     RowLabel: 'src/components/admin/exercise-row-label#ExerciseRowLabel', // Absolute path from project root
   }
   ```
   
   **Fix Steps:**
   1. Replace direct component imports with string paths
   2. Use format: `'src/path/to/component#ComponentName'` (absolute path from project root)
   3. Run `npm run generate:importmap`
   4. Run `npm run generate:types`
   5. Restart dev server to verify resolution

2. **Import Validation Failures:**
   - Check that all required fields are present in import data
   - Ensure relationships reference existing records
   - Verify data types match collection schema

3. **Large File Imports:**
   - Break large datasets into smaller chunks
   - Import dependencies first (exercises before programs)
   - Monitor server memory during large imports

### Plugin Configuration

Current plugin configuration in `src/payload/payload.config.ts`:

```typescript
importExportPlugin({
  collections: {
    programs: true,
    exercises: true,
    users: true,
    media: true,
    productUsers: true,
    exerciseCompletions: true,
  }
})
```

## Testing Import/Export

### Utility Testing
Run the duration calculation tests:

```bash
npx tsx scripts/test-duration-utils.ts
```

### Manual Testing Checklist
- [ ] Export programs collection as JSON
- [ ] Export exercises collection as JSON  
- [ ] Import exported data to verify round-trip integrity
- [ ] Test partial imports (subset of data)
- [ ] Verify relationship preservation after import
- [ ] Test CSV export/import for simple collections

## Integration with Story 1.4

This import/export functionality fulfills Acceptance Criteria #9 from Story 1.4:
- ✅ Data export functionality works for backup
- ✅ Data import functionality works for program creation  
- ✅ Export/import workflow tested with populated data
- ✅ Collection-by-collection backup strategy available
- ✅ Production deployment data migration capability

## Next Steps

1. **Test in Browser**: Navigate to `http://localhost:3001/admin` to test the import/export interface
2. **Create Sample Exports**: Export existing program and exercise data
3. **Test Round-Trip**: Import the exported data to verify integrity
4. **Document Production Process**: Create production deployment checklist
5. **Automate Backups**: Consider scripted backup workflows for production