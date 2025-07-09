# Database Setup and TypeORM Trigger Compatibility Fix

## Problem
TypeORM's `synchronize: true` feature conflicts with database triggers because PostgreSQL prevents altering columns that are referenced in trigger definitions.

## Solution
We've implemented a comprehensive solution that includes:

1. **Disabled TypeORM Synchronization**: Set `synchronize: false` to prevent automatic schema changes
2. **Trigger Management Functions**: Created functions to drop and recreate triggers safely
3. **Database Setup Scripts**: Automated scripts to handle the complete database setup

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
npm run db:setup
```

### Option 2: Manual Setup
```bash
# 1. Set up the database schema with triggers
psql -h /tmp -p 5432 -d scm_new -f database_schema.sql

# 2. Start your application
npm run start:dev
```

## Available Database Commands

```bash
# Complete database setup (schema + triggers)
npm run db:setup

# Reset database to clean state
npm run db:reset

# Manage triggers separately
npm run db:drop-triggers    # Drop all custom triggers
npm run db:create-triggers  # Create all custom triggers
```

## Database Triggers Included

1. **Course Timetable Overlap Prevention**
   - Prevents overlapping schedules for the same course
   - Optimized with early exit strategies

2. **Student Course Enrollment Conflict Prevention**
   - Prevents students from enrolling in courses with conflicting timetables
   - Checks across different courses

3. **College Constraint Enforcement**
   - Ensures students can only enroll in courses from their own college
   - Validates student and course existence

4. **Timetable Update Protection**
   - Protects enrolled students from schedule conflicts when timetables are updated
   - Prevents admin changes that would create conflicts

## Error Handling
All triggers include:
- Structured error codes (`P0001`)
- Detailed error messages with context
- Helpful hints for conflict resolution

## Development Workflow

1. Make sure your `.env` file has the correct database connection settings
2. Run `npm run db:setup` to initialize the database
3. Start your application with `npm run start:dev`

## Troubleshooting

### If you get "cannot alter type of a column used in a trigger definition":
```bash
# Drop triggers temporarily
npm run db:drop-triggers

# Start your application (which will run TypeORM sync)
npm run start:dev

# In another terminal, recreate triggers
npm run db:create-triggers
```

### To completely reset the database:
```bash
npm run db:reset
```

## Environment Variables Required

```env
DB_HOST=/tmp
DB_PORT=5432
DB_DATABASE=scm_new
DB_USERNAME=your_username  # Optional, defaults to current user
```

## Production Considerations

- In production, use proper migration scripts instead of synchronization
- Consider using connection pooling for better performance
- Monitor trigger performance with database profiling tools
- Set up proper backup strategies for trigger functions
