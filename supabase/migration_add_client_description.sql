-- Migration: Add client and description columns to projects table
-- Run this in your Supabase SQL Editor if you want to store client and description

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.client IS 'Optional client name for the project';
COMMENT ON COLUMN projects.description IS 'Optional project description';
