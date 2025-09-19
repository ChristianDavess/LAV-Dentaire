-- Seed data for LAV Dentaire Dental Clinic

-- Insert default admin user (password: admin123)
-- Password hash is for 'admin123' using bcrypt
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmVUh4lGzB2l5Du', 'admin@lavdentaire.com');

-- Insert default medical history fields
INSERT INTO medical_history_fields (field_name, field_type, is_active) VALUES
('Allergies', 'text', true),
('Current Medications', 'text', true),
('Heart Disease', 'checkbox', true),
('High Blood Pressure', 'checkbox', true),
('Diabetes', 'checkbox', true),
('Pregnancy', 'checkbox', true),
('Smoking', 'checkbox', true),
('Previous Dental Surgery', 'checkbox', true),
('Bleeding Disorders', 'checkbox', true),
('Kidney Disease', 'checkbox', true);

-- Insert default procedures
INSERT INTO procedures (name, description, default_cost, estimated_duration, is_active) VALUES
('Dental Cleaning', 'Regular teeth cleaning and polishing', 1500.00, 60, true),
('Tooth Extraction', 'Simple tooth extraction', 2500.00, 30, true),
('Dental Filling', 'Composite or amalgam filling', 2000.00, 45, true),
('Root Canal Treatment', 'Endodontic treatment', 8000.00, 90, true),
('Crown Placement', 'Dental crown installation', 12000.00, 120, true),
('Teeth Whitening', 'Professional teeth whitening', 5000.00, 60, true),
('Dental Implant', 'Single tooth implant', 25000.00, 180, true),
('Orthodontic Consultation', 'Braces consultation', 1000.00, 45, true),
('Emergency Treatment', 'Emergency dental care', 3000.00, 60, true),
('Dental X-Ray', 'Digital dental radiography', 800.00, 15, true);

-- Insert sample patients
INSERT INTO patients (first_name, last_name, middle_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, medical_history, notes) VALUES
('Maria', 'Santos', 'Cruz', '1985-03-15', 'Female', '+63-912-345-6789', 'maria.santos@email.com', '123 Rizal Street, Quezon City', 'Juan Santos', '+63-912-345-6790', '{"Heart Disease": false, "High Blood Pressure": true, "Diabetes": false, "Allergies": "Penicillin"}', 'Regular patient, prefers morning appointments'),
('John', 'Dela Cruz', 'Miguel', '1990-07-22', 'Male', '+63-917-123-4567', 'john.delacruz@email.com', '456 EDSA, Makati City', 'Ana Dela Cruz', '+63-917-123-4568', '{"Heart Disease": false, "High Blood Pressure": false, "Diabetes": false, "Smoking": true}', 'Needs regular follow-up for gum care'),
('Ana', 'Rodriguez', 'Luna', '1978-11-08', 'Female', '+63-925-987-6543', 'ana.rodriguez@email.com', '789 Ayala Avenue, Cebu City', 'Pedro Rodriguez', '+63-925-987-6544', '{"Heart Disease": false, "High Blood Pressure": false, "Diabetes": true, "Pregnancy": false}', 'Diabetic patient, requires special care');

-- Insert sample appointments
INSERT INTO appointments (patient_id, appointment_date, appointment_time, duration_minutes, status, reason, notes) VALUES
((SELECT id FROM patients WHERE first_name = 'Maria' AND last_name = 'Santos'), CURRENT_DATE + INTERVAL '1 day', '09:00:00', 60, 'scheduled', 'Regular cleaning and checkup', 'Patient requested morning slot'),
((SELECT id FROM patients WHERE first_name = 'John' AND last_name = 'Dela Cruz'), CURRENT_DATE + INTERVAL '2 days', '14:00:00', 45, 'scheduled', 'Dental filling', 'Follow-up from previous visit'),
((SELECT id FROM patients WHERE first_name = 'Ana' AND last_name = 'Rodriguez'), CURRENT_DATE + INTERVAL '3 days', '10:30:00', 90, 'scheduled', 'Root canal consultation', 'Patient experiencing pain');

-- Insert sample notifications
INSERT INTO notifications (type, title, message, is_read) VALUES
('appointment_reminder', 'Upcoming Appointments', 'You have 3 appointments scheduled for tomorrow', false),
('system', 'Welcome to LAV Dentaire', 'Dental clinic management system is now active', false),
('appointment_reminder', 'Weekly Schedule', 'View your weekly appointment schedule in the dashboard', true);