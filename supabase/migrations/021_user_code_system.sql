-- Migration: Add user code system for easy coach-athlete connection
-- User codes format: XXX-XXXX (e.g., ATH-XK7M for athletes, COA-XK7M for coaches)

-- Add user_code column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

-- Create index for fast lookups by user code
CREATE INDEX IF NOT EXISTS idx_profiles_user_code ON profiles(user_code);

-- Function to generate unique user codes
-- Uses: A-Z (excluding O, I, L which are easily confused) + 2-9 (excluding 0, 1)
-- Format: PREFIX-XXXX where PREFIX is ATH/COA/PAR based on role
CREATE OR REPLACE FUNCTION generate_user_code(user_role user_role)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    suffix TEXT;
    new_code TEXT;
    allowed_chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    max_attempts INT := 100;
    attempt INT := 0;
BEGIN
    -- Set prefix based on role
    CASE user_role
        WHEN 'athlete' THEN prefix := 'ATH';
        WHEN 'coach' THEN prefix := 'COA';
        WHEN 'parent' THEN prefix := 'PAR';
        ELSE prefix := 'USR';
    END CASE;

    -- Generate unique code with retry logic
    LOOP
        -- Generate 4 random characters
        suffix := '';
        FOR i IN 1..4 LOOP
            suffix := suffix || substr(allowed_chars, floor(random() * length(allowed_chars) + 1)::int, 1);
        END LOOP;

        new_code := prefix || '-' || suffix;

        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_code = new_code) THEN
            RETURN new_code;
        END IF;

        -- Prevent infinite loop
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique user code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Backfill existing users with user codes
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT id, role FROM profiles WHERE user_code IS NULL LOOP
        UPDATE profiles
        SET user_code = generate_user_code(profile_record.role)
        WHERE id = profile_record.id;
    END LOOP;
END;
$$;

-- Make user_code NOT NULL after backfilling all existing users
ALTER TABLE profiles ALTER COLUMN user_code SET NOT NULL;

-- Update handle_new_user function to include user_code generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_role user_role;
    new_user_code TEXT;
BEGIN
    -- Only create profile if user is confirmed or if email confirmation is disabled
    IF NEW.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
        BEGIN
            -- Determine the role
            new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::user_role;

            -- Generate a unique user code
            new_user_code := generate_user_code(new_role);

            -- Insert a new profile for the user using the metadata from auth.users
            INSERT INTO public.profiles (
                id,
                email,
                first_name,
                last_name,
                role,
                user_code
            )
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
                NEW.raw_user_meta_data->>'last_name',
                new_role,
                new_user_code
            );

            -- Log successful profile creation
            RAISE NOTICE 'Profile created for user % with role % and code %', NEW.id, new_role, new_user_code;

        EXCEPTION
            WHEN unique_violation THEN
                -- Profile already exists, do nothing
                RAISE NOTICE 'Profile already exists for user %', NEW.id;
            WHEN OTHERS THEN
                -- Log error but don't fail the user creation
                RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Update handle_user_confirmed function to include user_code generation
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_role user_role;
    new_user_code TEXT;
BEGIN
    -- Create profile when email is confirmed (if it doesn't exist)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        BEGIN
            -- Check if profile already exists
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
                -- Determine the role
                new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::user_role;

                -- Generate a unique user code
                new_user_code := generate_user_code(new_role);

                INSERT INTO public.profiles (
                    id,
                    email,
                    first_name,
                    last_name,
                    role,
                    user_code
                )
                VALUES (
                    NEW.id,
                    NEW.email,
                    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
                    NEW.raw_user_meta_data->>'last_name',
                    new_role,
                    new_user_code
                );

                RAISE NOTICE 'Profile created for confirmed user % with role % and code %', NEW.id, new_role, new_user_code;
            ELSE
                RAISE NOTICE 'Profile already exists for confirmed user %', NEW.id;
            END IF;

        EXCEPTION
            WHEN unique_violation THEN
                -- Profile already exists, do nothing
                RAISE NOTICE 'Profile already exists for confirmed user %', NEW.id;
            WHEN OTHERS THEN
                -- Log error but don't fail the confirmation
                RAISE WARNING 'Failed to create profile for confirmed user %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION generate_user_code(user_role) TO postgres, anon, authenticated, service_role;
