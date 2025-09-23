-- Auto-generate training sessions from schedules with 7-day rolling window
-- This function ensures sessions are always available 7 days ahead

CREATE OR REPLACE FUNCTION generate_sessions_from_schedules()
RETURNS void AS $$
DECLARE
    schedule_record RECORD;
    current_date DATE := CURRENT_DATE;
    end_date DATE := CURRENT_DATE + INTERVAL '7 days';
    session_date DATE;
    day_of_week INTEGER;
    existing_session_count INTEGER;
BEGIN
    -- Loop through all training schedules
    FOR schedule_record IN 
        SELECT ts.*, p.id as athlete_id
        FROM training_schedules ts
        JOIN profiles p ON ts.athlete_id = p.id
        WHERE p.role = 'athlete'
    LOOP
        -- Generate sessions for the next 7 days
        session_date := current_date;
        
        WHILE session_date <= end_date LOOP
            day_of_week := EXTRACT(DOW FROM session_date);
            
            -- Check if this day matches the schedule
            IF schedule_record.day_of_week = day_of_week THEN
                -- Check if session already exists for this date and athlete
                SELECT COUNT(*) INTO existing_session_count
                FROM training_sessions
                WHERE athlete_id = schedule_record.athlete_id
                AND scheduled_date = session_date
                AND start_time = schedule_record.start_time;
                
                -- Only create session if it doesn't already exist
                IF existing_session_count = 0 THEN
                    INSERT INTO training_sessions (
                        athlete_id,
                        scheduled_date,
                        start_time,
                        end_time,
                        session_type,
                        status
                    ) VALUES (
                        schedule_record.athlete_id,
                        session_date,
                        schedule_record.start_time,
                        schedule_record.end_time,
                        schedule_record.session_type,
                        'scheduled'
                    );
                END IF;
            END IF;
            
            session_date := session_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions that are more than 30 days old and completed/absent
    DELETE FROM training_sessions
    WHERE scheduled_date < CURRENT_DATE - INTERVAL '30 days'
    AND status IN ('completed', 'absent');
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the function
COMMENT ON FUNCTION generate_sessions_from_schedules() IS 'Automatically generates training sessions from schedules with 7-day rolling window';

-- Create an index to improve performance for session generation
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_date ON training_sessions(athlete_id, scheduled_date, start_time);



