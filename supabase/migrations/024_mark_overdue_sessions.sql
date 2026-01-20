-- Function to automatically mark overdue sessions as absent
-- Sessions are considered overdue if their scheduled date has passed
-- and they are still in 'scheduled' or 'in_progress' status

CREATE OR REPLACE FUNCTION mark_overdue_sessions_absent()
RETURNS TABLE(updated_count INTEGER, session_ids UUID[]) AS $$
DECLARE
    affected_ids UUID[];
    count_updated INTEGER;
BEGIN
    -- Update sessions that are past their scheduled date and still scheduled/in_progress
    -- We mark them as absent with a system-generated reason
    WITH updated AS (
        UPDATE training_sessions
        SET
            status = 'absent',
            absence_reason = 'Session not completed (auto-marked)'
        WHERE scheduled_date < CURRENT_DATE
        AND status IN ('scheduled', 'in_progress')
        RETURNING id
    )
    SELECT array_agg(id), COUNT(*)::INTEGER INTO affected_ids, count_updated FROM updated;

    -- Return the count and IDs of updated sessions
    RETURN QUERY SELECT COALESCE(count_updated, 0), COALESCE(affected_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the function
COMMENT ON FUNCTION mark_overdue_sessions_absent() IS 'Marks sessions that are past their scheduled date and still scheduled/in_progress as absent with auto-generated reason';

-- Create an index to improve performance for finding overdue sessions
CREATE INDEX IF NOT EXISTS idx_training_sessions_overdue
ON training_sessions(scheduled_date, status)
WHERE status IN ('scheduled', 'in_progress');
