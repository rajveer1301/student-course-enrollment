-- Student Course Enrollment Database Schema
-- This SQL script creates the complete database structure for the student-course enrollment system
-- Compatible with PostgreSQL

-- Create database (uncomment if creating a new database)
-- CREATE DATABASE student_course_enrollment;
-- \c student_course_enrollment;

-- Enable UUID extension for better unique ID generation (optional, since we use custom nanoid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- DROP TABLES (in reverse dependency order) - for clean recreation
-- =============================================================================

DROP TABLE IF EXISTS student_course_mapping CASCADE;
DROP TABLE IF EXISTS course_timetables CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS course_timetable_days CASCADE;

-- =============================================================================
-- CREATE CUSTOM TYPES
-- =============================================================================

-- Enum for course timetable days
CREATE TYPE course_timetable_days AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
);

-- =============================================================================
-- CREATE TABLES
-- =============================================================================

-- 1. Colleges Table (Base table - no dependencies)
CREATE TABLE colleges (
    unique_id VARCHAR(25) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 2. Students Table (depends on colleges)
CREATE TABLE students (
    unique_id VARCHAR(25) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college_id VARCHAR(25) NOT NULL
);

-- 3. Courses Table (depends on colleges)
CREATE TABLE courses (
    unique_id VARCHAR(25) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(255) NOT NULL,
    college_id VARCHAR(25) NOT NULL
);

-- 4. Course Timetables Table (depends on courses)
CREATE TABLE course_timetables (
    unique_id VARCHAR(25) PRIMARY KEY,
    day course_timetable_days NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id VARCHAR(25) NOT NULL
);

-- 5. Student Course Mapping Table (depends on students and courses)
CREATE TABLE student_course_mapping (
    unique_id VARCHAR(25) PRIMARY KEY,
    student_id VARCHAR(25) NOT NULL,
    course_id VARCHAR(25) NOT NULL
);

-- =============================================================================
-- CREATE FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Students foreign key to colleges
ALTER TABLE students 
ADD CONSTRAINT fk_students_college_id 
FOREIGN KEY (college_id) REFERENCES colleges(unique_id) ON DELETE CASCADE;

-- Courses foreign key to colleges
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_college_id 
FOREIGN KEY (college_id) REFERENCES colleges(unique_id) ON DELETE CASCADE;

-- Course timetables foreign key to courses
ALTER TABLE course_timetables 
ADD CONSTRAINT fk_course_timetables_course_id 
FOREIGN KEY (course_id) REFERENCES courses(unique_id) ON DELETE CASCADE;

-- Student course mapping foreign keys
ALTER TABLE student_course_mapping 
ADD CONSTRAINT fk_student_course_mapping_student_id 
FOREIGN KEY (student_id) REFERENCES students(unique_id) ON DELETE CASCADE;

ALTER TABLE student_course_mapping 
ADD CONSTRAINT fk_student_course_mapping_course_id 
FOREIGN KEY (course_id) REFERENCES courses(unique_id) ON DELETE CASCADE;

-- =============================================================================
-- CREATE UNIQUE CONSTRAINTS
-- =============================================================================

-- Unique constraint for course name and college combination
ALTER TABLE courses 
ADD CONSTRAINT name_college_unique_check 
UNIQUE (name, college_id);

-- Unique constraint for course timetable (no overlapping times for same course)
ALTER TABLE course_timetables 
ADD CONSTRAINT day_start_end_time_course_unique 
UNIQUE (course_id, start_time, end_time, day);

-- Unique constraint for student-course mapping (prevent duplicate enrollments)
ALTER TABLE student_course_mapping 
ADD CONSTRAINT student_course_unique_contraint 
UNIQUE (student_id, course_id);

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Primary key indexes are created automatically, but creating explicit indexes for better performance

-- Colleges indexes
CREATE INDEX idx_colleges_unique_id ON colleges(unique_id);
CREATE INDEX idx_colleges_name ON colleges(name);

-- Students indexes
CREATE INDEX idx_students_unique_id ON students(unique_id);
CREATE INDEX idx_students_college_id ON students(college_id);
CREATE INDEX idx_students_name ON students(name);

-- Courses indexes
CREATE INDEX idx_courses_unique_id ON courses(unique_id);
CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_courses_college_id ON courses(college_id);
CREATE INDEX idx_courses_name ON courses(name);

-- Course timetables indexes
CREATE INDEX idx_course_timetables_unique_id ON course_timetables(unique_id);
CREATE INDEX idx_course_timetables_course_id ON course_timetables(course_id);
CREATE INDEX idx_course_timetables_day ON course_timetables(day);
CREATE INDEX idx_course_timetables_start_time ON course_timetables(start_time);
CREATE INDEX idx_course_timetables_end_time ON course_timetables(end_time);

-- Student course mapping indexes
CREATE INDEX idx_student_course_mapping_unique_id ON student_course_mapping(unique_id);
CREATE INDEX idx_student_course_mapping_student_id ON student_course_mapping(student_id);
CREATE INDEX idx_student_course_mapping_course_id ON student_course_mapping(course_id);

-- =============================================================================
-- COMPLETE DATABASE TRIGGERS FOR STUDENT COURSE ENROLLMENT SYSTEM
-- =============================================================================
-- Description: All database triggers required for the Student Course Enrollment System
-- 
-- This section contains all triggers needed to meet the backend assignment requirements:
-- 1. Course Timetable Overlap Prevention
-- 2. Student Course Enrollment Conflict Prevention 
-- 3. College Constraint Enforcement
-- 4. Timetable Update Protection for Enrolled Students
-- =============================================================================

-- =============================================================================
-- INDEXES FOR OPTIMAL TRIGGER PERFORMANCE
-- =============================================================================

-- Index for course timetable overlap checks
DROP INDEX IF EXISTS idx_course_timetables_overlap_check;
CREATE INDEX idx_course_timetables_overlap_check 
ON course_timetables (course_id, day, start_time, end_time);

-- Index for student enrollment conflict checks
DROP INDEX IF EXISTS idx_student_course_conflict_check;
CREATE INDEX idx_student_course_conflict_check 
ON student_course_mapping (student_id);

-- Index for course timetables conflict lookup
DROP INDEX IF EXISTS idx_course_timetables_conflict_lookup;
CREATE INDEX idx_course_timetables_conflict_lookup
ON course_timetables (course_id, day);

-- Index for college constraint checks
DROP INDEX IF EXISTS idx_student_college_lookup;
CREATE INDEX idx_student_college_lookup ON students (unique_id, college_id);

DROP INDEX IF EXISTS idx_course_college_lookup;
CREATE INDEX idx_course_college_lookup ON courses (unique_id, college_id);

-- =============================================================================
-- TRIGGER 1: COURSE TIMETABLE OVERLAP PREVENTION
-- =============================================================================

-- Function to check for time overlap between course timetables
CREATE OR REPLACE FUNCTION check_course_timetable_overlap_optimized()
RETURNS TRIGGER AS $$
DECLARE
    conflicting_record RECORD;
BEGIN
    -- Early validation: check if start_time < end_time
    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Start time (%) must be before end time (%)', 
            NEW.start_time, NEW.end_time
            USING ERRCODE = 'P0001', 
                  HINT = 'Please ensure start time is earlier than end time';
    END IF;
    
    -- Optimized overlap check using a single query with LIMIT for early exit
    SELECT ct.start_time, ct.end_time, ct.unique_id
    INTO conflicting_record
    FROM course_timetables ct
    WHERE ct.course_id = NEW.course_id
      AND ct.day = NEW.day
      AND ct.unique_id != COALESCE(NEW.unique_id, '')  -- Exclude self for updates
      AND ct.start_time < NEW.end_time  -- Overlap condition part 1
      AND NEW.start_time < ct.end_time  -- Overlap condition part 2
    LIMIT 1;  -- Exit early if any overlap is found
    
    -- If we found a conflicting record, raise an exception
    IF FOUND THEN
        RAISE EXCEPTION 'TIMETABLE_CONFLICT: Course % already has a conflicting timetable on % from % to %. Your requested time % to % overlaps with this schedule.', 
            NEW.course_id,
            NEW.day,
            conflicting_record.start_time,
            conflicting_record.end_time,
            NEW.start_time,
            NEW.end_time
            USING ERRCODE = 'P0001',
                  HINT = 'Please choose a different time slot that does not overlap with existing schedules';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_insert ON course_timetables;
DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_update ON course_timetables;
DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_insert_optimized ON course_timetables;
DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_update_optimized ON course_timetables;
DROP TRIGGER IF EXISTS trigger_validate_course_timetable ON course_timetables;

-- Create optimized triggers for course timetable overlap
CREATE TRIGGER prevent_course_timetable_overlap_insert_optimized
    BEFORE INSERT ON course_timetables
    FOR EACH ROW
    EXECUTE FUNCTION check_course_timetable_overlap_optimized();

CREATE TRIGGER prevent_course_timetable_overlap_update_optimized
    BEFORE UPDATE ON course_timetables
    FOR EACH ROW
    WHEN (
        -- Only run trigger if relevant fields are being changed
        OLD.course_id IS DISTINCT FROM NEW.course_id OR
        OLD.day IS DISTINCT FROM NEW.day OR
        OLD.start_time IS DISTINCT FROM NEW.start_time OR
        OLD.end_time IS DISTINCT FROM NEW.end_time
    )
    EXECUTE FUNCTION check_course_timetable_overlap_optimized();

-- =============================================================================
-- TRIGGER 2: STUDENT COURSE ENROLLMENT CONFLICT PREVENTION
-- =============================================================================

-- Function to prevent student enrollment conflicts across different courses
CREATE OR REPLACE FUNCTION check_student_course_timetable_conflict()
RETURNS TRIGGER AS $$
DECLARE
    conflicting_course RECORD;
    new_course_timetables RECORD;
BEGIN
    -- Get all timetables for the new course being enrolled
    FOR new_course_timetables IN 
        SELECT day, start_time, end_time, course_id
        FROM course_timetables 
        WHERE course_id = NEW.course_id
    LOOP
        -- Check if student is already enrolled in courses with conflicting timetables
        SELECT 
            c.name as course_name,
            c.course_code,
            ct.day,
            ct.start_time,
            ct.end_time
        INTO conflicting_course
        FROM student_course_mapping scm
        JOIN courses c ON c.unique_id = scm.course_id
        JOIN course_timetables ct ON ct.course_id = scm.course_id
        WHERE scm.student_id = NEW.student_id
          AND scm.unique_id != COALESCE(NEW.unique_id, '')  -- Exclude self for updates
          AND ct.day = new_course_timetables.day
          AND ct.start_time < new_course_timetables.end_time
          AND new_course_timetables.start_time < ct.end_time
        LIMIT 1;
        
        -- If conflict found, raise exception
        IF FOUND THEN
            RAISE EXCEPTION 'ENROLLMENT_CONFLICT: Student cannot enroll in this course due to timetable conflict. Already enrolled in course % (%) on % from % to %, which conflicts with the new course schedule % to %.',
                conflicting_course.course_name,
                conflicting_course.course_code,
                conflicting_course.day,
                conflicting_course.start_time,
                conflicting_course.end_time,
                new_course_timetables.start_time,
                new_course_timetables.end_time
                USING ERRCODE = 'P0001',
                      HINT = 'Please drop the conflicting course or choose a different course with non-overlapping schedule';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS prevent_student_enrollment_conflict_insert ON student_course_mapping;
DROP TRIGGER IF EXISTS prevent_student_enrollment_conflict_update ON student_course_mapping;
DROP TRIGGER IF EXISTS trigger_validate_student_enrollment ON student_course_mapping;

-- Create triggers for student course enrollment conflict prevention
CREATE TRIGGER prevent_student_enrollment_conflict_insert
    BEFORE INSERT ON student_course_mapping
    FOR EACH ROW
    EXECUTE FUNCTION check_student_course_timetable_conflict();

CREATE TRIGGER prevent_student_enrollment_conflict_update
    BEFORE UPDATE ON student_course_mapping
    FOR EACH ROW
    WHEN (OLD.course_id IS DISTINCT FROM NEW.course_id OR OLD.student_id IS DISTINCT FROM NEW.student_id)
    EXECUTE FUNCTION check_student_course_timetable_conflict();

-- =============================================================================
-- TRIGGER 3: COLLEGE CONSTRAINT ENFORCEMENT
-- =============================================================================

-- Function to enforce college constraints (students can only enroll in courses from their college)
CREATE OR REPLACE FUNCTION check_student_course_college_constraint()
RETURNS TRIGGER AS $$
DECLARE
    student_college_id VARCHAR;
    course_college_id VARCHAR;
    student_name VARCHAR;
    course_name VARCHAR;
    college_name VARCHAR;
BEGIN
    -- Get student's college
    SELECT s.college_id, s.name
    INTO student_college_id, student_name
    FROM students s
    WHERE s.unique_id = NEW.student_id;
    
    -- Get course's college  
    SELECT c.college_id, c.name
    INTO course_college_id, course_name
    FROM courses c
    WHERE c.unique_id = NEW.course_id;
    
    -- Check if both student and course exist
    IF student_college_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_STUDENT: Student with ID % does not exist', NEW.student_id
            USING ERRCODE = 'P0001';
    END IF;
    
    IF course_college_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_COURSE: Course with ID % does not exist', NEW.course_id
            USING ERRCODE = 'P0001';
    END IF;
    
    -- Check if student and course belong to the same college
    IF student_college_id != course_college_id THEN
        -- Get college names for better error message
        SELECT name INTO college_name FROM colleges WHERE unique_id = student_college_id;
        
        RAISE EXCEPTION 'COLLEGE_CONSTRAINT: Student % from college % cannot enroll in course % from a different college. Students can only enroll in courses offered by their own college.',
            student_name,
            college_name,
            course_name
            USING ERRCODE = 'P0001',
                  HINT = 'Please select a course offered by your college or contact administration';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS enforce_student_course_college_constraint ON student_course_mapping;
DROP TRIGGER IF EXISTS enforce_student_course_college_constraint_update ON student_course_mapping;

-- Create triggers for college constraint enforcement
CREATE TRIGGER enforce_student_course_college_constraint
    BEFORE INSERT ON student_course_mapping
    FOR EACH ROW
    EXECUTE FUNCTION check_student_course_college_constraint();

CREATE TRIGGER enforce_student_course_college_constraint_update
    BEFORE UPDATE ON student_course_mapping
    FOR EACH ROW
    WHEN (OLD.student_id IS DISTINCT FROM NEW.student_id OR OLD.course_id IS DISTINCT FROM NEW.course_id)
    EXECUTE FUNCTION check_student_course_college_constraint();

-- =============================================================================
-- TRIGGER 4: TIMETABLE UPDATE PROTECTION FOR ENROLLED STUDENTS
-- =============================================================================

-- Function to protect enrolled students from timetable conflicts when course schedules change
CREATE OR REPLACE FUNCTION protect_enrolled_students_from_timetable_changes()
RETURNS TRIGGER AS $$
DECLARE
    affected_student RECORD;
    conflicting_course RECORD;
BEGIN
    -- Only check if timing fields are being changed
    IF (OLD.day IS DISTINCT FROM NEW.day OR 
        OLD.start_time IS DISTINCT FROM NEW.start_time OR 
        OLD.end_time IS DISTINCT FROM NEW.end_time) THEN
        
        -- Find students enrolled in this course who might be affected
        FOR affected_student IN
            SELECT DISTINCT 
                s.unique_id as student_id,
                s.name as student_name
            FROM students s
            JOIN student_course_mapping scm ON scm.student_id = s.unique_id
            WHERE scm.course_id = NEW.course_id
        LOOP
            -- Check if this student has conflicts with the new timetable
            SELECT 
                c.name as course_name,
                c.course_code,
                ct.day,
                ct.start_time,
                ct.end_time
            INTO conflicting_course
            FROM student_course_mapping scm2
            JOIN courses c ON c.unique_id = scm2.course_id
            JOIN course_timetables ct ON ct.course_id = scm2.course_id
            WHERE scm2.student_id = affected_student.student_id
              AND scm2.course_id != NEW.course_id  -- Different course
              AND ct.day = NEW.day
              AND ct.start_time < NEW.end_time
              AND NEW.start_time < ct.end_time
            LIMIT 1;
            
            -- If conflict found, prevent the timetable update
            IF FOUND THEN
                RAISE EXCEPTION 'TIMETABLE_UPDATE_BLOCKED: Cannot update timetable because student % (%) would have a conflict. Student is enrolled in course % (%) on % from % to %, which would conflict with the new schedule % to %.',
                    affected_student.student_name,
                    affected_student.student_id,
                    conflicting_course.course_name,
                    conflicting_course.course_code,
                    conflicting_course.day,
                    conflicting_course.start_time,
                    conflicting_course.end_time,
                    NEW.start_time,
                    NEW.end_time
                    USING ERRCODE = 'P0001',
                          HINT = 'Remove conflicting enrollments first or choose a different time slot';
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS protect_enrolled_students_timetable_update ON course_timetables;

-- Create trigger for timetable update protection
CREATE TRIGGER protect_enrolled_students_timetable_update
    BEFORE UPDATE ON course_timetables
    FOR EACH ROW
    EXECUTE FUNCTION protect_enrolled_students_from_timetable_changes();

-- =============================================================================
-- ADDITIONAL DATABASE CONSTRAINTS
-- =============================================================================

-- Add database constraint for time validation (supports the trigger)
ALTER TABLE course_timetables 
DROP CONSTRAINT IF EXISTS chk_valid_time_range;

ALTER TABLE course_timetables 
ADD CONSTRAINT chk_valid_time_range 
CHECK (start_time < end_time);

-- =============================================================================
-- AUDIT TRIGGERS (Optional - for tracking changes)
-- =============================================================================

-- Create audit table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_id VARCHAR(25) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100) DEFAULT current_user,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.unique_id, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.unique_id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, record_id, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.unique_id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all tables (uncomment if you want audit logging)
/*
CREATE TRIGGER audit_colleges AFTER INSERT OR UPDATE OR DELETE ON colleges FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_courses AFTER INSERT OR UPDATE OR DELETE ON courses FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_course_timetables AFTER INSERT OR UPDATE OR DELETE ON course_timetables FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_student_course_mapping AFTER INSERT OR UPDATE OR DELETE ON student_course_mapping FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
*/

