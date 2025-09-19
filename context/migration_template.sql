-- Migration Template with Correct Patterns

-- Example: User-owned table
CREATE TABLE example_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- Correct RLS Policies
CREATE POLICY "Users can view own records" 
ON example_table FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" 
ON example_table FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" 
ON example_table FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" 
ON example_table FOR DELETE 
USING (auth.uid() = user_id);