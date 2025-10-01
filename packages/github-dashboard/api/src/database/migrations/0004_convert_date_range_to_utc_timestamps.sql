-- Convert date range fields from varchar to UTC timestamps
-- This migration converts the existing YYYY-MM-DD format to proper UTC timestamps

-- First, add new timestamp columns
ALTER TABLE dashboard_activity_configs 
ADD COLUMN date_range_start_utc TIMESTAMP WITH TIME ZONE,
ADD COLUMN date_range_end_utc TIMESTAMP WITH TIME ZONE;

-- Convert existing date strings to UTC timestamps
-- Assuming the existing dates are in YYYY-MM-DD format and should be treated as UTC
UPDATE dashboard_activity_configs 
SET 
  date_range_start_utc = CASE 
    WHEN date_range_start IS NOT NULL AND date_range_start != '' 
    THEN (date_range_start || ' 00:00:00+00:00')::TIMESTAMP WITH TIME ZONE
    ELSE NULL 
  END,
  date_range_end_utc = CASE 
    WHEN date_range_end IS NOT NULL AND date_range_end != '' 
    THEN (date_range_end || ' 23:59:59+00:00')::TIMESTAMP WITH TIME ZONE
    ELSE NULL 
  END;

-- Drop the old varchar columns
ALTER TABLE dashboard_activity_configs 
DROP COLUMN date_range_start,
DROP COLUMN date_range_end;

-- Rename the new columns to the original names
ALTER TABLE dashboard_activity_configs 
RENAME COLUMN date_range_start_utc TO date_range_start;

ALTER TABLE dashboard_activity_configs 
RENAME COLUMN date_range_end_utc TO date_range_end;