-- =============================================================================
-- TRIGGER DOCUMENTATION AND COMMENTS
-- =============================================================================

COMMENT ON FUNCTION check_course_timetable_overlap_optimized() IS 
'OPTIMIZED: Prevents overlapping timetables for the same course on the same day.
Features: Single query with LIMIT, early exit strategy, structured error codes.';

COMMENT ON FUNCTION check_student_course_timetable_conflict() IS 
'Prevents students from enrolling in courses with conflicting timetables across different courses.
Checks all time slots for the new course against all existing enrollments.';

COMMENT ON FUNCTION check_student_course_college_constraint() IS 
'Enforces college constraints: students can only enroll in courses from their own college.
Validates both student and course existence before checking college association.';

COMMENT ON FUNCTION protect_enrolled_students_from_timetable_changes() IS 
'Protects enrolled students from timetable conflicts when course schedules are updated.
Prevents admin changes that would create conflicts for existing enrollments.';

-- Update table statistics for better query planning
ANALYZE course_timetables;
ANALYZE student_course_mapping;
ANALYZE students;
ANALYZE courses;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Create composite indexes for common query patterns
CREATE INDEX idx_students_college_name ON students(college_id, name);
CREATE INDEX idx_courses_college_code ON courses(college_id, course_code);
CREATE INDEX idx_course_timetables_course_day ON course_timetables(course_id, day);
CREATE INDEX idx_student_course_mapping_composite ON student_course_mapping(student_id, course_id);

