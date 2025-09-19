export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      medical_history_fields: {
        Row: {
          id: string
          field_name: string
          field_type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_name: string
          field_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_name?: string
          field_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          patient_id: string
          first_name: string
          last_name: string
          middle_name: string | null
          date_of_birth: string | null
          gender: string | null
          phone: string | null
          email: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_history: Record<string, any>
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id?: string
          first_name: string
          last_name: string
          middle_name?: string | null
          date_of_birth?: string | null
          gender?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_history?: Record<string, any>
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          first_name?: string
          last_name?: string
          middle_name?: string | null
          date_of_birth?: string | null
          gender?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_history?: Record<string, any>
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          status: string
          reason: string | null
          notes: string | null
          email_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          appointment_date: string
          appointment_time: string
          duration_minutes?: number
          status?: string
          reason?: string | null
          notes?: string | null
          email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          appointment_date?: string
          appointment_time?: string
          duration_minutes?: number
          status?: string
          reason?: string | null
          notes?: string | null
          email_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      procedures: {
        Row: {
          id: string
          name: string
          description: string | null
          default_cost: number | null
          estimated_duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          default_cost?: number | null
          estimated_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          default_cost?: number | null
          estimated_duration?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      treatments: {
        Row: {
          id: string
          patient_id: string
          appointment_id: string | null
          treatment_date: string
          total_cost: number
          payment_status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          appointment_id?: string | null
          treatment_date: string
          total_cost?: number
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          appointment_id?: string | null
          treatment_date?: string
          total_cost?: number
          payment_status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      treatment_procedures: {
        Row: {
          id: string
          treatment_id: string
          procedure_id: string
          quantity: number
          cost_per_unit: number | null
          total_cost: number | null
          tooth_number: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          treatment_id: string
          procedure_id: string
          quantity?: number
          cost_per_unit?: number | null
          total_cost?: number | null
          tooth_number?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          treatment_id?: string
          procedure_id?: string
          quantity?: number
          cost_per_unit?: number | null
          total_cost?: number | null
          tooth_number?: string | null
          notes?: string | null
        }
      }
      qr_registration_tokens: {
        Row: {
          id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          is_read: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          is_read?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Application-specific types
export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Procedure = Database['public']['Tables']['procedures']['Row']
export type Treatment = Database['public']['Tables']['treatments']['Row']
export type TreatmentProcedure = Database['public']['Tables']['treatment_procedures']['Row']
export type MedicalHistoryField = Database['public']['Tables']['medical_history_fields']['Row']
export type QRRegistrationToken = Database['public']['Tables']['qr_registration_tokens']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Form types
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type TreatmentInsert = Database['public']['Tables']['treatments']['Insert']

// Extended types with relationships
export interface PatientWithAppointments extends Patient {
  appointments?: Appointment[]
}

export interface AppointmentWithPatient extends Appointment {
  patient?: Patient
}

export interface TreatmentWithDetails extends Treatment {
  patient?: Patient
  appointment?: Appointment
  treatment_procedures?: (TreatmentProcedure & { procedure?: Procedure })[]
}