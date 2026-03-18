-- ============================================
-- PITCH GUIDANCE - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Ideas table - stores user's startup ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table - stores AI evaluations of ideas
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evaluation_text TEXT NOT NULL,
  verdict VARCHAR(100),
  market_size VARCHAR(200),
  primary_risk TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation history table - stores follow-up Q&A
CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (for better query performance)
-- ============================================

CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);

CREATE INDEX idx_evaluations_idea_id ON evaluations(idea_id);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);

CREATE INDEX idx_conversation_evaluation_id ON conversation_history(evaluation_id);
CREATE INDEX idx_conversation_created_at ON conversation_history(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - IDEAS TABLE
-- ============================================

-- Users can view their own ideas
CREATE POLICY "Users can view own ideas" 
ON ideas FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own ideas
CREATE POLICY "Users can insert own ideas" 
ON ideas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ideas
CREATE POLICY "Users can update own ideas" 
ON ideas FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas" 
ON ideas FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - EVALUATIONS TABLE
-- ============================================

-- Users can view their own evaluations
CREATE POLICY "Users can view own evaluations" 
ON evaluations FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own evaluations
CREATE POLICY "Users can insert own evaluations" 
ON evaluations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own evaluations
CREATE POLICY "Users can update own evaluations" 
ON evaluations FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own evaluations
CREATE POLICY "Users can delete own evaluations" 
ON evaluations FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - CONVERSATION HISTORY TABLE
-- ============================================

-- Users can view their own conversation history
CREATE POLICY "Users can view own conversation history" 
ON conversation_history FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own conversation history
CREATE POLICY "Users can insert own conversation history" 
ON conversation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversation history
CREATE POLICY "Users can delete own conversation history" 
ON conversation_history FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on ideas table
CREATE TRIGGER update_ideas_updated_at 
BEFORE UPDATE ON ideas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================
-- Your database is ready!
-- Next steps:
-- 1. Enable Email auth in Supabase Dashboard > Authentication > Providers
-- 2. Enable Google/GitHub OAuth (optional)
-- 3. Copy your Supabase URL and anon key to .env file
-- ============================================
