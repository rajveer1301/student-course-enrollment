-- =============================================================================
-- TYPEORM SYNCHRONIZATION FIX SCRIPT
-- =============================================================================
-- This script should be run BEFORE starting the NestJS application
-- It temporarily drops triggers to allow TypeORM synchronization and then recreates them

-- Step 1: Drop all custom triggers to allow TypeORM synchronization
SELECT drop_all_custom_triggers();

-- Step 2: This message indicates that triggers have been dropped
-- TypeORM can now safely synchronize the schema
SELECT 'Triggers dropped. TypeORM can now synchronize safely.' as status;

-- =============================================================================
-- POST-SYNCHRONIZATION SCRIPT (Run this after TypeORM sync completes)
-- =============================================================================

-- To recreate triggers after TypeORM synchronization, run:
-- SELECT create_all_custom_triggers();
