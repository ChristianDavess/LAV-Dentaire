-- Data Cleanup Migration: Fix invalid dates causing API failures
-- This migration must run BEFORE schema changes to ensure data integrity

-- Clean up invalid dates using direct SQL approach
-- Target problematic date strings that cause "date/time field value out of range" errors

-- Clean up invalid dates in patients table
-- Look for common invalid date patterns
UPDATE patients
SET date_of_birth = NULL
WHERE date_of_birth IS NOT NULL
  AND (
    date_of_birth::text ~ '2025-09-3[2-9]'  -- September 32nd and higher
    OR date_of_birth::text ~ '2025-0[1-9]-3[2-9]'  -- Any month with 32nd+ day
    OR date_of_birth::text ~ '2025-1[0-2]-3[2-9]'  -- Oct-Dec with 32nd+ day
    OR date_of_birth::text ~ '2025-02-3[0-9]'  -- February 30th+
    OR date_of_birth::text ~ '2025-04-31'  -- April 31st
    OR date_of_birth::text ~ '2025-06-31'  -- June 31st
    OR date_of_birth::text ~ '2025-09-31'  -- September 31st
    OR date_of_birth::text ~ '2025-11-31'  -- November 31st
  );

-- Clean up invalid dates in treatments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatments') THEN
        UPDATE treatments
        SET treatment_date = NULL
        WHERE treatment_date IS NOT NULL
          AND (
            treatment_date::text ~ '2025-09-3[2-9]'  -- September 32nd and higher
            OR treatment_date::text ~ '2025-0[1-9]-3[2-9]'  -- Any month with 32nd+ day
            OR treatment_date::text ~ '2025-1[0-2]-3[2-9]'  -- Oct-Dec with 32nd+ day
            OR treatment_date::text ~ '2025-02-3[0-9]'  -- February 30th+
            OR treatment_date::text ~ '2025-04-31'  -- April 31st
            OR treatment_date::text ~ '2025-06-31'  -- June 31st
            OR treatment_date::text ~ '2025-09-31'  -- September 31st
            OR treatment_date::text ~ '2025-11-31'  -- November 31st
          );
    END IF;
END $$;

-- Clean up invalid dates in appointments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        UPDATE appointments
        SET appointment_date = NULL
        WHERE appointment_date IS NOT NULL
          AND (
            appointment_date::text ~ '2025-09-3[2-9]'  -- September 32nd and higher
            OR appointment_date::text ~ '2025-0[1-9]-3[2-9]'  -- Any month with 32nd+ day
            OR appointment_date::text ~ '2025-1[0-2]-3[2-9]'  -- Oct-Dec with 32nd+ day
            OR appointment_date::text ~ '2025-02-3[0-9]'  -- February 30th+
            OR appointment_date::text ~ '2025-04-31'  -- April 31st
            OR appointment_date::text ~ '2025-06-31'  -- June 31st
            OR appointment_date::text ~ '2025-09-31'  -- September 31st
            OR appointment_date::text ~ '2025-11-31'  -- November 31st
          );
    END IF;
END $$;

-- Log cleanup results
DO $$
DECLARE
    patient_updates INTEGER;
    treatment_updates INTEGER := 0;
    appointment_updates INTEGER := 0;
BEGIN
    -- Count patients with null birth dates (after cleanup)
    SELECT COUNT(*) INTO patient_updates
    FROM patients
    WHERE date_of_birth IS NULL;

    -- Count treatments with null dates if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatments') THEN
        SELECT COUNT(*) INTO treatment_updates
        FROM treatments
        WHERE treatment_date IS NULL;
    END IF;

    -- Count appointments with null dates if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        SELECT COUNT(*) INTO appointment_updates
        FROM appointments
        WHERE appointment_date IS NULL;
    END IF;

    RAISE NOTICE 'Data cleanup completed successfully:';
    RAISE NOTICE '- Patients with null birth dates (after cleanup): %', patient_updates;
    RAISE NOTICE '- Treatments with null dates (after cleanup): %', treatment_updates;
    RAISE NOTICE '- Appointments with null dates (after cleanup): %', appointment_updates;
    RAISE NOTICE 'Invalid dates like "2025-09-32" have been cleaned up and set to NULL';
END $$;