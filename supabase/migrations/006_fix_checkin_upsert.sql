-- Fix pre_training_checkins table to prevent duplicate entries
-- Add unique constraint on session_id to ensure one check-in per session

-- First, remove any duplicate entries (keep the most recent one)
DELETE FROM pre_training_checkins 
WHERE id NOT IN (
    SELECT DISTINCT ON (session_id) id 
    FROM pre_training_checkins 
    ORDER BY session_id, created_at DESC
);

-- Add unique constraint on session_id
ALTER TABLE pre_training_checkins 
ADD CONSTRAINT unique_session_checkin UNIQUE (session_id);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_session_checkin ON pre_training_checkins IS 'Ensures only one check-in per training session';

