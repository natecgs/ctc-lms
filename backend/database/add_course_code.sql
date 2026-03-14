-- Migration: Add course code field to courses table
-- This migration adds a unique course code field for tracking and identification

BEGIN;

-- Add code column to courses table
ALTER TABLE courses
ADD COLUMN code VARCHAR(50) UNIQUE;

-- Create index on code for faster lookups
CREATE INDEX idx_courses_code ON courses(code);

-- Commit transaction
COMMIT;
