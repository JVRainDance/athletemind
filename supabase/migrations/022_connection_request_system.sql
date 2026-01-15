-- Migration: Add connection request system for bidirectional coach-athlete linking
-- Allows both coaches and athletes to initiate connection requests

-- Create connection status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
        CREATE TYPE connection_status AS ENUM ('pending', 'active', 'rejected', 'inactive');
    END IF;
END$$;

-- Add new columns to coach_athletes table for connection request workflow
ALTER TABLE coach_athletes ADD COLUMN IF NOT EXISTS status connection_status DEFAULT 'active';
ALTER TABLE coach_athletes ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES profiles(id);
ALTER TABLE coach_athletes ADD COLUMN IF NOT EXISTS request_message TEXT;
ALTER TABLE coach_athletes ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing is_active data to new status field
UPDATE coach_athletes
SET status = CASE
    WHEN is_active = true THEN 'active'::connection_status
    ELSE 'inactive'::connection_status
END
WHERE status IS NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_coach_athletes_status ON coach_athletes(status);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_initiated_by ON coach_athletes(initiated_by);

-- Composite index for finding pending requests for a user
CREATE INDEX IF NOT EXISTS idx_coach_athletes_pending_coach ON coach_athletes(coach_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_coach_athletes_pending_athlete ON coach_athletes(athlete_id, status) WHERE status = 'pending';

-- Drop existing RLS policies that need updating
DROP POLICY IF EXISTS "Coaches can view their athletes" ON coach_athletes;
DROP POLICY IF EXISTS "Coaches can manage their athlete relationships" ON coach_athletes;
DROP POLICY IF EXISTS "Athletes can view their coaches" ON coach_athletes;

-- New policy: Both coaches and athletes can view their relationships
CREATE POLICY "Users can view their relationships" ON coach_athletes
    FOR SELECT USING (
        coach_id = auth.uid() OR
        athlete_id = auth.uid()
    );

-- New policy: Users can create connection requests
-- Coach creating: coach_id = auth.uid() and initiated_by = auth.uid()
-- Athlete creating: athlete_id = auth.uid() and initiated_by = auth.uid()
CREATE POLICY "Users can create connection requests" ON coach_athletes
    FOR INSERT WITH CHECK (
        (coach_id = auth.uid() AND initiated_by = auth.uid()) OR
        (athlete_id = auth.uid() AND initiated_by = auth.uid())
    );

-- New policy: Users can update connections they're part of
-- Recipients can approve/reject pending requests
-- Either party can deactivate active connections
CREATE POLICY "Users can update their connections" ON coach_athletes
    FOR UPDATE USING (
        -- Recipient can respond to pending requests
        (status = 'pending' AND
         ((coach_id = auth.uid() AND initiated_by = athlete_id) OR
          (athlete_id = auth.uid() AND initiated_by = coach_id)))
        OR
        -- Initiator can cancel their pending requests
        (status = 'pending' AND initiated_by = auth.uid())
        OR
        -- Either party can deactivate active connections
        (status = 'active' AND (coach_id = auth.uid() OR athlete_id = auth.uid()))
    );

-- Add unique constraint to prevent duplicate pending requests between same coach-athlete pair
-- Note: This allows a new request if previous was rejected/inactive
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_athletes_pending_unique
ON coach_athletes(coach_id, athlete_id)
WHERE status = 'pending';

-- Also ensure only one active connection per pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_athletes_active_unique
ON coach_athletes(coach_id, athlete_id)
WHERE status = 'active';
