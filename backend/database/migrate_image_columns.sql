-- Migration: Extend image URL columns to support base64 encoded images
-- This script updates the image_url and avatar_url columns from VARCHAR(500) to TEXT
-- to accommodate large base64-encoded image data

-- Update courses table
ALTER TABLE courses 
ALTER COLUMN image_url TYPE TEXT;

-- Update profiles table
ALTER TABLE profiles 
ALTER COLUMN avatar_url TYPE TEXT;

-- Update instructors table
ALTER TABLE instructors 
ALTER COLUMN avatar_url TYPE TEXT;

-- Log completion
SELECT 'Migration completed: Image columns extended to TEXT type' AS status;
