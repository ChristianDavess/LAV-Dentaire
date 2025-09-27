-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'denied')),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  birthdate DATE NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  nationality TEXT,
  nickname TEXT,
  home_no TEXT,
  office_no TEXT,
  fax_no TEXT,
  mobile_no TEXT,
  email TEXT UNIQUE NOT NULL,
  address TEXT,
  occupation TEXT,
  dental_insurance TEXT,
  effective_date DATE,
  
  -- Dental History
  previous_dentist TEXT,
  last_dental_visit DATE,
  
  -- Medical History
  physician_name TEXT,
  specialty TEXT,
  office_address TEXT,
  office_number TEXT,
  is_good_health BOOLEAN DEFAULT true,
  under_medical_treatment BOOLEAN DEFAULT false,
  medical_treatment_details TEXT,
  illness_operation_details TEXT,
  hospitalized BOOLEAN DEFAULT false,
  hospitalized_details TEXT,
  taking_medications BOOLEAN DEFAULT false,
  medications_list TEXT,
  tobacco_use BOOLEAN DEFAULT false,
  dangerous_drugs_use BOOLEAN DEFAULT false,
  
  -- Allergies
  allergic_to JSONB DEFAULT '[]',
  
  -- Medical Conditions
  high_blood_pressure BOOLEAN DEFAULT false,
  low_blood_pressure BOOLEAN DEFAULT false,
  epilepsy_convulsions BOOLEAN DEFAULT false,
  aids_hiv BOOLEAN DEFAULT false,
  std BOOLEAN DEFAULT false,
  fainting BOOLEAN DEFAULT false,
  rapid_weight_loss BOOLEAN DEFAULT false,
  radiation_therapy BOOLEAN DEFAULT false,
  joint_replacement BOOLEAN DEFAULT false,
  heart_surgery BOOLEAN DEFAULT false,
  heart_attack BOOLEAN DEFAULT false,
  thyroid_problem BOOLEAN DEFAULT false,
  heart_disease BOOLEAN DEFAULT false,
  heart_murmur BOOLEAN DEFAULT false,
  liver_disease BOOLEAN DEFAULT false,
  rheumatic_fever BOOLEAN DEFAULT false,
  hay_fever BOOLEAN DEFAULT false,
  respiratory_problems BOOLEAN DEFAULT false,
  hepatitis_jaundice BOOLEAN DEFAULT false,
  tuberculosis BOOLEAN DEFAULT false,
  swollen_ankles BOOLEAN DEFAULT false,
  kidney_disease BOOLEAN DEFAULT false,
  diabetes BOOLEAN DEFAULT false,
  chest_pain BOOLEAN DEFAULT false,
  stroke BOOLEAN DEFAULT false,
  cancer BOOLEAN DEFAULT false,
  anemia BOOLEAN DEFAULT false,
  angina BOOLEAN DEFAULT false,
  asthma BOOLEAN DEFAULT false,
  emphysema BOOLEAN DEFAULT false,
  bleeding_problems BOOLEAN DEFAULT false,
  blood_diseases BOOLEAN DEFAULT false,
  head_injuries BOOLEAN DEFAULT false,
  arthritis BOOLEAN DEFAULT false,
  other_conditions TEXT,
  
  -- For Women
  is_pregnant BOOLEAN,
  is_nursing BOOLEAN,
  taking_birth_control BOOLEAN,
  
  -- Blood Information
  blood_type TEXT,
  blood_pressure TEXT,
  
  -- Consent Forms
  informed_consent_signed BOOLEAN DEFAULT false,
  consent_signature TEXT,
  consent_signed_date TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  denied_at TIMESTAMP,
  approved_by UUID REFERENCES admins(id),
  denied_by UUID REFERENCES admins(id),
  denial_reason TEXT
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admins(id),
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES admins(id),
  cancellation_reason TEXT
);

-- Procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  treatment_date DATE NOT NULL,
  tooth_numbers TEXT[],
  notes TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admins(id)
);

-- Treatment Procedures junction table
CREATE TABLE IF NOT EXISTS treatment_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_registration_status ON patients(registration_status);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_treatments_patient ON treatments(patient_id);
CREATE INDEX idx_notifications_patient ON notifications(patient_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth strategy)
-- For now, allowing all authenticated users full access
-- You should refine these based on your security requirements

-- Patients policies
CREATE POLICY "Enable read access for all users" ON patients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON patients FOR UPDATE USING (true);

-- Appointments policies
CREATE POLICY "Enable all access for authenticated users" ON appointments FOR ALL USING (true);

-- Treatments policies
CREATE POLICY "Enable all access for authenticated users" ON treatments FOR ALL USING (true);

-- Procedures policies
CREATE POLICY "Enable read for all users" ON procedures FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON procedures FOR ALL USING (true);

-- Notifications policies
CREATE POLICY "Enable all access for authenticated users" ON notifications FOR ALL USING (true);

-- Admin policies
CREATE POLICY "Enable all access for authenticated users" ON admins FOR ALL USING (true);