#!/bin/bash

# =============================================================================
# DATABASE SETUP SCRIPT FOR STUDENT COURSE ENROLLMENT SYSTEM
# =============================================================================
# This script sets up the database with proper trigger management

set -e  # Exit on any error

echo "🚀 Starting database setup..."

# Database connection parameters
DB_HOST="${DB_HOST:-/tmp}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-scm_new}"
DB_USERNAME="${DB_USERNAME:-$(whoami)}"

# Function to run SQL file
run_sql_file() {
    local file=$1
    echo "📄 Executing $file..."
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_DATABASE" -U "$DB_USERNAME" -f "$file"
}

# Function to run SQL command
run_sql_command() {
    local command=$1
    echo "⚡ Executing: $command"
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_DATABASE" -U "$DB_USERNAME" -c "$command"
}

echo "🔍 Checking database connection..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_DATABASE" -U "$DB_USERNAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database. Please check your connection parameters."
    echo "Host: $DB_HOST, Port: $DB_PORT, Database: $DB_DATABASE, User: $DB_USERNAME"
    exit 1
fi

echo "✅ Database connection successful!"

echo "🔧 Setting up database schema..."

# Step 1: Drop triggers if they exist (to avoid conflicts)
echo "🗑️  Dropping existing triggers (if any)..."
run_sql_command "SELECT drop_all_custom_triggers();" 2>/dev/null || echo "No existing triggers to drop"

# Step 2: Run the main database schema
run_sql_file "database_schema.sql"

echo "✅ Database schema setup complete!"

echo "🎯 Creating custom triggers..."
run_sql_command "SELECT create_all_custom_triggers();"

echo "🔍 Verifying trigger installation..."
run_sql_command "
SELECT 
    schemaname,
    tablename,
    triggername
FROM pg_triggers 
WHERE schemaname = 'public' 
AND triggername LIKE '%prevent_%' 
OR triggername LIKE '%enforce_%' 
OR triggername LIKE '%protect_%'
ORDER BY tablename, triggername;
"

echo "✅ All triggers installed successfully!"

echo "📊 Database setup summary:"
run_sql_command "
SELECT 
    'Tables' as type, 
    count(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Triggers' as type, 
    count(*) as count 
FROM pg_triggers 
WHERE schemaname = 'public' 
AND (triggername LIKE '%prevent_%' OR triggername LIKE '%enforce_%' OR triggername LIKE '%protect_%');
"

echo "🎉 Database setup completed successfully!"
echo "🚀 You can now start your NestJS application."
