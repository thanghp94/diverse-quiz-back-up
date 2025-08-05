
-- Migration to update student_try table timestamp columns
-- This will convert existing text timestamps to proper TIMESTAMP WITH TIME ZONE

-- First, let's see what data we have
SELECT 
    time_start, 
    time_end,
    CASE 
        WHEN time_start ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' THEN 'ISO Format'
        WHEN time_start ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$' THEN 'Time Only'
        ELSE 'Other Format'
    END as time_start_format,
    CASE 
        WHEN time_end ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' THEN 'ISO Format'
        WHEN time_end ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$' THEN 'Time Only'
        ELSE 'Other Format'
    END as time_end_format
FROM student_try 
WHERE time_start IS NOT NULL OR time_end IS NOT NULL
LIMIT 10;

-- Add new timestamp columns
ALTER TABLE student_try 
ADD COLUMN time_start_new TIMESTAMP WITH TIME ZONE,
ADD COLUMN time_end_new TIMESTAMP WITH TIME ZONE;

-- Convert existing data
UPDATE student_try 
SET time_start_new = CASE 
    WHEN time_start ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' THEN 
        time_start::timestamp with time zone
    WHEN time_start ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$' THEN 
        (CURRENT_DATE || ' ' || time_start)::timestamp with time zone
    ELSE NULL
END
WHERE time_start IS NOT NULL AND time_start != '';

UPDATE student_try 
SET time_end_new = CASE 
    WHEN time_end ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' THEN 
        time_end::timestamp with time zone
    WHEN time_end ~ '^[0-9]{2}:[0-9]{2}:[0-9]{2}$' THEN 
        (CURRENT_DATE || ' ' || time_end)::timestamp with time zone
    ELSE NULL
END
WHERE time_end IS NOT NULL AND time_end != '';

-- Drop old columns and rename new ones
ALTER TABLE student_try DROP COLUMN time_start;
ALTER TABLE student_try DROP COLUMN time_end;
ALTER TABLE student_try RENAME COLUMN time_start_new TO time_start;
ALTER TABLE student_try RENAME COLUMN time_end_new TO time_end;
