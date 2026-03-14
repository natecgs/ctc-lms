-- Add course_code column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

-- Add index for code lookup (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
