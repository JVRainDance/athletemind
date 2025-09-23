-- Add RLS policy to allow coaches to view their athletes' training sessions
CREATE POLICY "Coaches can view their athletes' sessions" ON training_sessions 
    FOR SELECT USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

