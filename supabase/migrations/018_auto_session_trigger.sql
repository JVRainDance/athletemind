-- Automatic Session Generation Trigger
-- This trigger ensures sessions are auto-generated when a schedule is created or updated

-- Create function to auto-generate sessions for a specific athlete
CREATE OR REPLACE FUNCTION auto_generate_sessions_for_athlete()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the main session generation function
  -- This will create sessions for the next 7 days for this athlete's schedules
  PERFORM generate_sessions_from_schedules();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on training_schedules insert/update
DROP TRIGGER IF EXISTS trigger_auto_generate_sessions ON training_schedules;

CREATE TRIGGER trigger_auto_generate_sessions
  AFTER INSERT OR UPDATE ON training_schedules
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_sessions_for_athlete();

-- Add comment
COMMENT ON TRIGGER trigger_auto_generate_sessions ON training_schedules IS
  'Automatically generates training sessions when a schedule is created or updated';

COMMENT ON FUNCTION auto_generate_sessions_for_athlete() IS
  'Trigger function to auto-generate sessions for an athlete when their schedule changes';
