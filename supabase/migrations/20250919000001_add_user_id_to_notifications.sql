-- Migration: Add user_id column to notifications table
-- This fixes the API route error where notifications are filtered by user_id

-- Add user_id column to notifications table
ALTER TABLE notifications
ADD COLUMN user_id UUID REFERENCES admin_users(id);

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Add updated_at column for consistency with other tables
ALTER TABLE notifications
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing notifications to have a default admin user_id
-- This ensures existing notifications won't break
UPDATE notifications
SET user_id = (SELECT id FROM admin_users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id required for future inserts
ALTER TABLE notifications
ALTER COLUMN user_id SET NOT NULL;