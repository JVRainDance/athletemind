-- Split full_name into first_name and last_name
-- Add new columns
ALTER TABLE profiles ADD COLUMN first_name TEXT;
ALTER TABLE profiles ADD COLUMN last_name TEXT;

-- Migrate existing data (if any)
-- This will split existing full_name values on the first space
UPDATE profiles 
SET 
  first_name = CASE 
    WHEN full_name IS NULL OR full_name = '' THEN NULL
    WHEN position(' ' in full_name) = 0 THEN full_name
    ELSE substring(full_name from 1 for position(' ' in full_name) - 1)
  END,
  last_name = CASE 
    WHEN full_name IS NULL OR full_name = '' THEN NULL
    WHEN position(' ' in full_name) = 0 THEN NULL
    ELSE substring(full_name from position(' ' in full_name) + 1)
  END
WHERE full_name IS NOT NULL;

-- Make first_name required (not null)
ALTER TABLE profiles ALTER COLUMN first_name SET NOT NULL;

-- Drop the old full_name column
ALTER TABLE profiles DROP COLUMN full_name;










