import { z } from 'zod'

// XSS Protection - Input sanitization helper
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'&]/g, '') // Remove potential XSS characters
    .trim() // Remove whitespace
    .replace(/\s+/g, ' ') // Normalize whitespace
}

// Enhanced string field with XSS protection
const secureStringField = (minLength = 1, maxLength = 100, required = true) => {
  if (required) {
    return z.string()
      .min(minLength, `Must be at least ${minLength} characters`)
      .max(maxLength)
      .transform(sanitizeInput)
      .refine(val => !/^\s*$/.test(val), 'Cannot be only whitespace')
  }
  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.union([
      z.string()
        .max(maxLength)
        .transform(sanitizeInput)
        .refine(val => !/^\s*$/.test(val), 'Cannot be only whitespace'),
      z.null()
    ]).optional()
  )
}

// Robust date validation helper
const isValidDate = (dateString: string): { isValid: boolean; error?: string } => {
  // Check format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' }
  }

  const [year, month, day] = dateString.split('-').map(Number)

  // Check basic ranges
  if (year < 1900 || year > 2100) {
    return { isValid: false, error: 'Year must be between 1900 and 2100' }
  }
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Month must be between 1 and 12' }
  }
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Day must be between 1 and 31' }
  }

  // Check days per month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // Handle leap year for February
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    daysInMonth[1] = isLeapYear ? 29 : 28
  }

  if (day > daysInMonth[month - 1]) {
    return { isValid: false, error: `${month}/${day}/${year} is not a valid date` }
  }

  // Additional check: create date and verify it matches input
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { isValid: false, error: 'Invalid date' }
  }

  return { isValid: true }
}

// Enhanced date validation with proper date checking
const birthDateField = () => {
  const currentDate = new Date()
  const maxDate = new Date() // Allow any date up to today (newborns allowed)
  const minDate = new Date(currentDate.getFullYear() - 120, currentDate.getMonth(), currentDate.getDate()) // Maximum 120 years old

  return z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.union([
      z.string()
        .refine(val => {
          const validation = isValidDate(val)
          return validation.isValid
        }, {
          message: 'Invalid date format'
        })
        .refine(val => {
          const date = new Date(val)
          return date <= maxDate
        }, 'Birth date cannot be in the future')
        .refine(val => {
          const date = new Date(val)
          return date >= minDate
        }, 'Invalid birth date (too old)'),
      z.null()
    ]).nullable()
  )
}

// General date field validation for appointments, treatments, etc.
const dateField = (fieldName = 'Date') => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine(val => {
      const validation = isValidDate(val)
      return validation.isValid
    }, {
      message: 'Invalid date format'
    })
}

// Auth schemas
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

// Helper function to transform empty strings to null for optional fields (LEGACY - use secureStringField instead)
const optionalStringField = (fieldName?: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.union([z.string().min(1).transform(sanitizeInput), z.null()]).nullable()
  )

// Helper function for optional phone validation
const optionalPhoneField = (fieldName?: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.union([
      z.string().regex(/^09\d{9}$/, 'Phone must be exactly 11 digits starting with 09'),
      z.null()
    ]).nullable()
  )

// Helper function for optional email validation
const optionalEmailField = () =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.union([z.string().email('Invalid email'), z.null()]).nullable()
  )

// Patient schemas (keeping original structure for compatibility)
export const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).transform(sanitizeInput),
  last_name: z.string().min(1, 'Last name is required').max(100).transform(sanitizeInput),
  middle_name: optionalStringField(),
  date_of_birth: birthDateField(),
  gender: optionalStringField(),
  phone: optionalPhoneField(),
  email: optionalEmailField(),
  address: optionalStringField(),
  emergency_contact_name: optionalStringField(),
  emergency_contact_phone: optionalPhoneField(),
  medical_history: z.record(z.string(), z.any()).optional().default({}),
  notes: optionalStringField(),
})

// Duplicate patient detection schema
export const duplicateCheckSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

// Appointment schemas
export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_date: dateField('Appointment date'),
  appointment_time: z.string().min(1, 'Time is required'),
  duration_minutes: z.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 8 hours'),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

// Procedure schemas
export const procedureSchema = z.object({
  name: z.string().min(1, 'Procedure name is required').max(200),
  description: z.string().optional(),
  default_cost: z.number().min(0, 'Cost must be positive').nullable().optional(),
  estimated_duration: z.number().min(0, 'Duration cannot be negative').nullable().optional(),
  is_active: z.boolean().default(true),
})

// Treatment schemas
export const treatmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_id: z.string().uuid('Invalid appointment ID').optional(),
  treatment_date: dateField('Treatment date'),
  total_cost: z.number().min(0, 'Cost must be positive'),
  payment_status: z.enum(['pending', 'partial', 'paid']),
  notes: z.string().optional(),
})

export const treatmentProcedureSchema = z.object({
  procedure_id: z.string().uuid('Invalid procedure ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  cost_per_unit: z.number().min(0, 'Cost must be positive'),
  tooth_number: z.string().optional(),
  notes: z.string().optional(),
})

// Medical history field schemas
export const medicalHistoryFieldSchema = z.object({
  field_name: z.string().min(1, 'Field name is required').max(200),
  field_type: z.enum(['checkbox', 'text', 'number']),
  is_active: z.boolean().default(true),
})

// QR registration schemas
export const qrRegistrationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  patient_data: patientSchema,
})

// Notification schemas
export const notificationSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required'),
})

// Export types
export type LoginSchema = z.infer<typeof loginSchema>
export type PatientSchema = z.infer<typeof patientSchema>
export type AppointmentSchema = z.infer<typeof appointmentSchema>
export type ProcedureSchema = z.infer<typeof procedureSchema>
export type TreatmentSchema = z.infer<typeof treatmentSchema>
export type TreatmentProcedureSchema = z.infer<typeof treatmentProcedureSchema>
export type MedicalHistoryFieldSchema = z.infer<typeof medicalHistoryFieldSchema>
export type QRRegistrationSchema = z.infer<typeof qrRegistrationSchema>
export type NotificationSchema = z.infer<typeof notificationSchema>
export type DuplicateCheckSchema = z.infer<typeof duplicateCheckSchema>