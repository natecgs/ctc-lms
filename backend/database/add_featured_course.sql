-- Migration: Add is_featured field to courses table
-- This allows instructors to mark one course as featured on the homepage

ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Ensure only one course is featured at a time (optional, can be enforced at application level)
-- For now, allow multiple featured courses and the frontend will pick the first one

CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured) WHERE is_featured = TRUE;
