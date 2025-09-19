// Database types
export interface AdminUser {
  id: string
  username: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_history: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reason?: string
  notes?: string
  email_sent: boolean
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface Procedure {
  id: string
  name: string
  description?: string
  default_cost?: number
  estimated_duration?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Treatment {
  id: string
  patient_id: string
  appointment_id?: string
  treatment_date: string
  total_cost: number
  payment_status: 'pending' | 'partial' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
  patient?: Patient
  appointment?: Appointment
  procedures?: TreatmentProcedure[]
}

export interface TreatmentProcedure {
  id: string
  treatment_id: string
  procedure_id: string
  quantity: number
  cost_per_unit: number
  total_cost: number
  tooth_number?: string
  notes?: string
  procedure?: Procedure
}

export interface MedicalHistoryField {
  id: string
  field_name: string
  field_type: 'checkbox' | 'text' | 'number'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QRRegistrationToken {
  id: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// Form types
export interface LoginForm {
  username: string
  password: string
}

export interface PatientForm {
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_history?: Record<string, any>
  notes?: string
}

export interface AppointmentForm {
  patient_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  reason?: string
  notes?: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}