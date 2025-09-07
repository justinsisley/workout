# Scripts Directory

This directory contains utility scripts for the workout app.

## Available Scripts

### Bootstrap Exercises

**File:** `bootstrap-exercises.ts`

**Purpose:** Populates the exercises collection with data from the master exercise list CSV file.

**Usage:**

```bash
npm run bootstrap:exercises
```

**What it does:**

- Reads the `master_exercise_list.csv` file
- Parses exercise names, descriptions, and video URLs
- Creates new exercise records in the database as drafts (not published)
- Skips exercises that already exist to avoid duplicates
- Provides progress feedback and error handling

**Requirements:**

- Database must be running (`npm run db:up`)
- CSV file must be present in this directory
- Environment variables are automatically set by the npm script

**Output:**

- Creates exercise records with title, description, and video URL
- Sets `isPublished: false` so exercises can be reviewed before publishing
- Logs progress and any errors encountered

**CSV Format:**

The CSV file should have the following columns:

- `Exercise`: The name of the exercise
- `Description`: Detailed description of how to perform the exercise
- `VideoURL`: YouTube URL for exercise demonstration

## Files

- `master_exercise_list.csv` - Source data for exercises
- `bootstrap-exercises.ts` - Script to populate exercises collection
- `README.md` - This documentation file