-- =============================================================================
-- SAMPLE DATA (Optional - uncomment to insert test data)
-- =============================================================================

/*
-- Insert sample colleges
INSERT INTO colleges (unique_id, name) VALUES 
('college1234567890abcdefgh', 'Engineering College'),
('college2234567890abcdefgh', 'Medical College'),
('college3234567890abcdefgh', 'Arts College');

-- Insert sample courses
INSERT INTO courses (unique_id, name, course_code, college_id) VALUES 
('course1234567890abcdefgh1', 'Computer Science', 'CS101', 'college1234567890abcdefgh'),
('course1234567890abcdefgh2', 'Mathematics', 'MATH101', 'college1234567890abcdefgh'),
('course1234567890abcdefgh3', 'Physics', 'PHY101', 'college1234567890abcdefgh');

-- Insert sample students
INSERT INTO students (unique_id, name, college_id) VALUES 
('student123456789abcdefgh1', 'John Doe', 'college1234567890abcdefgh'),
('student123456789abcdefgh2', 'Jane Smith', 'college1234567890abcdefgh'),
('student123456789abcdefgh3', 'Bob Johnson', 'college1234567890abcdefgh');

-- Insert sample course timetables
INSERT INTO course_timetables (unique_id, day, start_time, end_time, course_id) VALUES 
('timetable123456789abcdefg1', 'Monday', '09:00:00', '10:30:00', 'course1234567890abcdefgh1'),
('timetable123456789abcdefg2', 'Tuesday', '11:00:00', '12:30:00', 'course1234567890abcdefgh2'),
('timetable123456789abcdefg3', 'Wednesday', '14:00:00', '15:30:00', 'course1234567890abcdefgh3');

-- Insert sample student course mappings
INSERT INTO student_course_mapping (unique_id, student_id, course_id) VALUES 
('mapping123456789abcdefgh1', 'student123456789abcdefgh1', 'course1234567890abcdefgh1'),
('mapping123456789abcdefgh2', 'student123456789abcdefgh1', 'course1234567890abcdefgh2'),
('mapping123456789abcdefgh3', 'student123456789abcdefgh2', 'course1234567890abcdefgh1');
*/

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE colleges IS 'Stores college/institution information';
COMMENT ON TABLE students IS 'Stores student information with college association';
COMMENT ON TABLE courses IS 'Stores course information with college association';
COMMENT ON TABLE course_timetables IS 'Stores course schedule/timetable information';
COMMENT ON TABLE student_course_mapping IS 'Maps students to their enrolled courses';

