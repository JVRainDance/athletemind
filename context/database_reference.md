# AthleteMind Database Reference

## Core Tables

### profiles
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role NOT NULL, -- 'athlete', 'coach', 'parent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### coach_athletes (Relationship Table)
```sql
CREATE TABLE coach_athletes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coach_id, athlete_id)
);
```

### training_sessions
```sql
CREATE TABLE training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type session_type DEFAULT 'regular', -- 'regular', 'competition', 'extra'
    status session_status DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'absent'
    absence_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### session_goals
```sql
CREATE TABLE session_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    goal_text TEXT NOT NULL,
    achieved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### pre_training_checkins
```sql
CREATE TABLE pre_training_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    mindset_level INTEGER NOT NULL CHECK (mindset_level >= 1 AND mindset_level <= 5),
    reward_criteria TEXT,
    reward_earned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);
```

### session_reflections
```sql
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
```

## Key Queries

### Get Coach's Athletes
```sql
SELECT 
    ca.athlete_id,
    p.id, p.first_name, p.last_name, p.email
FROM coach_athletes ca
INNER JOIN profiles p ON ca.athlete_id = p.id
WHERE ca.coach_id = $1 
AND ca.is_active = true;
```

### Get Athlete's Sessions for Coach
```sql
SELECT 
    ts.*,
    p.first_name, p.last_name
FROM training_sessions ts
INNER JOIN profiles p ON ts.athlete_id = p.id
WHERE ts.athlete_id IN (
    SELECT athlete_id 
    FROM coach_athletes 
    WHERE coach_id = $1 AND is_active = true
)
ORDER BY ts.scheduled_date DESC;
```

### Get All Athletes (for Assignment)
```sql
SELECT * FROM profiles 
WHERE role = 'athlete' 
ORDER BY first_name;
```

## RLS Policies

### profiles
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Coaches can view all athletes for assignment
CREATE POLICY "Coaches can view all athletes for assignment" ON profiles 
FOR SELECT USING (role = 'athlete');
```

### coach_athletes
```sql
-- Coaches can view their athletes
CREATE POLICY "Coaches can view their athletes" ON coach_athletes
FOR SELECT USING (
    coach_id = auth.uid() OR 
    athlete_id = auth.uid()
);

-- Coaches can manage their athlete relationships
CREATE POLICY "Coaches can manage their athlete relationships" ON coach_athletes
FOR ALL USING (coach_id = auth.uid());
```

### training_sessions
```sql
-- Athletes can view own sessions
CREATE POLICY "Athletes can view own sessions" ON training_sessions
FOR SELECT USING (athlete_id = auth.uid());

-- Coaches can view their athletes' sessions
CREATE POLICY "Coaches can view their athletes' sessions" ON training_sessions
FOR SELECT USING (
    athlete_id IN (
        SELECT athlete_id 
        FROM coach_athletes 
        WHERE coach_id = auth.uid() AND is_active = true
    )
);
```

## Comprehensive RLS Policies for Coaches

### Coach Full Access Policies
Coaches have been granted comprehensive access to all athlete-related data through RLS policies:

#### **PROFILES**
- ✅ View all athlete profiles
- ✅ Update assigned athlete profiles

#### **TRAINING_SESSIONS**
- ✅ View, create, update, delete their athletes' sessions

#### **TRAINING_SCHEDULES**
- ✅ View, create, update, delete their athletes' schedules

#### **SESSION_GOALS**
- ✅ View, create, update, delete their athletes' session goals

#### **PRE_TRAINING_CHECKINS**
- ✅ View, create, update their athletes' check-ins

#### **TRAINING_NOTES**
- ✅ View, create, update, delete their athletes' training notes

#### **SESSION_REFLECTIONS**
- ✅ View, create, update their athletes' reflections

#### **USER_STARS**
- ✅ View, create, update their athletes' star earnings

#### **REWARDS**
- ✅ View, create, update, delete their athletes' rewards

#### **ADVANCE_GOALS**
- ✅ View, create, update, delete their athletes' advance goals

#### **RATING_THEMES**
- ✅ Full access to create and manage rating themes

### Security Model
- **Scope**: Coaches can only access data for athletes assigned to them via `coach_athletes` table
- **Active Filter**: Only active coach-athlete relationships (`is_active = true`)
- **Cascading Access**: Access to session-related data through athlete relationships

## Common Issues & Solutions

### Issue: Coach can't see athletes
**Cause**: RLS policy blocking access
**Solution**: Ensure "Coaches can view all athletes for assignment" policy exists

### Issue: Athletes not showing on coach dashboard
**Cause**: coach_athletes relationship not established
**Solution**: Check coach_athletes table has active records

### Issue: Sessions not showing for coach
**Cause**: RLS policy or missing coach_athletes relationship
**Solution**: Verify coach_athletes table and RLS policies

## Database Types (TypeScript)

```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string | null
          role: 'athlete' | 'coach' | 'parent'
          created_at: string
          updated_at: string
        }
      }
      coach_athletes: {
        Row: {
          id: string
          coach_id: string
          athlete_id: string
          assigned_at: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      training_sessions: {
        Row: {
          id: string
          athlete_id: string
          scheduled_date: string
          start_time: string
          end_time: string
          session_type: 'regular' | 'competition' | 'extra'
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'absent'
          absence_reason: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
```
