// Application constants
export const APP_NAME = 'LAV Dentaire'
export const APP_DESCRIPTION = 'Dental Clinic Management System'

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  PATIENTS: '/api/patients',
  APPOINTMENTS: '/api/appointments',
  TREATMENTS: '/api/treatments',
  PROCEDURES: '/api/procedures',
  NOTIFICATIONS: '/api/notifications',
  QR_REGISTRATION: '/api/qr-registration',
} as const

// Patient ID format
export const PATIENT_ID_PREFIX = 'P'
export const PATIENT_ID_LENGTH = 3

// Appointment statuses
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const

// Payment statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const

// Medical history field types
export const FIELD_TYPES = {
  CHECKBOX: 'checkbox',
  TEXT: 'text',
  NUMBER: 'number',
} as const