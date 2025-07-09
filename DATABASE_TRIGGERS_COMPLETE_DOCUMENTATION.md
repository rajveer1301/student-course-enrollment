# Complete Database Triggers Documentation
## Student Course Enrollment System

> **Purpose:** Complete reference for all database triggers implemented for the Student Course Enrollment System

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Trigger 1: Course Timetable Overlap Prevention](#trigger-1-course-timetable-overlap-prevention)
3. [Required Additional Triggers](#required-additional-triggers)
4. [Implementation Order](#implementation-order)
5. [Testing Scenarios](#testing-scenarios)
6. [Performance Considerations](#performance-considerations)

---

## 🎯 **Overview**

This document contains all the database triggers required for the Student Course Enrollment System based on the backend assignment requirements. These triggers ensure data integrity and prevent conflicts at the database level.

### **Assignment Requirements Covered:**
- ✅ Prevent students from selecting courses with clashing timetables
- ✅ Ensure students and courses are associated with the same college  
- ✅ Prevent timetable updates that would cause clashes for enrolled students
- ✅ Database-level constraints for data integrity

---

## 🚀 **Trigger 1: Course Timetable Overlap Prevention**

### **Purpose:**
Prevents overlapping timetables for the same course on the same day.

### **Current Status:** ✅ **IMPLEMENTED & OPTIMIZED**

### **Complete Implementation:**

```sql
-- =============================================================================
-- COURSE TIMETABLE OVERLAP PREVENTION TRIGGER (OPTIMIZED)
-- =============================================================================

-- Create optimized indexes for better trigger performance
DROP INDEX IF EXISTS idx_course_timetables_overlap_check;
CREATE INDEX idx_course_timetables_overlap_check 
ON course_timetables (course_id, day, start_time, end_time);

-- Optimized overlap detection function
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

-- Create optimized triggers
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

-- Add database constraint for better performance
ALTER TABLE course_timetables 
DROP CONSTRAINT IF EXISTS chk_valid_time_range;
ALTER TABLE course_timetables 
ADD CONSTRAINT chk_valid_time_range 
CHECK (start_time < end_time);
```

---

## 🔒 **Required Additional Triggers**

Based on the assignment requirements, here are the additional triggers needed:

### **Trigger 2: Student Course Enrollment Conflict Prevention**

### **Purpose:**
Prevents students from enrolling in courses with conflicting timetables across different courses.

### **Status:** ✅ **IMPLEMENTED & OPTIMIZED**

```sql
-- =============================================================================
-- STUDENT COURSE ENROLLMENT CONFLICT PREVENTION TRIGGER
-- =============================================================================

-- Create index for faster student enrollment conflict checks
CREATE INDEX idx_student_course_conflict_check 
ON student_course_mapping (student_id);

CREATE INDEX idx_course_timetables_conflict_lookup
ON course_timetables (course_id, day);

-- Function to prevent student enrollment conflicts
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

-- Create triggers for student course enrollment
CREATE TRIGGER prevent_student_enrollment_conflict_insert
    BEFORE INSERT ON student_course_mapping
    FOR EACH ROW
    EXECUTE FUNCTION check_student_course_timetable_conflict();

CREATE TRIGGER prevent_student_enrollment_conflict_update
    BEFORE UPDATE ON student_course_mapping
    FOR EACH ROW
    WHEN (OLD.course_id IS DISTINCT FROM NEW.course_id OR OLD.student_id IS DISTINCT FROM NEW.student_id)
    EXECUTE FUNCTION check_student_course_timetable_conflict();
```

### **Trigger 3: College Constraint Enforcement**

### **Purpose:**
Ensures students can only enroll in courses from their own college.

### **Status:** ✅ **IMPLEMENTED & OPTIMIZED**

```sql
-- =============================================================================
-- COLLEGE CONSTRAINT ENFORCEMENT TRIGGER
-- =============================================================================

-- Create index for faster college constraint checks
CREATE INDEX idx_student_college_lookup ON students (unique_id, college_id);
CREATE INDEX idx_course_college_lookup ON courses (unique_id, college_id);

-- Function to enforce college constraints
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

-- Create trigger for college constraint
CREATE TRIGGER enforce_student_course_college_constraint
    BEFORE INSERT ON student_course_mapping
    FOR EACH ROW
    EXECUTE FUNCTION check_student_course_college_constraint();

CREATE TRIGGER enforce_student_course_college_constraint_update
    BEFORE UPDATE ON student_course_mapping
    FOR EACH ROW
    WHEN (OLD.student_id IS DISTINCT FROM NEW.student_id OR OLD.course_id IS DISTINCT FROM NEW.course_id)
    EXECUTE FUNCTION check_student_course_college_constraint();
```

### **Trigger 4: Timetable Update Protection for Enrolled Students**

### **Purpose:**
Prevents timetable changes that would create conflicts for already enrolled students.

### **Status:** ✅ **IMPLEMENTED & OPTIMIZED**

```sql
-- =============================================================================
-- TIMETABLE UPDATE PROTECTION TRIGGER
-- =============================================================================

-- Function to protect enrolled students from timetable conflicts
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

-- Create trigger for timetable update protection
CREATE TRIGGER protect_enrolled_students_timetable_update
    BEFORE UPDATE ON course_timetables
    FOR EACH ROW
    EXECUTE FUNCTION protect_enrolled_students_from_timetable_changes();
```

---

## 📝 **Implementation Order**

### **Phase 1: Schema & Basic Triggers** ✅ **COMPLETE**
1. Update course_timetables schema (date → day field)
2. Course timetable overlap prevention trigger

### **Phase 2: Enrollment Validation** ✅ **COMPLETE**
3. College constraint enforcement trigger
4. Student course enrollment conflict prevention trigger

### **Phase 3: Admin Protection** ✅ **COMPLETE**
5. Timetable update protection trigger

---

## 🧪 **Testing Scenarios**

### **Test Case 1: Course Timetable Overlap** ✅
```sql
-- Should succeed
INSERT INTO course_timetables (unique_id, day, start_time, end_time, course_id) 
VALUES ('test1', 'Monday', '09:00', '10:00', 'course123');

-- Should fail with TIMETABLE_CONFLICT
INSERT INTO course_timetables (unique_id, day, start_time, end_time, course_id) 
VALUES ('test2', 'Monday', '09:30', '10:30', 'course123');
```

### **Test Case 2: Student Enrollment Conflict** ✅
```sql
-- Enroll student in first course
INSERT INTO student_course_mapping (unique_id, student_id, course_id) 
VALUES ('map1', 'student123', 'course_math_monday_9am');

-- Should fail - student already has Monday 9-10 AM class
INSERT INTO student_course_mapping (unique_id, student_id, course_id) 
VALUES ('map2', 'student123', 'course_physics_monday_930am');
```

### **Test Case 3: College Constraint** ✅
```sql
-- Should fail - student from college A trying to enroll in college B course
INSERT INTO student_course_mapping (unique_id, student_id, course_id) 
VALUES ('map3', 'student_from_college_a', 'course_from_college_b');
```

---

## ⚡ **Performance Considerations**

### **Indexes Created:**
- `idx_course_timetables_overlap_check` - For timetable overlap checks
- `idx_student_course_conflict_check` - For student enrollment conflicts  
- `idx_course_timetables_conflict_lookup` - For cross-course conflict detection
- `idx_student_college_lookup` - For college constraint validation
- `idx_course_college_lookup` - For college constraint validation

### **Optimization Features:**
- Early exit strategies with LIMIT 1
- Conditional trigger execution (WHEN clauses)
- Composite indexes for multi-column lookups
- Structured error codes for application handling

---

## 📋 **Summary Checklist**

- ✅ **Course Timetable Overlap Prevention** - IMPLEMENTED & OPTIMIZED
- ✅ **Student Enrollment Conflict Prevention** - IMPLEMENTED & OPTIMIZED  
- ✅ **College Constraint Enforcement** - IMPLEMENTED & OPTIMIZED
- ✅ **Timetable Update Protection** - IMPLEMENTED & OPTIMIZED