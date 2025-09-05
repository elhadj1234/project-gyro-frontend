-- Create user_links table for storing user submitted links with job application functionality
CREATE TABLE IF NOT EXISTS user_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  -- Job application fields
  application_status VARCHAR(50) DEFAULT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  profile_data JSONB DEFAULT NULL,
  application_notes TEXT DEFAULT NULL,
  company_response TEXT DEFAULT NULL,
  follow_up_date DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_links_user_id ON user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_links_created_at ON user_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_links_category ON user_links(category);
CREATE INDEX IF NOT EXISTS idx_user_links_is_favorite ON user_links(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_links_application_status ON user_links(application_status);
CREATE INDEX IF NOT EXISTS idx_user_links_applied_at ON user_links(applied_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own links
CREATE POLICY "Users can view their own links" ON user_links
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert their own links" ON user_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update their own links" ON user_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete their own links" ON user_links
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_links_updated_at
  BEFORE UPDATE ON user_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create profiles table for storing user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills TEXT[],
  experience_years INTEGER,
  current_position VARCHAR(255),
  current_company VARCHAR(255),
  education TEXT,
  certifications TEXT[],
  cover_letter_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
-- Users can only see their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();