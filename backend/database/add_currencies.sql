-- ============================================================================
-- CURRENCIES TABLE & USER PROFILE CURRENCY PREFERENCE
-- ============================================================================

-- Create currencies table to manage available currencies
CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,  -- e.g., 'MWK', 'ZAR', 'ZWL'
  name VARCHAR(100) NOT NULL,  -- e.g., 'Malawian Kwacha'
  symbol VARCHAR(10) NOT NULL,  -- e.g., 'MK', 'R', 'Z$'
  country VARCHAR(100),  -- e.g., 'Malawi'
  is_active BOOLEAN DEFAULT TRUE,
  exchange_rate DECIMAL(15, 6) DEFAULT 1.0,  -- For future currency conversion
  is_default BOOLEAN DEFAULT FALSE,  -- Mark which is the default currency
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add preferred_currency column to profiles table to store user's currency preference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'MWK';

-- Add currency_id foreign key constraint
ALTER TABLE profiles ADD CONSTRAINT fk_preferred_currency
  FOREIGN KEY (preferred_currency) REFERENCES currencies(code) ON DELETE SET DEFAULT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_currency ON profiles(preferred_currency);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, country, is_active, is_default)
VALUES
  ('MWK', 'Malawian Kwacha', 'MK', 'Malawi', TRUE, TRUE),
  ('ZAR', 'South African Rand', 'R', 'South Africa', TRUE, FALSE),
  ('ZWL', 'Zimbabwe Dollar', 'Z$', 'Zimbabwe', TRUE, FALSE),
  ('TZS', 'Tanzania Shilling', 'TSh', 'Tanzania', TRUE, FALSE),
  ('ZMW', 'Zambian Kwacha', 'ZK', 'Zambia', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;
