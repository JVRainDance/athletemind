-- Add absence_reason column to training_sessions table if it doesn't exist
-- This allows tracking why an athlete was absent from a session

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'training_sessions' 
                   AND column_name = 'absence_reason') THEN
        ALTER TABLE training_sessions ADD COLUMN absence_reason TEXT;
    END IF;
END $$;

-- Add comment to document the column purpose
COMMENT ON COLUMN training_sessions.absence_reason IS 'Reason for athlete absence from training session';

-- Update RLS policies to allow athletes to update their own session absence reasons
-- Athletes should be able to record their own absences
DO $$ 
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Athletes can update their own session status and absence reason" ON training_sessions;
    
    -- Create new policy
    CREATE POLICY "Athletes can update their own session status and absence reason" ON training_sessions
        FOR UPDATE USING (auth.uid() = athlete_id)
        WITH CHECK (auth.uid() = athlete_id);
END $$;

-- Ensure athletes can read their own session data including absence reasons
DO $$ 
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Athletes can view their own sessions" ON training_sessions;
    
    -- Create new policy
    CREATE POLICY "Athletes can view their own sessions" ON training_sessions
        FOR SELECT USING (auth.uid() = athlete_id);
END $$;
