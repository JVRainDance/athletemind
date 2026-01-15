# Correct RLS Policy Patterns

## ✅ GOOD Examples

```sql
-- Profiles table policy (correct)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

-- Posts table policy (correct)
CREATE POLICY "Users can view own posts" ON posts
FOR SELECT USING (auth.uid() = user_id);

##BAD Examples

-- This creates infinite recursion - DON'T DO THIS
CREATE POLICY "bad_policy" ON profiles
FOR SELECT USING (
    user_id = (SELECT user_id FROM profiles WHERE id = auth.uid())
);