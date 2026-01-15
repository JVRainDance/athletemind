-- Migration: Fix Supabase linter warnings
-- Fixes: auth_rls_initplan, duplicate_index, multiple_permissive_policies

-- ============================================
-- PART 1: Fix duplicate indexes
-- ============================================

-- Drop duplicate indexes (keeping the more descriptively named ones)
DROP INDEX IF EXISTS idx_pre_training_checkins_session;
DROP INDEX IF EXISTS idx_session_goals_session;
DROP INDEX IF EXISTS idx_session_reflections_session;
DROP INDEX IF EXISTS idx_squads_coach;

-- ============================================
-- PART 2: Fix auth_rls_initplan issues
-- Replace auth.uid() with (select auth.uid()) for better performance
-- This prevents the function from being re-evaluated for each row
-- ============================================

-- =====================
-- PROFILES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view all athletes" ON profiles;
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Coaches can view all athletes" ON profiles
    FOR SELECT USING (role = 'athlete');

CREATE POLICY "Coaches can update athlete profiles" ON profiles
    FOR UPDATE USING (
        role = 'athlete' AND
        id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

-- =====================
-- TRAINING_SCHEDULES TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own schedules" ON training_schedules;
DROP POLICY IF EXISTS "Athletes can manage own schedules" ON training_schedules;
DROP POLICY IF EXISTS "Coaches can view athlete schedules" ON training_schedules;
DROP POLICY IF EXISTS "Coaches can create athlete schedules" ON training_schedules;
DROP POLICY IF EXISTS "Coaches can update athlete schedules" ON training_schedules;
DROP POLICY IF EXISTS "Coaches can delete athlete schedules" ON training_schedules;

CREATE POLICY "Athletes can view own schedules" ON training_schedules
    FOR SELECT USING (athlete_id = (select auth.uid()));

CREATE POLICY "Athletes can manage own schedules" ON training_schedules
    FOR ALL USING (athlete_id = (select auth.uid()));

CREATE POLICY "Coaches can view athlete schedules" ON training_schedules
    FOR SELECT USING (
        athlete_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete schedules" ON training_schedules
    FOR ALL USING (
        athlete_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

-- =====================
-- TRAINING_SESSIONS TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own sessions" ON training_sessions;
DROP POLICY IF EXISTS "Athletes can manage own sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view athlete sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can create athlete sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can update athlete sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can delete athlete sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can manage athlete sessions" ON training_sessions;

CREATE POLICY "Athletes can view own sessions" ON training_sessions
    FOR SELECT USING (athlete_id = (select auth.uid()));

CREATE POLICY "Athletes can manage own sessions" ON training_sessions
    FOR ALL USING (athlete_id = (select auth.uid()));

CREATE POLICY "Coaches can view athlete sessions" ON training_sessions
    FOR SELECT USING (
        athlete_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete sessions" ON training_sessions
    FOR ALL USING (
        athlete_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

-- =====================
-- SESSION_GOALS TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own session goals" ON session_goals;
DROP POLICY IF EXISTS "Athletes can manage own session goals" ON session_goals;
DROP POLICY IF EXISTS "Coaches can view athlete session goals" ON session_goals;
DROP POLICY IF EXISTS "Coaches can create athlete session goals" ON session_goals;
DROP POLICY IF EXISTS "Coaches can update athlete session goals" ON session_goals;
DROP POLICY IF EXISTS "Coaches can delete athlete session goals" ON session_goals;

CREATE POLICY "Athletes can view own session goals" ON session_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = session_goals.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Athletes can manage own session goals" ON session_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = session_goals.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Coaches can view athlete session goals" ON session_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = session_goals.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete session goals" ON session_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = session_goals.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

-- =====================
-- PRE_TRAINING_CHECKINS TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Athletes can manage own checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Athletes can insert own checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Athletes can update own checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Coaches can view athlete checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Coaches can create athlete checkins" ON pre_training_checkins;
DROP POLICY IF EXISTS "Coaches can update athlete checkins" ON pre_training_checkins;

CREATE POLICY "Athletes can view own checkins" ON pre_training_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = pre_training_checkins.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Athletes can manage own checkins" ON pre_training_checkins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = pre_training_checkins.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Coaches can view athlete checkins" ON pre_training_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = pre_training_checkins.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete checkins" ON pre_training_checkins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = pre_training_checkins.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

-- =====================
-- TRAINING_NOTES TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own notes" ON training_notes;
DROP POLICY IF EXISTS "Athletes can manage own notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can view athlete notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can manage athlete notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can view athlete training notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can create athlete training notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can update athlete training notes" ON training_notes;
DROP POLICY IF EXISTS "Coaches can delete athlete training notes" ON training_notes;

CREATE POLICY "Athletes can view own notes" ON training_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = training_notes.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Athletes can manage own notes" ON training_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = training_notes.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Coaches can view athlete notes" ON training_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = training_notes.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete notes" ON training_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = training_notes.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

-- =====================
-- SESSION_REFLECTIONS TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own reflections" ON session_reflections;
DROP POLICY IF EXISTS "Athletes can manage own reflections" ON session_reflections;
DROP POLICY IF EXISTS "Coaches can view athlete reflections" ON session_reflections;
DROP POLICY IF EXISTS "Coaches can create athlete reflections" ON session_reflections;
DROP POLICY IF EXISTS "Coaches can update athlete reflections" ON session_reflections;

CREATE POLICY "Athletes can view own reflections" ON session_reflections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = session_reflections.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Athletes can manage own reflections" ON session_reflections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = session_reflections.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Coaches can view athlete reflections" ON session_reflections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = session_reflections.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete reflections" ON session_reflections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = session_reflections.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

-- =====================
-- USER_STARS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own stars" ON user_stars;
DROP POLICY IF EXISTS "Users can manage own stars" ON user_stars;
DROP POLICY IF EXISTS "Coaches can view athlete stars" ON user_stars;
DROP POLICY IF EXISTS "Coaches can create athlete stars" ON user_stars;
DROP POLICY IF EXISTS "Coaches can update athlete stars" ON user_stars;

CREATE POLICY "Users can view own stars" ON user_stars
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own stars" ON user_stars
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Coaches can view athlete stars" ON user_stars
    FOR SELECT USING (
        user_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete stars" ON user_stars
    FOR ALL USING (
        user_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

-- =====================
-- RATING_THEMES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Users can manage own rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Coaches can view rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Coaches can create rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Coaches can update rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Coaches can delete rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Anyone can view rating themes" ON rating_themes;
DROP POLICY IF EXISTS "Athletes can view rating themes" ON rating_themes;

CREATE POLICY "Users can view own rating themes" ON rating_themes
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own rating themes" ON rating_themes
    FOR ALL USING (user_id = (select auth.uid()));

-- Coaches need to see all themes for creating sessions
CREATE POLICY "Coaches can view all rating themes" ON rating_themes
    FOR SELECT USING (true);

-- =====================
-- ADVANCE_GOALS TABLE
-- =====================
DROP POLICY IF EXISTS "Athletes can view own advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Athletes can manage own advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Coaches can view athlete advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Coaches can create athlete advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Coaches can update athlete advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Coaches can delete athlete advance goals" ON advance_goals;
DROP POLICY IF EXISTS "Coaches can manage athlete advance goals" ON advance_goals;

CREATE POLICY "Athletes can view own advance goals" ON advance_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = advance_goals.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Athletes can manage own advance goals" ON advance_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            WHERE ts.id = advance_goals.session_id
            AND ts.athlete_id = (select auth.uid())
        )
    );

CREATE POLICY "Coaches can view athlete advance goals" ON advance_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = advance_goals.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete advance goals" ON advance_goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM training_sessions ts
            JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ts.id = advance_goals.session_id
            AND ca.coach_id = (select auth.uid())
            AND ca.is_active = true
        )
    );

-- =====================
-- REWARDS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can manage own rewards" ON rewards;
DROP POLICY IF EXISTS "Coaches can view athlete rewards" ON rewards;
DROP POLICY IF EXISTS "Coaches can create athlete rewards" ON rewards;
DROP POLICY IF EXISTS "Coaches can update athlete rewards" ON rewards;
DROP POLICY IF EXISTS "Coaches can delete athlete rewards" ON rewards;
DROP POLICY IF EXISTS "Anyone can view rewards" ON rewards;

CREATE POLICY "Users can view own rewards" ON rewards
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can manage own rewards" ON rewards
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Coaches can view athlete rewards" ON rewards
    FOR SELECT USING (
        user_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

CREATE POLICY "Coaches can manage athlete rewards" ON rewards
    FOR ALL USING (
        user_id IN (
            SELECT athlete_id
            FROM coach_athletes
            WHERE coach_id = (select auth.uid())
            AND is_active = true
        )
    );

-- =====================
-- REWARD_CLAIMS TABLE (if exists)
-- =====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_claims') THEN
        DROP POLICY IF EXISTS "Users can view own claims" ON reward_claims;
        DROP POLICY IF EXISTS "Users can manage own claims" ON reward_claims;

        EXECUTE 'CREATE POLICY "Users can view own claims" ON reward_claims
            FOR SELECT USING (user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Users can manage own claims" ON reward_claims
            FOR ALL USING (user_id = (select auth.uid()))';
    END IF;
END$$;

-- =====================
-- COACH_ATHLETES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view their relationships" ON coach_athletes;
DROP POLICY IF EXISTS "Users can create connection requests" ON coach_athletes;
DROP POLICY IF EXISTS "Users can update their connections" ON coach_athletes;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON coach_athletes;
DROP POLICY IF EXISTS "Coaches can manage their athlete relationships" ON coach_athletes;
DROP POLICY IF EXISTS "Athletes can view their coaches" ON coach_athletes;

CREATE POLICY "Users can view their relationships" ON coach_athletes
    FOR SELECT USING (
        coach_id = (select auth.uid()) OR
        athlete_id = (select auth.uid())
    );

CREATE POLICY "Users can create connection requests" ON coach_athletes
    FOR INSERT WITH CHECK (
        (coach_id = (select auth.uid()) AND initiated_by = (select auth.uid())) OR
        (athlete_id = (select auth.uid()) AND initiated_by = (select auth.uid()))
    );

CREATE POLICY "Users can update their connections" ON coach_athletes
    FOR UPDATE USING (
        -- Recipient can respond to pending requests
        (status = 'pending' AND
         ((coach_id = (select auth.uid()) AND initiated_by = athlete_id) OR
          (athlete_id = (select auth.uid()) AND initiated_by = coach_id)))
        OR
        -- Initiator can cancel their pending requests
        (status = 'pending' AND initiated_by = (select auth.uid()))
        OR
        -- Either party can deactivate active connections
        (status = 'active' AND (coach_id = (select auth.uid()) OR athlete_id = (select auth.uid())))
        OR
        -- Legacy: Allow updates if user is coach or athlete (for is_active field)
        (coach_id = (select auth.uid()) OR athlete_id = (select auth.uid()))
    );

-- =====================
-- SQUADS TABLE (if exists)
-- =====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'squads') THEN
        DROP POLICY IF EXISTS "Coaches can view own squads" ON squads;
        DROP POLICY IF EXISTS "Coaches can manage own squads" ON squads;

        EXECUTE 'CREATE POLICY "Coaches can view own squads" ON squads
            FOR SELECT USING (coach_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Coaches can manage own squads" ON squads
            FOR ALL USING (coach_id = (select auth.uid()))';
    END IF;
END$$;

-- =====================
-- SQUAD_MEMBERS TABLE (if exists)
-- =====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'squad_members') THEN
        DROP POLICY IF EXISTS "Coaches can view squad members" ON squad_members;
        DROP POLICY IF EXISTS "Coaches can manage squad members" ON squad_members;

        EXECUTE 'CREATE POLICY "Coaches can view squad members" ON squad_members
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM squads
                    WHERE squads.id = squad_members.squad_id
                    AND squads.coach_id = (select auth.uid())
                )
            )';

        EXECUTE 'CREATE POLICY "Coaches can manage squad members" ON squad_members
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM squads
                    WHERE squads.id = squad_members.squad_id
                    AND squads.coach_id = (select auth.uid())
                )
            )';
    END IF;
END$$;
