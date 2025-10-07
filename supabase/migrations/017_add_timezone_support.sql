-- Add timezone support to profiles table
ALTER TABLE profiles 
ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Add timezone_auto_detected column to track if timezone was auto-detected
ALTER TABLE profiles 
ADD COLUMN timezone_auto_detected BOOLEAN DEFAULT FALSE;

-- Update existing profiles with UTC as default
UPDATE profiles 
SET timezone = 'UTC', timezone_auto_detected = FALSE 
WHERE timezone IS NULL;

-- Add comments
COMMENT ON COLUMN profiles.timezone IS 'User timezone (e.g., America/New_York, Europe/London)';
COMMENT ON COLUMN profiles.timezone_auto_detected IS 'Whether the timezone was automatically detected from IP address';
