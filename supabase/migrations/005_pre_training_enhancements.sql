-- Pre-Training Check-in Enhancements
-- Adds reward criteria, themed rating systems, and goal advance setting

-- Add reward criteria to pre_training_checkins table
ALTER TABLE pre_training_checkins 
ADD COLUMN reward_criteria TEXT,
ADD COLUMN reward_earned BOOLEAN DEFAULT FALSE;

-- Create rating_themes table for customizable rating systems
CREATE TABLE rating_themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    theme_name TEXT NOT NULL,
    theme_type TEXT NOT NULL CHECK (theme_type IN ('animals', 'gaming', 'sports', 'nature', 'custom')),
    rating_labels JSONB NOT NULL, -- Array of 5 labels for ratings 1-5
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create advance_goals table for setting goals up to 7 days in advance
CREATE TABLE advance_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    goal_text TEXT NOT NULL,
    goal_order INTEGER NOT NULL CHECK (goal_order >= 1 AND goal_order <= 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, goal_order)
);

-- Create rewards table for individual and squad rewards
CREATE TABLE rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reward_name TEXT NOT NULL,
    reward_description TEXT,
    stars_required INTEGER NOT NULL DEFAULT 1,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('individual', 'squad')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stars table to track star earnings
CREATE TABLE user_stars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    stars_earned INTEGER DEFAULT 1,
    reward_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rating_themes_user_id ON rating_themes(user_id);
CREATE INDEX idx_advance_goals_session_id ON advance_goals(session_id);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_user_stars_user_id ON user_stars(user_id);
CREATE INDEX idx_user_stars_session_id ON user_stars(session_id);

-- Create updated_at triggers
CREATE TRIGGER update_rating_themes_updated_at BEFORE UPDATE ON rating_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advance_goals_updated_at BEFORE UPDATE ON advance_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE rating_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stars ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rating_themes
CREATE POLICY "Users can view own rating themes" ON rating_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own rating themes" ON rating_themes FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for advance_goals
CREATE POLICY "Athletes can view own advance goals" ON advance_goals FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = advance_goals.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
CREATE POLICY "Athletes can manage own advance goals" ON advance_goals FOR ALL USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = advance_goals.session_id 
        AND ts.athlete_id = auth.uid()
    )
);

-- Create RLS policies for rewards
CREATE POLICY "Users can view own rewards" ON rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own rewards" ON rewards FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for user_stars
CREATE POLICY "Users can view own stars" ON user_stars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own stars" ON user_stars FOR ALL USING (auth.uid() = user_id);

-- Insert default rating themes
INSERT INTO rating_themes (user_id, theme_name, theme_type, rating_labels, is_active) 
SELECT 
    p.id,
    'Wild Animals',
    'animals',
    '["Sloth", "Meerkat", "Polar Bear", "Eagle", "Lion"]'::jsonb,
    true
FROM profiles p 
WHERE p.role = 'athlete';

INSERT INTO rating_themes (user_id, theme_name, theme_type, rating_labels, is_active) 
SELECT 
    p.id,
    'Gaming Adventure',
    'gaming',
    '["Lost in the woods", "Low on hearts", "Shielded up", "Sword in hand", "Triforce ready"]'::jsonb,
    false
FROM profiles p 
WHERE p.role = 'athlete';

-- Add comment to document the enhancements
COMMENT ON TABLE rating_themes IS 'Customizable rating themes for energy and mindset levels';
COMMENT ON TABLE advance_goals IS 'Goals set up to 7 days in advance for training sessions';
COMMENT ON TABLE rewards IS 'Individual and squad rewards with star requirements';
COMMENT ON TABLE user_stars IS 'Track star earnings from training sessions';
