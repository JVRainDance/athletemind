-- Create a reliable trigger function to automatically create profiles for new users
-- This function uses SECURITY DEFINER to bypass RLS and run with superuser privileges

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if user is confirmed or if email confirmation is disabled
  -- This prevents creating profiles for unconfirmed users
  IF NEW.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
    BEGIN
      -- Insert a new profile for the user using the metadata from auth.users
      INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        role
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::user_role
      );
      
      -- Log successful profile creation
      RAISE NOTICE 'Profile created for user % with role %', NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
      
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

-- Create a function to handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile when email is confirmed (if it doesn't exist)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    BEGIN
      -- Check if profile already exists
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (
          id, 
          email, 
          first_name, 
          last_name, 
          role
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
          NEW.raw_user_meta_data->>'last_name',
          COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::user_role
        );
        
        RAISE NOTICE 'Profile created for confirmed user % with role %', NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
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

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();

-- Grant necessary permissions for the functions to work
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_confirmed() TO postgres, anon, authenticated, service_role;
