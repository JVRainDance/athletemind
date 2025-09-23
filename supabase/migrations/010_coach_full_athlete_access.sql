-- Comprehensive RLS policies for coaches to have full access to athlete data

-- ==============================================
-- PROFILES TABLE POLICIES
-- ==============================================

-- Coaches can view all athlete profiles
CREATE POLICY "Coaches can view all athletes" ON profiles 
    FOR SELECT USING (role = 'athlete');

-- Coaches can update athlete profiles (for future features like editing athlete info)
CREATE POLICY "Coaches can update athlete profiles" ON profiles 
    FOR UPDATE USING (
        role = 'athlete' AND 
        id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- ==============================================
-- TRAINING_SESSIONS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' sessions
CREATE POLICY "Coaches can view athlete sessions" ON training_sessions 
    FOR SELECT USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can create sessions for their athletes
CREATE POLICY "Coaches can create athlete sessions" ON training_sessions 
    FOR INSERT WITH CHECK (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can update their athletes' sessions
CREATE POLICY "Coaches can update athlete sessions" ON training_sessions 
    FOR UPDATE USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can delete their athletes' sessions
CREATE POLICY "Coaches can delete athlete sessions" ON training_sessions 
    FOR DELETE USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- ==============================================
-- TRAINING_SCHEDULES TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' schedules
CREATE POLICY "Coaches can view athlete schedules" ON training_schedules 
    FOR SELECT USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can create schedules for their athletes
CREATE POLICY "Coaches can create athlete schedules" ON training_schedules 
    FOR INSERT WITH CHECK (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can update their athletes' schedules
CREATE POLICY "Coaches can update athlete schedules" ON training_schedules 
    FOR UPDATE USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can delete their athletes' schedules
CREATE POLICY "Coaches can delete athlete schedules" ON training_schedules 
    FOR DELETE USING (
        athlete_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- ==============================================
-- SESSION_GOALS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' session goals
CREATE POLICY "Coaches can view athlete session goals" ON session_goals 
    FOR SELECT USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can create goals for their athletes' sessions
CREATE POLICY "Coaches can create athlete session goals" ON session_goals 
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can update their athletes' session goals
CREATE POLICY "Coaches can update athlete session goals" ON session_goals 
    FOR UPDATE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can delete their athletes' session goals
CREATE POLICY "Coaches can delete athlete session goals" ON session_goals 
    FOR DELETE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- ==============================================
-- PRE_TRAINING_CHECKINS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' check-ins
CREATE POLICY "Coaches can view athlete checkins" ON pre_training_checkins 
    FOR SELECT USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can create check-ins for their athletes
CREATE POLICY "Coaches can create athlete checkins" ON pre_training_checkins 
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can update their athletes' check-ins
CREATE POLICY "Coaches can update athlete checkins" ON pre_training_checkins 
    FOR UPDATE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- ==============================================
-- TRAINING_NOTES TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' training notes
CREATE POLICY "Coaches can view athlete training notes" ON training_notes 
    FOR SELECT USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can create training notes for their athletes
CREATE POLICY "Coaches can create athlete training notes" ON training_notes 
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can update their athletes' training notes
CREATE POLICY "Coaches can update athlete training notes" ON training_notes 
    FOR UPDATE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can delete their athletes' training notes
CREATE POLICY "Coaches can delete athlete training notes" ON training_notes 
    FOR DELETE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- ==============================================
-- SESSION_REFLECTIONS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' reflections
CREATE POLICY "Coaches can view athlete reflections" ON session_reflections 
    FOR SELECT USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can create reflections for their athletes
CREATE POLICY "Coaches can create athlete reflections" ON session_reflections 
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can update their athletes' reflections
CREATE POLICY "Coaches can update athlete reflections" ON session_reflections 
    FOR UPDATE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- ==============================================
-- USER_STARS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' stars
CREATE POLICY "Coaches can view athlete stars" ON user_stars 
    FOR SELECT USING (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can create stars for their athletes
CREATE POLICY "Coaches can create athlete stars" ON user_stars 
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can update their athletes' stars
CREATE POLICY "Coaches can update athlete stars" ON user_stars 
    FOR UPDATE USING (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- ==============================================
-- REWARDS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' rewards
CREATE POLICY "Coaches can view athlete rewards" ON rewards 
    FOR SELECT USING (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can create rewards for their athletes
CREATE POLICY "Coaches can create athlete rewards" ON rewards 
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can update their athletes' rewards
CREATE POLICY "Coaches can update athlete rewards" ON rewards 
    FOR UPDATE USING (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- Coaches can delete their athletes' rewards
CREATE POLICY "Coaches can delete athlete rewards" ON rewards 
    FOR DELETE USING (
        user_id IN (
            SELECT athlete_id 
            FROM coach_athletes 
            WHERE coach_id = auth.uid() 
            AND is_active = true
        )
    );

-- ==============================================
-- ADVANCE_GOALS TABLE POLICIES
-- ==============================================

-- Coaches can view their athletes' advance goals
CREATE POLICY "Coaches can view athlete advance goals" ON advance_goals 
    FOR SELECT USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can create advance goals for their athletes
CREATE POLICY "Coaches can create athlete advance goals" ON advance_goals 
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can update their athletes' advance goals
CREATE POLICY "Coaches can update athlete advance goals" ON advance_goals 
    FOR UPDATE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- Coaches can delete their athletes' advance goals
CREATE POLICY "Coaches can delete athlete advance goals" ON advance_goals 
    FOR DELETE USING (
        session_id IN (
            SELECT ts.id 
            FROM training_sessions ts
            INNER JOIN coach_athletes ca ON ts.athlete_id = ca.athlete_id
            WHERE ca.coach_id = auth.uid() 
            AND ca.is_active = true
        )
    );

-- ==============================================
-- RATING_THEMES TABLE POLICIES
-- ==============================================

-- Coaches can view all rating themes (for creating sessions)
CREATE POLICY "Coaches can view rating themes" ON rating_themes 
    FOR SELECT USING (true);

-- Coaches can create rating themes
CREATE POLICY "Coaches can create rating themes" ON rating_themes 
    FOR INSERT WITH CHECK (true);

-- Coaches can update rating themes
CREATE POLICY "Coaches can update rating themes" ON rating_themes 
    FOR UPDATE USING (true);

-- Coaches can delete rating themes
CREATE POLICY "Coaches can delete rating themes" ON rating_themes 
    FOR DELETE USING (true);
