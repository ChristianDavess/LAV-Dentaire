// Form types for the application
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