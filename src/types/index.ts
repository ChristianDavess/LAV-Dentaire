export type RegistrationStatus = 'pending' | 'approved' | 'denied';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type NotificationType = 'registration_pending' | 'registration_approved' | 'registration_denied' | 'appointment_reminder' | 'appointment_cancelled';

export interface Admin {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  registration_status: RegistrationStatus;
  
  // Personal Information
  first_name: string;
  last_name: string;
  middle_name?: string;
  birthdate: string;
  age: number;
  sex: string;
  nationality?: string;
  nickname?: string;
  home_no?: string;
  office_no?: string;
  fax_no?: string;
  mobile_no?: string;
  email: string;
  address?: string;
  occupation?: string;
  dental_insurance?: string;
  effective_date?: string;
  
  // Dental History
  previous_dentist?: string;
  last_dental_visit?: string;
  
  // Medical History
  physician_name?: string;
  specialty?: string;
  office_address?: string;
  office_number?: string;
  is_good_health: boolean;
  under_medical_treatment: boolean;
  medical_treatment_details?: string;
  illness_operation_details?: string;
  hospitalized: boolean;
  hospitalized_details?: string;
  taking_medications: boolean;
  medications_list?: string;
  tobacco_use: boolean;
  dangerous_drugs_use: boolean;
  
  // Allergies
  allergic_to?: string[];
  
  // Medical Conditions
  high_blood_pressure: boolean;
  low_blood_pressure: boolean;
  epilepsy_convulsions: boolean;
  aids_hiv: boolean;
  std: boolean;
  fainting: boolean;
  rapid_weight_loss: boolean;
  radiation_therapy: boolean;
  joint_replacement: boolean;
  heart_surgery: boolean;
  heart_attack: boolean;
  thyroid_problem: boolean;
  heart_disease: boolean;
  heart_murmur: boolean;
  liver_disease: boolean;
  rheumatic_fever: boolean;
  hay_fever: boolean;
  respiratory_problems: boolean;
  hepatitis_jaundice: boolean;
  tuberculosis: boolean;
  swollen_ankles: boolean;
  kidney_disease: boolean;
  diabetes: boolean;
  chest_pain: boolean;
  stroke: boolean;
  cancer: boolean;
  anemia: boolean;
  angina: boolean;
  asthma: boolean;
  emphysema: boolean;
  bleeding_problems: boolean;
  blood_diseases: boolean;
  head_injuries: boolean;
  arthritis: boolean;
  other_conditions?: string;
  
  // For Women
  is_pregnant?: boolean;
  is_nursing?: boolean;
  taking_birth_control?: boolean;
  
  // Blood Information
  blood_type?: string;
  blood_pressure?: string;
  
  // Consent Forms
  informed_consent_signed: boolean;
  consent_signature?: string;
  consent_signed_date?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at?: string;
  denied_at?: string;
  approved_by?: string;
  denied_by?: string;
  denial_reason?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient?: Patient;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
}

export interface Procedure {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  patient_id: string;
  patient?: Patient;
  appointment_id?: string;
  appointment?: Appointment;
  treatment_date: string;
  tooth_numbers?: string[];
  notes?: string;
  total_amount: number;
  payment_status: PaymentStatus;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  procedures?: TreatmentProcedure[];
}

export interface TreatmentProcedure {
  id: string;
  treatment_id: string;
  procedure_id: string;
  procedure?: Procedure;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Notification {
  id: string;
  patient_id: string;
  patient?: Patient;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  monthlyRevenue: number;
  pendingRegistrations: number;
}

export interface MedicalConditionLabels {
  [key: string]: string;
}

export const medicalConditionLabels: MedicalConditionLabels = {
  high_blood_pressure: 'High Blood Pressure',
  low_blood_pressure: 'Low Blood Pressure',
  epilepsy_convulsions: 'Epilepsy / Convulsions',
  aids_hiv: 'AIDS or HIV Infection',
  std: 'Sexually Transmitted Disease',
  fainting: 'Fainting Seizure',
  rapid_weight_loss: 'Rapid Weight Loss',
  radiation_therapy: 'Radiation Therapy',
  joint_replacement: 'Joint Replacement / Implant',
  heart_surgery: 'Heart Surgery',
  heart_attack: 'Heart Attack',
  thyroid_problem: 'Thyroid Problem',
  heart_disease: 'Heart Disease',
  heart_murmur: 'Heart Murmur',
  liver_disease: 'Hepatitis / Liver Disease',
  rheumatic_fever: 'Rheumatic Fever',
  hay_fever: 'Hay Fever / Allergies',
  respiratory_problems: 'Respiratory Problems',
  hepatitis_jaundice: 'Hepatitis / Jaundice',
  tuberculosis: 'Tuberculosis',
  swollen_ankles: 'Swollen Ankles',
  kidney_disease: 'Kidney Disease',
  diabetes: 'Diabetes',
  chest_pain: 'Chest pain',
  stroke: 'Stroke',
  cancer: 'Cancer',
  anemia: 'Anemia',
  angina: 'Angina',
  asthma: 'Asthma',
  emphysema: 'Emphysema',
  bleeding_problems: 'Bleeding Problems',
  blood_diseases: 'Blood Diseases',
  head_injuries: 'Head Injuries',
  arthritis: 'Arthritis / Rheumatism',
};