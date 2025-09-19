-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'parent');
CREATE TYPE session_type AS ENUM ('regular', 'competition', 'extra');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'absent');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_schedules table
CREATE TABLE training_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type session_type DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_sessions table
CREATE TABLE training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type session_type DEFAULT 'regular',
    status session_status DEFAULT 'scheduled',
    absence_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_goals table
CREATE TABLE session_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    goal_text TEXT NOT NULL,
    achieved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pre_training_checkins table
CREATE TABLE pre_training_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    mindset_level INTEGER NOT NULL CHECK (mindset_level >= 1 AND mindset_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_notes table
CREATE TABLE training_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    note_text TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_reflections table
CREATE TABLE session_reflections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    what_went_well TEXT NOT NULL,
    what_didnt_go_well TEXT NOT NULL,
    what_to_do_different TEXT NOT NULL,
    most_proud_of TEXT NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_training_schedules_athlete_id ON training_schedules(athlete_id);
CREATE INDEX idx_training_sessions_athlete_id ON training_sessions(athlete_id);
CREATE INDEX idx_training_sessions_scheduled_date ON training_sessions(scheduled_date);
CREATE INDEX idx_session_goals_session_id ON session_goals(session_id);
CREATE INDEX idx_pre_training_checkins_session_id ON pre_training_checkins(session_id);
CREATE INDEX idx_training_notes_session_id ON training_notes(session_id);
CREATE INDEX idx_session_reflections_session_id ON session_reflections(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_schedules_updated_at BEFORE UPDATE ON training_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_goals_updated_at BEFORE UPDATE ON session_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pre_training_checkins_updated_at BEFORE UPDATE ON pre_training_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_notes_updated_at BEFORE UPDATE ON training_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_reflections_updated_at BEFORE UPDATE ON session_reflections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_training_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for training_schedules
CREATE POLICY "Athletes can view own schedules" ON training_schedules FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Athletes can manage own schedules" ON training_schedules FOR ALL USING (auth.uid() = athlete_id);

-- Create RLS policies for training_sessions
CREATE POLICY "Athletes can view own sessions" ON training_sessions FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Athletes can manage own sessions" ON training_sessions FOR ALL USING (auth.uid() = athlete_id);

-- Create RLS policies for session_goals
CREATE POLICY "Athletes can view own session goals" ON session_goals FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = session_goals.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
CREATE POLICY "Athletes can manage own session goals" ON session_goals FOR ALL USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = session_goals.session_id 
        AND ts.athlete_id = auth.uid()
    )
);

-- Create RLS policies for pre_training_checkins
CREATE POLICY "Athletes can view own checkins" ON pre_training_checkins FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = pre_training_checkins.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
CREATE POLICY "Athletes can manage own checkins" ON pre_training_checkins FOR ALL USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = pre_training_checkins.session_id 
        AND ts.athlete_id = auth.uid()
    )
);

-- Create RLS policies for training_notes
CREATE POLICY "Athletes can view own notes" ON training_notes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = training_notes.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
CREATE POLICY "Athletes can manage own notes" ON training_notes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = training_notes.session_id 
        AND ts.athlete_id = auth.uid()
    )
);

-- Create RLS policies for session_reflections
CREATE POLICY "Athletes can view own reflections" ON session_reflections FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = session_reflections.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
CREATE POLICY "Athletes can manage own reflections" ON session_reflections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts 
        WHERE ts.id = session_reflections.session_id 
        AND ts.athlete_id = auth.uid()
    )
);
