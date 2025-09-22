-- Add reminder tracking to appointments table
-- Migration: Add appointment reminder tracking fields

-- Add reminder tracking columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_day_of_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_status TEXT DEFAULT 'pending' CHECK (reminder_status IN ('pending', 'sent', 'failed', 'disabled')),
ADD COLUMN IF NOT EXISTS patient_reminder_preference TEXT DEFAULT 'email' CHECK (patient_reminder_preference IN ('email', 'sms', 'none', 'both'));

-- Create reminders configuration table
CREATE TABLE IF NOT EXISTS reminder_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hour', 'day_of', 'custom')),
  hours_before INTEGER NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  email_template_subject TEXT NOT NULL,
  email_template_body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default reminder configurations
INSERT INTO reminder_config (reminder_type, hours_before, email_template_subject, email_template_body) VALUES
('24_hour', 24,
 'Reminder: Your LAV Dentaire Appointment Tomorrow',
 'Hi {{patient_name}},

This is a friendly reminder that you have an appointment at LAV Dentaire tomorrow:

📅 Date: {{appointment_date}}
🕐 Time: {{appointment_time}}
⏱️ Duration: {{duration}} minutes
📍 Reason: {{reason}}

If you need to reschedule or cancel, please contact us at least 24 hours in advance.

📞 Phone: (555) 123-4567
📧 Email: appointments@lavdentaire.com

We look forward to seeing you!

Best regards,
LAV Dentaire Team'),

('day_of', 2,
 'Today: Your LAV Dentaire Appointment',
 'Hi {{patient_name}},

This is a reminder that you have an appointment at LAV Dentaire today:

📅 Today: {{appointment_date}}
🕐 Time: {{appointment_time}}
📍 Location: LAV Dentaire Clinic
🎯 Reason: {{reason}}

Please arrive 15 minutes early for check-in.

📞 If you need to contact us: (555) 123-4567

See you soon!

LAV Dentaire Team');

-- Create reminder logs table for tracking
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  email_address TEXT,
  error_message TEXT,
  resend_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_status ON appointments(reminder_status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_appointment ON reminder_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for reminder_config
CREATE TRIGGER update_reminder_config_updated_at
  BEFORE UPDATE ON reminder_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reminder_config IS 'Configuration for appointment reminder emails';
COMMENT ON TABLE reminder_logs IS 'Audit log for all reminder email attempts';
COMMENT ON COLUMN appointments.reminder_24h_sent_at IS 'Timestamp when 24-hour reminder was sent';
COMMENT ON COLUMN appointments.reminder_day_of_sent_at IS 'Timestamp when day-of reminder was sent';
COMMENT ON COLUMN appointments.reminder_count IS 'Total number of reminders sent for this appointment';
COMMENT ON COLUMN appointments.reminder_status IS 'Current reminder processing status';
COMMENT ON COLUMN appointments.patient_reminder_preference IS 'Patient preference for reminder delivery method';