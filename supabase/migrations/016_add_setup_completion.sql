-- Add setup completion tracking to profiles table
ALTER TABLE profiles 
ADD COLUMN setup_completed BOOLEAN DEFAULT FALSE;

-- Update existing profiles to mark setup as completed
UPDATE profiles 
SET setup_completed = TRUE 
WHERE setup_completed IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.setup_completed IS 'Tracks whether the user has completed the initial setup wizard';

