-- Create coach_athletes table to establish relationships
CREATE TABLE coach_athletes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coach_id, athlete_id)
);

-- Create squads table for team management
CREATE TABLE squads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create squad_members table
CREATE TABLE squad_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(squad_id, athlete_id)
);

-- Add RLS policies for coach_athletes
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their athletes" ON coach_athletes
    FOR SELECT USING (
        coach_id = auth.uid() OR 
        athlete_id = auth.uid()
    );

CREATE POLICY "Coaches can manage their athlete relationships" ON coach_athletes
    FOR ALL USING (
        coach_id = auth.uid()
    );

-- Add RLS policies for squads
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their squads" ON squads
    FOR ALL USING (
        coach_id = auth.uid()
    );

CREATE POLICY "Athletes can view their squads" ON squads
    FOR SELECT USING (
        id IN (
            SELECT squad_id FROM squad_members 
            WHERE athlete_id = auth.uid()
        )
    );

-- Add RLS policies for squad_members
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage squad members" ON squad_members
    FOR ALL USING (
        squad_id IN (
            SELECT id FROM squads WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Athletes can view their squad memberships" ON squad_members
    FOR SELECT USING (
        athlete_id = auth.uid()
    );

-- Create indexes for better performance
CREATE INDEX idx_coach_athletes_coach_id ON coach_athletes(coach_id);
CREATE INDEX idx_coach_athletes_athlete_id ON coach_athletes(athlete_id);
CREATE INDEX idx_squads_coach_id ON squads(coach_id);
CREATE INDEX idx_squad_members_squad_id ON squad_members(squad_id);
CREATE INDEX idx_squad_members_athlete_id ON squad_members(athlete_id);