COMMENT ON COLUMN colleges.unique_id IS 'Primary key - 25 character unique identifier';
COMMENT ON COLUMN colleges.name IS 'Name of the college/institution';

COMMENT ON COLUMN students.unique_id IS 'Primary key - 25 character unique identifier';
COMMENT ON COLUMN students.name IS 'Full name of the student';
COMMENT ON COLUMN students.college_id IS 'Foreign key reference to colleges table';

COMMENT ON COLUMN courses.unique_id IS 'Primary key - 25 character unique identifier';
COMMENT ON COLUMN courses.name IS 'Name of the course';
COMMENT ON COLUMN courses.course_code IS 'Unique course code identifier';
COMMENT ON COLUMN courses.college_id IS 'Foreign key reference to colleges table';

COMMENT ON COLUMN course_timetables.unique_id IS 'Primary key - 25 character unique identifier';
COMMENT ON COLUMN course_timetables.day IS 'Day of the week for the course';
COMMENT ON COLUMN course_timetables.start_time IS 'Start time of the course';
COMMENT ON COLUMN course_timetables.end_time IS 'End time of the course';
COMMENT ON COLUMN course_timetables.course_id IS 'Foreign key reference to courses table';

COMMENT ON COLUMN student_course_mapping.unique_id IS 'Primary key - 25 character unique identifier';
COMMENT ON COLUMN student_course_mapping.student_id IS 'Foreign key reference to students table';
COMMENT ON COLUMN student_course_mapping.course_id IS 'Foreign key reference to courses table';

