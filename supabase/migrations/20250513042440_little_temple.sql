-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace trigger function with logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the attempt to create a new user
  RAISE NOTICE 'Creating new user profile for ID: %', NEW.id;
  
  BEGIN
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (id) DO NOTHING;
    
    -- Log successful creation
    RAISE NOTICE 'Successfully created user profile for ID: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log any errors that occur
    RAISE NOTICE 'Error creating user profile for ID: %. Error: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();