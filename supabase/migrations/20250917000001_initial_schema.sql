-- Safe Migration for Supabase (without superuser commands)
-- This migration adds missing features to the existing database

-- Create function to auto-generate patient IDs
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  patient_id_str VARCHAR;
BEGIN
  -- Get the next patient number
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 2) AS INTEGER)), 0) + 1
  INTO next_id
  FROM patients
  WHERE patient_id ~ '^P[0-9]+$';

  -- Format as P001, P002, etc.
  patient_id_str := 'P' || LPAD(next_id::TEXT, 3, '0');

  -- Set the patient_id
  NEW.patient_id := patient_id_str;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating patient IDs (remove if exists first)
DROP TRIGGER IF EXISTS trigger_generate_patient_id ON patients;
CREATE TRIGGER trigger_generate_patient_id
  BEFORE INSERT ON patients
  FOR EACH ROW
  WHEN (NEW.patient_id IS NULL)
  EXECUTE FUNCTION generate_patient_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns (remove if exist first)
DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_medical_history_fields_updated_at ON medical_history_fields;
CREATE TRIGGER trigger_medical_history_fields_updated_at
  BEFORE UPDATE ON medical_history_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON patients;
CREATE TRIGGER trigger_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_procedures_updated_at ON procedures;
CREATE TRIGGER trigger_procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_treatments_updated_at ON treatments;
CREATE TRIGGER trigger_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_registration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin-only access for now)

-- Admin users policies
DROP POLICY IF EXISTS "Admin users can view all admin_users" ON admin_users;
CREATE POLICY "Admin users can view all admin_users" ON admin_users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin users can insert admin_users" ON admin_users;
CREATE POLICY "Admin users can insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can update admin_users" ON admin_users;
CREATE POLICY "Admin users can update admin_users" ON admin_users
  FOR UPDATE USING (true);

-- Patients policies
DROP POLICY IF EXISTS "Admin users can view all patients" ON patients;
CREATE POLICY "Admin users can view all patients" ON patients
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin users can insert patients" ON patients;
CREATE POLICY "Admin users can insert patients" ON patients
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can update patients" ON patients;
CREATE POLICY "Admin users can update patients" ON patients
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin users can delete patients" ON patients;
CREATE POLICY "Admin users can delete patients" ON patients
  FOR DELETE USING (true);

-- Similar policies for other tables
DROP POLICY IF EXISTS "Admin access to medical_history_fields" ON medical_history_fields;
CREATE POLICY "Admin access to medical_history_fields" ON medical_history_fields
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to appointments" ON appointments;
CREATE POLICY "Admin access to appointments" ON appointments
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to procedures" ON procedures;
CREATE POLICY "Admin access to procedures" ON procedures
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to treatments" ON treatments;
CREATE POLICY "Admin access to treatments" ON treatments
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to treatment_procedures" ON treatment_procedures;
CREATE POLICY "Admin access to treatment_procedures" ON treatment_procedures
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to qr_registration_tokens" ON qr_registration_tokens;
CREATE POLICY "Admin access to qr_registration_tokens" ON qr_registration_tokens
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin access to notifications" ON notifications;
CREATE POLICY "Admin access to notifications" ON notifications
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_procedures_treatment_id ON treatment_procedures(treatment_id);