-- =============================================================================
-- GRANT PERMISSIONS (Adjust as needed for your environment)
-- =============================================================================

-- Grant permissions to application user (replace 'app_user' with your actual username)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'Database schema created successfully!' as message;
SELECT 'Tables created: ' || count(*) as tables_created 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- =============================================================================
-- TRIGGER MANAGEMENT FUNCTIONS FOR TYPEORM COMPATIBILITY
-- =============================================================================

-- Function to temporarily drop all custom triggers
CREATE OR REPLACE FUNCTION drop_all_custom_triggers()
RETURNS void AS $$
BEGIN
    -- Drop all our custom triggers
    DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_insert_optimized ON course_timetables;
    DROP TRIGGER IF EXISTS prevent_course_timetable_overlap_update_optimized ON course_timetables;
    DROP TRIGGER IF EXISTS prevent_student_enrollment_conflict_insert ON student_course_mapping;
    DROP TRIGGER IF EXISTS prevent_student_enrollment_conflict_update ON student_course_mapping;
    DROP TRIGGER IF EXISTS enforce_student_course_college_constraint ON student_course_mapping;
    DROP TRIGGER IF EXISTS enforce_student_course_college_constraint_update ON student_course_mapping;
    DROP TRIGGER IF EXISTS protect_enrolled_students_timetable_update ON course_timetables;
    
    -- Drop old trigger names as well
    DROP TRIGGER IF EXISTS trigger_validate_course_timetable ON course_timetables;
    DROP TRIGGER IF EXISTS trigger_validate_student_enrollment ON student_course_mapping;
    
    RAISE NOTICE 'All custom triggers have been dropped for schema synchronization';
