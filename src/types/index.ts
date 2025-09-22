// Re-export all database types from the generated database types
export * from './database'

// Re-export form types
export * from './forms'

// Re-export API types
export * from './api'

// Convenience type aliases for common use cases
export type {
  Patient,
  Appointment,
  Procedure,
  Treatment,
  TreatmentProcedure,
  TreatmentWithDetails,
  AdminUser,
  MedicalHistoryField,
  QRRegistrationToken,
  Notification
} from './database'