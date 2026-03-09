-- Add currency field to courses table
-- Supports: MWK (Malawian Kwacha), ZAR (South African Rand), ZWL (Zimbabwe Dollar), TZS (Tanzania Shilling), ZMW (Zambian Kwacha)

ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'MWK';

-- Create index for currency queries
CREATE INDEX IF NOT EXISTS idx_courses_currency ON courses(currency);

-- Update existing courses to have default currency
UPDATE courses SET currency = 'MWK' WHERE currency IS NULL;
