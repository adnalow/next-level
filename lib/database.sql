-- Drop existing objects if they exist (with CASCADE to handle dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS job_category CASCADE;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('job_seeker', 'job_poster');

-- Create enum for job categories
CREATE TYPE job_category AS ENUM (
  'digital_design',
  'programming',
  'writing',
  'marketing',
  'manual_labor',
  'tutoring',
  'gardening',
  'carpentry',
  'other'
);

-- Create a table for user profiles that extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'job_seeker'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category job_category NOT NULL,
  description TEXT NOT NULL,
  skill_tags TEXT[] NOT NULL,
  location TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days <= 7),
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(job_id, applicant_id)
);

-- Create badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  svg TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  acquisition_number INTEGER NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS for badges and user_badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Allow public access to profiles (but limit what can be seen)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view jobs
CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  USING (true);

-- Allow job posters to create jobs
CREATE POLICY "Job posters can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'job_poster'::user_role
    )
    AND auth.uid() = poster_id
  );

-- Allow job posters to update their own jobs
CREATE POLICY "Job posters can update their own jobs"
  ON jobs FOR UPDATE
  USING (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

-- Add RLS policies for applications table
CREATE POLICY "Job seekers can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'job_seeker'::user_role
    )
    AND auth.uid() = applicant_id
  );

CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (
    auth.uid() = applicant_id OR 
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.poster_id = auth.uid()
    )
  );

-- Anyone can view badges
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- Allow job posters to insert badges for their jobs
CREATE POLICY "Job posters can insert badges for their jobs"
  ON badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = badges.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

-- Users can view their own user_badges
CREATE POLICY "Users can view their own user_badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own user_badges
CREATE POLICY "Users can insert their own user_badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own user_badges
CREATE POLICY "Users can delete their own user_badges"
  ON user_badges FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'job_seeker'::user_role
    )
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      role = COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        profiles.role
      );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();