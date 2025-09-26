-- Migration: Enhance QR Registration System
-- Add missing columns for comprehensive QR code functionality

-- Add QR-specific columns to qr_registration_tokens table
ALTER TABLE qr_registration_tokens
ADD COLUMN IF NOT EXISTS reusable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS qr_type text DEFAULT 'single-use' CHECK (qr_type IN ('generic', 'reusable', 'single-use')),
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS note text;

-- Add registration source tracking to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS registration_source text DEFAULT 'manual' CHECK (registration_source IN ('manual', 'qr-token', 'online', 'referral'));

-- Create index for better QR token queries
CREATE INDEX IF NOT EXISTS idx_qr_tokens_type_status ON qr_registration_tokens(qr_type, used);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_expires_at ON qr_registration_tokens(expires_at);

-- Create index for registration source analytics
CREATE INDEX IF NOT EXISTS idx_patients_registration_source ON patients(registration_source);

-- Add comments for documentation
COMMENT ON COLUMN qr_registration_tokens.reusable IS 'Whether this QR token can be used multiple times';
COMMENT ON COLUMN qr_registration_tokens.qr_type IS 'Type of QR code: generic (permanent), reusable (multi-use), single-use (one-time)';
COMMENT ON COLUMN qr_registration_tokens.usage_count IS 'Number of times this token has been used for patient registration';
COMMENT ON COLUMN qr_registration_tokens.note IS 'Optional note or description for this QR token';

COMMENT ON COLUMN patients.registration_source IS 'How the patient was registered: manual (staff), qr-token (QR code), online (web form), referral (referred by another patient)';

-- Update existing QR tokens to have proper defaults if any exist
UPDATE qr_registration_tokens
SET
  reusable = false,
  qr_type = 'single-use',
  usage_count = CASE WHEN used = true THEN 1 ELSE 0 END
WHERE reusable IS NULL OR qr_type IS NULL OR usage_count IS NULL;

-- Update existing patients to have manual registration source if not set
UPDATE patients
SET registration_source = 'manual'
WHERE registration_source IS NULL;

-- Insert default QR configuration data if procedures table exists and is populated
-- (This helps with initial QR token generation)
DO $$
BEGIN
  -- Only insert sample QR tokens if we're setting up a development environment
  -- You can remove this section in production
  IF EXISTS (SELECT 1 FROM procedures WHERE is_active = true LIMIT 1) THEN
    INSERT INTO qr_registration_tokens (token, expires_at, used, reusable, qr_type, usage_count, note)
    SELECT
      'sample-generic-token-' || gen_random_uuid()::text,
      NOW() + INTERVAL '1 year',
      false,
      true,
      'generic',
      0,
      'Sample generic QR code for development'
    WHERE NOT EXISTS (SELECT 1 FROM qr_registration_tokens WHERE qr_type = 'generic');
  END IF;
END $$;

-- Create trigger to automatically update usage_count when QR token is used
CREATE OR REPLACE FUNCTION update_qr_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If token is being marked as used, increment usage_count
  IF NEW.used = true AND (OLD.used = false OR OLD.used IS NULL) THEN
    NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for usage count updates
DROP TRIGGER IF EXISTS trigger_qr_usage_count ON qr_registration_tokens;
CREATE TRIGGER trigger_qr_usage_count
  BEFORE UPDATE ON qr_registration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_usage_count();