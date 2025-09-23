-- Add RLS policy to allow coaches to view athlete profiles
CREATE POLICY "Coaches can view athlete profiles" ON profiles 
    FOR SELECT USING (
        role = 'athlete' AND 
        id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Also allow coaches to view all athlete profiles for assignment purposes
CREATE POLICY "Coaches can view all athletes for assignment" ON profiles 
    FOR SELECT USING (
        role = 'athlete'
    );

