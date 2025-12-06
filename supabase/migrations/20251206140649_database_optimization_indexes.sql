-- Database Optimization Migration
-- Created: 2025-12-06
-- Purpose: Add indexes to optimize common query patterns identified in audit

-- ============================================================================
-- TRAINING SESSIONS OPTIMIZATION
-- ============================================================================

-- Composite index for athlete session queries (most common query pattern)
-- Optimizes: Dashboard queries, session lists filtered by athlete and date
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_date_status
ON training_sessions(athlete_id, scheduled_date DESC, status)
WHERE status IN ('scheduled', 'in_progress');

-- Index for upcoming sessions queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_upcoming
ON training_sessions(scheduled_date, start_time)
WHERE status = 'scheduled';

-- Index for active/current session lookups
CREATE INDEX IF NOT EXISTS idx_training_sessions_in_progress
ON training_sessions(athlete_id, status)
WHERE status = 'in_progress';

-- ============================================================================
-- COACH-ATHLETE RELATIONSHIP OPTIMIZATION
-- ============================================================================

-- Index for coach viewing their athletes
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach_active
ON coach_athletes(coach_id, is_active)
WHERE is_active = true;

-- Index for athlete's coaches lookup
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete_active
ON coach_athletes(athlete_id, is_active)
WHERE is_active = true;

-- ============================================================================
-- USER STARS AND REWARDS OPTIMIZATION
-- ============================================================================

-- Composite index for user stars summary queries
CREATE INDEX IF NOT EXISTS idx_user_stars_user_session
ON user_stars(user_id, session_id);

-- Index for calculating total stars per user
CREATE INDEX IF NOT EXISTS idx_user_stars_total
ON user_stars(user_id, stars_earned);

-- Index for active rewards by user
CREATE INDEX IF NOT EXISTS idx_rewards_user_active
ON rewards(user_id, is_active)
WHERE is_active = true;

-- ============================================================================
-- SESSION RELATED DATA OPTIMIZATION
-- ============================================================================

-- Index for pre-training checkins by session
CREATE INDEX IF NOT EXISTS idx_pre_training_checkins_session
ON pre_training_checkins(session_id);

-- Index for session goals by session
CREATE INDEX IF NOT EXISTS idx_session_goals_session
ON session_goals(session_id);

-- Index for advance goals by session
CREATE INDEX IF NOT EXISTS idx_advance_goals_session_order
ON advance_goals(session_id, goal_order);

-- Index for session reflections by session
CREATE INDEX IF NOT EXISTS idx_session_reflections_session
ON session_reflections(session_id);

-- Index for training notes by session
CREATE INDEX IF NOT EXISTS idx_training_notes_session_category
ON training_notes(session_id, category);

-- ============================================================================
-- TRAINING SCHEDULES OPTIMIZATION
-- ============================================================================

-- Index for athlete schedules by day
CREATE INDEX IF NOT EXISTS idx_training_schedules_athlete_day
ON training_schedules(athlete_id, day_of_week);

-- ============================================================================
-- SQUAD MANAGEMENT OPTIMIZATION
-- ============================================================================

-- Index for squad members lookup
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_active
ON squad_members(squad_id, is_active)
WHERE is_active = true;

-- Index for athlete's squads
CREATE INDEX IF NOT EXISTS idx_squad_members_athlete_active
ON squad_members(athlete_id, is_active)
WHERE is_active = true;

-- Index for squads by coach
CREATE INDEX IF NOT EXISTS idx_squads_coach
ON squads(coach_id);

-- ============================================================================
-- PROFILES OPTIMIZATION
-- ============================================================================

-- Index for profile lookup by role
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- Index for email lookups (if not already covered by unique constraint)
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update table statistics for query planner

ANALYZE training_sessions;
ANALYZE coach_athletes;
ANALYZE user_stars;
ANALYZE rewards;
ANALYZE pre_training_checkins;
ANALYZE session_goals;
ANALYZE advance_goals;
ANALYZE session_reflections;
ANALYZE training_notes;
ANALYZE training_schedules;
ANALYZE squad_members;
ANALYZE squads;
ANALYZE profiles;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_training_sessions_athlete_date_status IS
'Optimizes dashboard and session list queries for athletes';

COMMENT ON INDEX idx_coach_athletes_coach_active IS
'Optimizes coach viewing their assigned athletes';

COMMENT ON INDEX idx_user_stars_user_session IS
'Optimizes star calculation queries';

-- ============================================================================
-- VACUUM (for maintenance, run separately if needed)
-- ============================================================================
-- VACUUM ANALYZE can be run manually for better performance:
-- VACUUM ANALYZE training_sessions;
-- VACUUM ANALYZE coach_athletes;
-- etc.