END;
$$ LANGUAGE plpgsql;

-- Function to recreate all custom triggers
CREATE OR REPLACE FUNCTION create_all_custom_triggers()
RETURNS void AS $$
BEGIN
    -- Recreate Course Timetable Overlap triggers
    CREATE TRIGGER prevent_course_timetable_overlap_insert_optimized
        BEFORE INSERT ON course_timetables
        FOR EACH ROW
        EXECUTE FUNCTION check_course_timetable_overlap_optimized();

    CREATE TRIGGER prevent_course_timetable_overlap_update_optimized
        BEFORE UPDATE ON course_timetables
        FOR EACH ROW
        WHEN (
            OLD.course_id IS DISTINCT FROM NEW.course_id OR
            OLD.day IS DISTINCT FROM NEW.day OR
            OLD.start_time IS DISTINCT FROM NEW.start_time OR
            OLD.end_time IS DISTINCT FROM NEW.end_time
        )
        EXECUTE FUNCTION check_course_timetable_overlap_optimized();

    -- Recreate Student Enrollment Conflict triggers
    CREATE TRIGGER prevent_student_enrollment_conflict_insert
        BEFORE INSERT ON student_course_mapping
        FOR EACH ROW
        EXECUTE FUNCTION check_student_course_timetable_conflict();

    CREATE TRIGGER prevent_student_enrollment_conflict_update
        BEFORE UPDATE ON student_course_mapping
        FOR EACH ROW
        WHEN (OLD.course_id IS DISTINCT FROM NEW.course_id OR OLD.student_id IS DISTINCT FROM NEW.student_id)
        EXECUTE FUNCTION check_student_course_timetable_conflict();

    -- Recreate College Constraint triggers
    CREATE TRIGGER enforce_student_course_college_constraint
        BEFORE INSERT ON student_course_mapping
        FOR EACH ROW
        EXECUTE FUNCTION check_student_course_college_constraint();

    CREATE TRIGGER enforce_student_course_college_constraint_update
        BEFORE UPDATE ON student_course_mapping
        FOR EACH ROW
        WHEN (OLD.student_id IS DISTINCT FROM NEW.student_id OR OLD.course_id IS DISTINCT FROM NEW.course_id)
        EXECUTE FUNCTION check_student_course_college_constraint();

    -- Recreate Timetable Update Protection trigger
    CREATE TRIGGER protect_enrolled_students_timetable_update
        BEFORE UPDATE ON course_timetables
        FOR EACH ROW
        EXECUTE FUNCTION protect_enrolled_students_from_timetable_changes();
    
    RAISE NOTICE 'All custom triggers have been recreated successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
