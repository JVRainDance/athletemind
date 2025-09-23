-- Allow authenticated users full access to profiles table
-- This enables users to read and update their own profile information

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles
CREATE POLICY "Authenticated users can read all profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own profile
CREATE POLICY "Authenticated users can insert their own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Authenticated users can update their own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to delete their own profile
CREATE POLICY "Authenticated users can delete their own profile" ON profiles 
FOR DELETE USING (auth.uid() = id);
